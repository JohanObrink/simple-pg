const {expect} = require('chai')
const {insert, truncate, update, upsert} = require(`${process.cwd()}/lib/sqlbuilder`)

describe('sqlbuilder', () => {
  describe('insert', () => {
    it('creates a simple insert', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~) VALUES($4, $5) RETURNING id;',
        params: ['my_table', 'name', 'age', 'johan', 43]
      }
      expect(insert('my_table', {name: 'johan', age: 43}))
        .to.eql(expected)
    })
    it('handles json type', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~) VALUES($3) RETURNING id;',
        params: ['my_table', 'data', '{"name":"johan","age":43}']
      }
      expect(insert('my_table', {data: {name: 'johan', age: 43}}))
        .to.eql(expected)
    })
    it('handles array type', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~) VALUES($3) RETURNING id;',
        params: ['my_table', 'hobbies', ['code', 'beer']]
      }
      expect(insert('my_table', {hobbies: ['code', 'beer']}))
        .to.eql(expected)
    })
  })
  describe('truncate', () => {
    it('creates a TRUNCATE query', () => {
      expect(truncate('my_table')).to.eql({
        sql: 'TRUNCATE TABLE $1~;',
        params: ['my_table']
      })
    })
  })
  describe('update', () => {
    it('creates an update with supplied where', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$5, $3~=$6, $4~=$7 WHERE $8~=$10 AND $9~=$11;',
        params: [
          // table name
          'my_table',
          // column names for SET
          'name',
          'age',
          'hobbies',
          // values for SET
          'johan',
          43,
          ['code', 'beer'],
          // column names for WHERE
          'id',
          'active',
          // values for WHERE
          '1',
          true
        ]
      }
      expect(update('my_table', {name: 'johan', age: 43, hobbies: ['code', 'beer']}, {id: '1', active: true}))
        .to.eql(expected)
    })
    it('creates an update with simple value', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$3 WHERE $4~=$5;',
        params: ['my_table', 'name', 'johan', 'id', '1']
      }
      expect(update('my_table', {name: 'johan'}, '1'))
        .to.eql(expected)
    })
    it('creates an update with id in object', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$3 WHERE $4~=$5;',
        params: ['my_table', 'name', 'johan', 'id', '1']
      }
      expect(update('my_table', {id: '1', name: 'johan'}))
        .to.eql(expected)
    })
  })
  describe('upsert', () => {
    it('builds a proper upsert query', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~, $4~) VALUES($5, $6, $7) ON CONFLICT(id) DO UPDATE SET $3~=EXCLUDED.$3~, $4~=EXCLUDED.$4~ RETURNING id;',
        params: [
          'my_table',
          'id',
          'name',
          'age',
          '1',
          'johan',
          43
        ]
      }
      expect(upsert('my_table', '1', {name: 'johan', age: 43}))
        .to.eql(expected)
    })
  })
})
