# TODO

## Simplify and standardize API

#### select
```js
pgm.select('users') // DON'T
pgm.select('users', {
  columns: {},
  where: {user_id: {ge: 1}, taxonomy_handle: '16', section: 'experience', taxonomy_type: 'profession'},
  limit: 100
})
```

#### insert
```js
pgm.insert('users', user)
```

#### upsert
```js
pgm.upsert('users', user)
```

#### update
```js
pgm.update('users', user, 'personal_number')
pgm.update('users', user, {user_id: 1, taxonomy_handle: '16', section: 'experience', taxonomy_type: 'profession'})
pgm.update('users', user)
```

#### del
```js
pgm.del('users') // DON'T!!!
pgm.del('users', '16')
pgm.del('users', {user_id: 1, taxonomy_handle: '16', section: 'experience', taxonomy_type: 'profession'})
```

#### truncate
```js
pgm.truncate('users')
```
