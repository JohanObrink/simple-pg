# simple-pg
A simplified api against Postgresql using promises and objects

## Install

```bash
npm install --save simple-pg
```

## Use

```javascript
const pg = require('simple-pg')({})
const connection = {
  host: 'localhost'
}
const db = pg(connection)

db.insert('users', {name: 'johan', age: 43})
  .then(() => console.log('done'))
