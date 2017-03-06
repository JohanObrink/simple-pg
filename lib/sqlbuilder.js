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
  let params = [table]
  let where = ''
  if (filter) {
    const wcolumns = Object.keys(filter)
    const wvalues = wcolumns.map(c => preparevalue(filter[c]))
    const wlen = wcolumns.length
    const wheres = keyvals(1, wlen).join(' AND ')
    where = ` WHERE ${wheres}`
    params = params.concat(wcolumns).concat(wvalues)
  }
  const sql = `DELETE FROM $1~${where};`
  return {sql, params}
}

function insert (table, idcol, data) {
  if (!data && typeof idcol === 'object') {
    data = idcol
    idcol = 'id'
  }
  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))

  const len = columns.length
  const nps = nameparams(1, len).join(', ')
  const vps = valparams(len + 1, len).join(', ')

  const params = [table]
    .concat(columns)
    .concat(values)
    .concat([idcol])
  const sql = `INSERT INTO $1~(${nps}) VALUES(${vps}) RETURNING $${params.length}~;`

  return {sql, params}
}

function select (table, filter = {}) {
  let params = [table]
  const sqlParts = []

  // columns
  let columns = '*'
  if (filter.columns) {
    columns = filter.columns.map((c, ix) => `$${ix + params.length + 1}~`).join(', ')
    params = params.concat(filter.columns)
  }
  sqlParts.push(`SELECT ${columns} FROM $1~`)

  // where
  if (filter.where) {
    const columns = Object.keys(filter.where)
    const values = columns.map(c => preparevalue(filter.where[c]))
    const wheres = keyvals(params.length, columns.length).join(' AND ')
    params = params.concat(columns).concat(values)
    sqlParts.push(`WHERE ${wheres}`)
  }

  // limit
  if (typeof filter.limit === 'number') {
    params.push(filter.limit)
    sqlParts.push(`LIMIT $${params.length}`)
  }

  // offset
  if (typeof filter.offset === 'number') {
    params.push(filter.offset)
    sqlParts.push(`OFFSET $${params.length}`)
  }

  const sql = sqlParts.filter(p => p).join(' ') + ';'
  return {sql, params}
}

function truncate (table) {
  return {
    sql: 'TRUNCATE TABLE $1~ RESTART IDENTITY;',
    params: [table]
  }
}

function update (table, idcol, data, where) {
  if (typeof idcol === 'object') {
    where = data
    data = idcol
    idcol = 'id'
  }
  if (!where) {
    where = {[idcol]: data[idcol]}
    data = omit(data, idcol)
  }

  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))
  const len = columns.length
  const kv = keyvals(1, len).join(', ')

  const wcolumns = Object.keys(where)
  const wvalues = wcolumns.map(c => preparevalue(where[c]))
  const wlen = wcolumns.length
  const wheres = keyvals((2 * len) + 1, wlen).join(' AND ')

  const params = [table]
    .concat(columns)
    .concat(values)
    .concat(wcolumns)
    .concat(wvalues)
    .concat([idcol])
  const sql = `UPDATE $1~ SET ${kv} WHERE ${wheres} RETURNING $${params.length}~;`
  return {sql, params}
}

function upsert (table, idcol, data) {
  if (!data && typeof idcol === 'object') {
    data = idcol
    idcol = 'id'
  }
  const id = data[idcol]
  data = omit(data, idcol)

  const columns = Object.keys(data)
  const values = columns.map(c => preparevalue(data[c]))

  const len = columns.length
  const nps = nameparams(1, len + 1).join(', ')
  const vps = valparams(len + 2, len + 1).join(', ')
  const excl = excludeds(2, len).join(', ')

  const sql = `INSERT INTO $1~(${nps}) VALUES(${vps}) \
ON CONFLICT($2~) DO UPDATE SET ${excl} RETURNING $2~;`
  const params = [table]
    .concat([idcol])
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
