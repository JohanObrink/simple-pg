const {expect} = require('chai')
const moment = require('moment')
const options = {
  host: 'localhost',
  port: 5432,
  database: 'simple',
  user: 'tester',
  password: 'password'
}
const {omit} = require(`${process.cwd()}/lib/util`)
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
  return db.query(`TRUNCATE TABLE test;`)
})

after(() => {
  return db.query(`DROP TABLE test;`)
})

describe('pg', () => {
  let d, sql
  beforeEach(() => {
    d = {
      id: '1',
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
  describe('query', () => {
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
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('insert', () => {
    it('serialises and inserts an object correctly', () => {
      return db
        .insert('test', d)
        .then(res => {
          return db.query(sql)
        })
        .then(res => {
          expect(res)
            .to.have.length(1)
            .and.eql([d])
        })
    })
  })
  describe('update', () => {
    it('serialises and updates an object correctly', () => {
      return db
        .insert('test', d)
        .then(() => {
          d.name = 'alex'
          return db.update('test', d)
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
  describe('upsert', () => {
    it('serialises and updates an object correctly', () => {
      return db
        .insert('test', d)
        .then(() => {
          d.name = 'alex'
          return db.upsert('test', d.id, omit(d, 'id'))
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
  describe('batchUpsert', () => {
    it('runs multiple upserts', () => {
      const d2 = Object.assign({}, d, { id: '2', name: '0as90dsa90sad' })
      return db
        .insert('test', d)
        .then(() => {
          d.name = 'alex'
          return db.batchUpsert([
            ['test', d.id, omit(d, 'id')],
            ['test', d2.id, omit(d2, 'id')]
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
})
