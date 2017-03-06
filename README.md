# simple-pg
A simplified api against Postgresql using promises and objects

## Install

```bash
npm install --save simple-pg
```

## Use

### select
```js
pgm.select('users') // DON'T
pgm.select('users', {
  columns: {},
  where: {user_id: {ge: 1}, taxonomy_handle: '16', section: 'experience', taxonomy_type: 'profession'},
  limit: 100
})
```

### insert
```js
pgm
  .insert('users', user)            // id assumed to be .id
  .then(res => console.log(res))    // logs {id: INSERTED_ID}

pgm
  .insert('users', 'user_id', user) // id is .user_id
  .then(res => console.log(res))    // logs {user_id: INSERTED_ID}
```

### upsert
```js
pgm
  .upsert('users', user)            // id assumed to be .id
  .then(res => console.log(res))    // logs user

pgm
  .upsert('users', 'user_id', user) // id is .user_id
  .then(res => console.log(res))    // logs user
```

### update
```js
pgm
  .update('users', user)            // where id = user.id
  .then(res => console.log(res))    // logs array of {id: UPDATED_ID}

pgm
  .update('users', 'user_id', user) // where user_id = user.user_id
  .then(res => console.log(res))    // logs array of {user_id: UPDATED_ID}

pgm
  .update('users', user, {user_id: 1, taxonomy_handle: '16', section: 'experience'})
                                    // where user_id = 1 AND taxonomy_handle = '16' AND section = 'experience'
  .then(res => console.log(res))    // logs array of {id: UPDATED_ID}

pgm
  .update('users', 'user_id, user, {user_id: 1, taxonomy_handle: '16', section: 'experience'})
                                    // where user_id = 1 AND taxonomy_handle = '16' AND section = 'experience'
  .then(res => console.log(res))    // logs array of {user_id: UPDATED_ID}
```

### delete
```js
pgm
  .del('users')                    // deletes all rows from the table 'users'
pgm
  .del('users', undefined)
  .catch(err => console.error(err))// logs 'Missing WHERE clause'
pgm
  .del('users', {user_id: 1, taxonomy_handle: '16', section: 'experience'})
                                   // where user_id = 1 AND taxonomy_handle = '16' AND section = 'experience'
```

### truncate
```js
pgm.truncate('users')
```
