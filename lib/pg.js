const pgp = require('pg-promise')
const sqlbuilder = require('./sqlbuilder')

function insert (table, data) {
  const {sql, params} = sqlbuilder.insert(table, data)
  return this.query(sql, params)
}

function update (table, data, where) {
  const {sql, params} = sqlbuilder.update(table, data, where)
  return this.query(sql, params)
}

function upsert (table, data, where) {
  const {sql, params} = sqlbuilder.upsert(table, data, where)
  return this.query(sql, params)
}

function del (table, where) {
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
  insert,
  update,
  upsert,
  batchUpsert,
  del
}, pgp(options)(connection))
