const {expect} = require('chai')
const moment = require('moment')
const options = {
  host: 'localhost',
  port: 5432,
  database: 'simple',
  user: 'tester',
  password: 'password'
}
const pg = require(`${process.cwd()}/lib/pg`)()
const db = pg(options)

before(() => {
  return db
    .query(
      `CREATE TABLE IF NOT EXISTS test (
        id bigserial NOT NULL,
        "name" character varying(64),
        age integer,
        active boolean,
        born date,
        modified timestamp without time zone,
        profile json,
        hobbies text[],
        PRIMARY KEY(id)
      );
    `)
})

afterEach(() => {
  return db.query(`TRUNCATE TABLE test RESTART IDENTITY;`)
})

after(() => {
  return db.query(`DROP TABLE test;`)
})

describe('pg', () => {
  let d, sql
  beforeEach(() => {
    d = {
      name: 'johan',
      age: 43,
      active: true,
      born: moment('1973-04-16').utc().toDate(),
      modified: moment().utc().toDate(),
      profile: {foo: 'bar', herp: 'derp'},
      hobbies: ['movies', 'beer']
    }
    sql = `SELECT * FROM test`
  })
  describe('#query', () => {
    it('passes calls through to original method', () => {
      const insert = `INSERT INTO test(name, age, active, born, modified, profile, hobbies)
        VALUES($1, $2, $3, $4, $5, $6, $7)`
      const params = [d.name, d.age, d.active, d.born, d.modified, JSON.stringify(d.profile), d.hobbies]

      return db
        .query(insert, params)
        .then(res => {
          return db.query(sql)
        })
        .then(res => {
          d.id = '1'
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('#select', () => {
    beforeEach(() => {
      const sql = `INSERT INTO "test"(name, age, active) VALUES\
        ('foo', 20, true),\
        ('bar', 20, false),\
        ('baz', 20, true),\
        ('herp', 60, true),\
        ('derp', 20, true),\
        ('tim', 20, true);`
      return db.query(sql, [])
    })
    it('builds a working select query without filters', () => {
      return db
        .select('test')
        .then(res => {
          expect(res).to.have.length(6)
        })
    })
    it('builds a working select query using filters', () => {
      return db
        .select('test', {
          columns: ['id', 'name'],
          where: {active: true, age: 20},
          offset: 1,
          limit: 2
        })
        .then(res => {
          expect(res).to.eql([
            {id: '3', name: 'baz'},
            {id: '5', name: 'derp'}
          ])
        })
    })
  })
  describe('#insert', () => {
    it('serialises and inserts an object correctly', () => {
      return db
        .insert('test', d)
        .then(res => {
          d.id = '1'
          expect(res).to.eql({id: '1'})
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
    it('serialises and inserts an object correctly with specified id column', () => {
      return db
        .insert('test', 'id', d)
        .then(res => {
          d.id = '1'
          expect(res).to.eql({id: '1'})
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('#update', () => {
    it('serialises and updates an object correctly', () => {
      return db
        .insert('test', d)
        .then(res => {
          d.id = res.id
          d.name = 'alex'
          return db.update('test', d)
        })
        .then(res => {
          expect(res).to.eql([{id: '1'}])
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
    it('serialises and updates an object correctly with specified id column', () => {
      return db
        .insert('test', d)
        .then(res => {
          d.id = res.id
          d.name = 'alex'
          return db.update('test', 'id', d)
        })
        .then(res => {
          expect(res).to.eql([{id: '1'}])
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
    it('serialises and updates an object correctly with specified where', () => {
      return db
        .insert('test', d)
        .then(res => {
          d.id = '1'
          d.name = 'alex'
          return db.update('test', d, {name: 'johan', age: 43})
        })
        .then(res => {
          expect(res).to.eql([{id: '1'}])
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
    it('serialises and updates an object correctly with specified id column and where', () => {
      return db
        .insert('test', d)
        .then(res => {
          d.id = '1'
          d.name = 'alex'
          return db.update('test', 'id', d, {name: 'johan', age: 43})
        })
        .then(res => {
          expect(res).to.eql([{id: '1'}])
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('#upsert', () => {
    it('serialises and updates an object correctly', () => {
      return db
        .insert('test', d)
        .then(res => {
          Object.assign(d, res, {name: 'alex'})
          return db.upsert('test', d)
        })
        .then(() => {
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
    it('serialises and updates an object correctly with specified id column', () => {
      return db
        .insert('test', d)
        .then(res => {
          Object.assign(d, res, {name: 'alex'})
          return db.upsert('test', 'id', d)
        })
        .then(() => {
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('#batchUpsert', () => {
    it('runs multiple upserts', () => {
      const d2 = Object.assign({}, d, { id: '2', name: '0as90dsa90sad' })
      return db
        .insert('test', d)
        .then(res => {
          Object.assign(d, res, {name: 'alex'})
          return db.batchUpsert([
            ['test', d],
            ['test', d2]
          ])
        })
        .then(() => {
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(2)
            .and.eql([d, d2])
        })
    })
    it('runs multiple upserts with specified id column', () => {
      const d2 = Object.assign({}, d, { id: '2', name: '0as90dsa90sad' })
      return db
        .insert('test', d)
        .then(res => {
          Object.assign(d, res, {name: 'alex'})
          return db.batchUpsert([
            ['test', 'id', d],
            ['test', 'id', d2]
          ])
        })
        .then(() => {
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(2)
            .and.eql([d, d2])
        })
    })
  })
  describe('#del', () => {
    beforeEach(() => {
      const sql = `INSERT INTO "test"(name, age, active) VALUES\
        ('foo', 20, true),\
        ('bar', 20, false),\
        ('baz', 20, true),\
        ('herp', 60, true),\
        ('derp', 20, true),\
        ('tim', 20, true);`
      return db.query(sql, [])
    })
    it('deletes all', () => {
      return db
        .del('test')
        .then(() => db.select('test'))
        .then(res => {
          expect(res).to.have.length(0)
        })
    })
    it('throws if filter is undefined', () => {
      return db
        .del('test', undefined)
        .then(() => Promise.reject('Did not throw'))
        .catch(err => {
          expect(err)
            .to.equal('Delete missing WHERE parameter')
        })
    })
    it('deletes with filter', () => {
      const std = {
        active: false,
        born: null,
        hobbies: null,
        modified: null,
        profile: null
      }
      return db
        .del('test', {age: 20, active: true})
        .then(() => db.select('test'))
        .then(res => {
          expect(res)
            .to.have.length(2)
            .and.eql([
              Object.assign({}, std, {
                id: '2',
                name: 'bar',
                age: 20,
                active: false
              }),
              Object.assign({}, std, {
                id: '4',
                name: 'herp',
                age: 60,
                active: true
              })
            ])
        })
    })
  })
})
