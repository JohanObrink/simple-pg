const {expect} = require('chai')
const {select, insert, truncate, update, upsert, del} = require(`${process.cwd()}/lib/sqlbuilder`)

describe('sqlbuilder', () => {
  describe('#select', () => {
    it('creates a simple select', () => {
      const expected = {
        sql: 'SELECT * FROM $1~;',
        params: ['my_table']
      }
      expect(select('my_table'))
        .to.eql(expected)
    })
    it('creates select with named columns', () => {
      const expected = {
        sql: 'SELECT $2~, $3~ FROM $1~;',
        params: ['my_table', 'id', 'name']
      }
      expect(select('my_table', {columns: ['id', 'name']}))
        .to.eql(expected)
    })
    it('creates select with where', () => {
      const expected = {
        sql: 'SELECT * FROM $1~ WHERE $2~=$4 AND $3~=$5;',
        params: ['my_table', 'id', 'name', '1', 'johan']
      }
      expect(select('my_table', {where: {id: '1', name: 'johan'}}))
        .to.eql(expected)
    })
    it('creates select with limit', () => {
      const expected = {
        sql: 'SELECT * FROM $1~ LIMIT $2;',
        params: ['my_table', 100]
      }
      expect(select('my_table', {limit: 100}))
        .to.eql(expected)
    })
    it('creates select with offset', () => {
      const expected = {
        sql: 'SELECT * FROM $1~ OFFSET $2;',
        params: ['my_table', 100]
      }
      expect(select('my_table', {offset: 100}))
        .to.eql(expected)
    })
    it('creates select with all params', () => {
      const expected = {
        sql: 'SELECT $2~, $3~ FROM $1~ WHERE $4~=$6 AND $5~=$7 LIMIT $8 OFFSET $9;',
        params: ['my_table', 'id', 'active', 'name', 'age', 'johan', 43, 100, 50]
      }
      expect(select('my_table', {
        columns: ['id', 'active'],
        where: {name: 'johan', age: 43},
        limit: 100,
        offset: 50
      })).to.eql(expected)
    })
  })
  describe('#insert', () => {
    it('creates a simple insert', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~) VALUES($4, $5) RETURNING $6~;',
        params: ['my_table', 'name', 'age', 'johan', 43, 'id']
      }
      expect(insert('my_table', {name: 'johan', age: 43}))
        .to.eql(expected)
    })
    it('creates a simple insert with specified id', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~) VALUES($4, $5) RETURNING $6~;',
        params: ['my_table', 'name', 'age', 'johan', 43, 'user_id']
      }
      expect(insert('my_table', 'user_id', {name: 'johan', age: 43}))
        .to.eql(expected)
    })
    it('handles json type', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~) VALUES($3) RETURNING $4~;',
        params: ['my_table', 'data', '{"name":"johan","age":43}', 'id']
      }
      expect(insert('my_table', {data: {name: 'johan', age: 43}}))
        .to.eql(expected)
    })
    it('handles array type', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~) VALUES($3) RETURNING $4~;',
        params: ['my_table', 'hobbies', ['code', 'beer'], 'id']
      }
      expect(insert('my_table', {hobbies: ['code', 'beer']}))
        .to.eql(expected)
    })
  })
  describe('#truncate', () => {
    it('creates a TRUNCATE query', () => {
      expect(truncate('my_table')).to.eql({
        sql: 'TRUNCATE TABLE $1~ RESTART IDENTITY;',
        params: ['my_table']
      })
    })
  })
  describe('#update', () => {
    it('creates an update with supplied where', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$5, $3~=$6, $4~=$7 WHERE $8~=$10 AND $9~=$11 RETURNING $12~;',
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
          true,
          'id'
        ]
      }
      expect(update('my_table', {name: 'johan', age: 43, hobbies: ['code', 'beer']}, {id: '1', active: true}))
        .to.eql(expected)
    })
    it('creates an update with supplied where and named id column', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$5, $3~=$6, $4~=$7 WHERE $8~=$10 AND $9~=$11 RETURNING $12~;',
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
          'name',
          'active',
          // values for WHERE
          'Johan',
          true,
          'user_id'
        ]
      }
      expect(update('my_table', 'user_id', {name: 'johan', age: 43, hobbies: ['code', 'beer']}, {name: 'Johan', active: true}))
        .to.eql(expected)
    })
    it('creates an update with default id column', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$3 WHERE $4~=$5 RETURNING $6~;',
        params: ['my_table', 'name', 'johan', 'id', '1', 'id']
      }
      expect(update('my_table', {id: '1', name: 'johan'}))
        .to.eql(expected)
    })
    it('creates an update with named id column', () => {
      const expected = {
        sql: 'UPDATE $1~ SET $2~=$3 WHERE $4~=$5 RETURNING $6~;',
        params: ['my_table', 'name', 'johan', 'user_id', '1', 'user_id']
      }
      expect(update('my_table', 'user_id', {user_id: '1', name: 'johan'}))
        .to.eql(expected)
    })
  })
  describe('#upsert', () => {
    it('builds a proper upsert query', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~, $4~) VALUES($5, $6, $7) ON CONFLICT($2~) DO UPDATE SET $3~=EXCLUDED.$3~, $4~=EXCLUDED.$4~ RETURNING $2~;',
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
      expect(upsert('my_table', {id: '1', name: 'johan', age: 43}))
        .to.eql(expected)
    })
    it('builds a proper upsert query with named id column', () => {
      const expected = {
        sql: 'INSERT INTO $1~($2~, $3~, $4~) VALUES($5, $6, $7) ON CONFLICT($2~) DO UPDATE SET $3~=EXCLUDED.$3~, $4~=EXCLUDED.$4~ RETURNING $2~;',
        params: [
          'my_table',
          'user_id',
          'name',
          'age',
          '1',
          'johan',
          43
        ]
      }
      expect(upsert('my_table', 'user_id', {user_id: '1', name: 'johan', age: 43}))
        .to.eql(expected)
    })
  })
  describe('#del', () => {
    it('builds a delete query', () => {
      const expected = {
        sql: 'DELETE FROM $1~;',
        params: [
          'my_table'
        ]
      }
      expect(del('my_table'))
        .to.eql(expected)
    })
    it('builds a delete query with supplied where', () => {
      const expected = {
        sql: 'DELETE FROM $1~ WHERE $2~=$4 AND $3~=$5;',
        params: [
          'my_table',
          'id',
          'user_id',
          '1',
          2001
        ]
      }
      expect(del('my_table', {id: '1', user_id: 2001}))
        .to.eql(expected)
    })
  })
})
