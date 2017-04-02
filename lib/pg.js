const pgp = require('pg-promise')
const sqlbuilder = require('./sqlbuilder')

function select (table, filter) {
  const {sql, params} = sqlbuilder.select(table, filter)
  return this.query(sql, params)
}

function insert (table, idcol, data) {
  if (!data && typeof idcol === 'object') {
    data = idcol
    idcol = 'id'
  }
  const {sql, params} = sqlbuilder.insert(table, idcol, data)
  return this
    .one(sql, params)
}

function update (table, idcol, data, where) {
  const {sql, params} = sqlbuilder.update(table, idcol, data, where)
  return this
    .query(sql, params)
}

function upsert (table, idcol, data) {
  const {sql, params} = sqlbuilder.upsert(table, idcol, data)
  return this.query(sql, params)
}

function del (table, where) {
  if (arguments.length === 2 && !where) {
    return Promise.reject('Delete missing WHERE parameter')
  }
  const {sql, params} = sqlbuilder.del(table, where)
  return this.query(sql, params)
}

function batchUpsert (upserts) {
  return this
    .tx((t) => t
      .batch(upserts
        .map(args => {
          const {sql, params} = sqlbuilder.upsert(...args)
          return t.query(sql, params)
        })))
}

module.exports = (options) => (connection) => Object.assign({
  select,
  insert,
  update,
  upsert,
  batchUpsert,
  del
}, pgp(options)(connection))
