const {omit} = require('./util')

function nameparams (offset, len) {
  return Array(len)
    .fill()
    .map((_, ix) => `$${(ix + offset + 1)}~`)
}

function valparams (offset, len) {
  return Array(len)
    .fill()
    .map((_, ix) => `$${(ix + offset + 1)}`)
}

function excludeds (offset, len) {
  return Array(len)
    .fill()
    .map((_, ix) => `$${(ix + offset + 1)}~=EXCLUDED.$${(ix + offset + 1)}~`)
}

function keyvals (offset, len, distance = len) {
  return Array(len)
    .fill()
    .map((_, ix) => `$${(ix + offset + 1)}~=$${(ix + offset + distance + 1)}`)
}

function preparevalue (v) {
  const isobject = (v !== null &&
    !(v instanceof Array) &&
    !(v instanceof Date) &&
    typeof v === 'object')

  return isobject ? JSON.stringify(v) : v
}

/**
 * Methods
 */
function del (table, filter) {

}

function insert (table, data) {
  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))

  const len = columns.length
  const sql = `INSERT INTO $1~(${nameparams(1, len).join(', ')}) VALUES(${valparams(len + 1, len).join(', ')}) RETURNING id;`
  const params = [table]
    .concat(columns)
    .concat(values)
  return {sql, params}
}

function select (table, filter) {

}

function truncate (table) {
  return {
    sql: 'TRUNCATE TABLE $1~;',
    params: [table]
  }
}

function update (table, data, where) {
  if (!where) {
    where = {id: data.id}
    data = omit(data, 'id')
  } else if (typeof where !== 'object') {
    where = {id: where}
  }

  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))
  const len = columns.length
  const kv = keyvals(1, len).join(', ')

  const wcolumns = Object.keys(where)
  const wvalues = wcolumns.map(c => preparevalue(where[c]))
  const wlen = wcolumns.length
  const wheres = keyvals((2 * len) + 1, wlen).join(' AND ')

  const sql = `UPDATE $1~ SET ${kv} WHERE ${wheres};`
  const params = [table]
    .concat(columns)
    .concat(values)
    .concat(wcolumns)
    .concat(wvalues)
  return {sql, params}
}

function upsert (table, id, data) {
  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))

  const len = columns.length
  const nps = nameparams(1, len + 1).join(', ')
  const vps = valparams(len + 2, len + 1).join(', ')
  const excl = excludeds(2, len).join(', ')

  const sql = `INSERT INTO $1~(${nps}) VALUES(${vps}) \
ON CONFLICT(id) DO UPDATE SET ${excl} RETURNING id;`
  const params = [table]
    .concat(['id'])
    .concat(columns)
    .concat(id)
    .concat(values)
  return {sql, params}
}

function deparameterise ({sql, params}) {
  for (let i = 0; i < params.length; i++) {
    const rxName = new RegExp('\\$' + (i + 1) + '~', 'g')
    const rxVal = new RegExp('\\$' + (i + 1) + '([, ;)])', 'g')
    const name = params[i]
    const val = name instanceof Array
      ? `'${JSON.stringify(name)}'`
      : JSON.stringify(name)
      .replace(/\\"/g, '@#€%&/*')
      .replace(/"/g, "'")
      .replace(/@#€%&\/\*/g, '"')
    sql = sql
      .replace(rxName, name)
      .replace(rxVal, `${val}$1`)
  }
  return sql
}

module.exports = {del, insert, select, truncate, update, upsert, deparameterise}
