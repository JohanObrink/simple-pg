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

module.exports = (options) => (connection) => Object.assign({
  insert,
  update,
  upsert
}, pgp(options)(connection))