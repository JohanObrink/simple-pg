function omit (obj, keys) {
  keys = keys instanceof Array ? keys : [keys]
  return Object
    .keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((res, key) => Object.assign(res, {
      [key]: obj[key]
    }), {})
}

module.exports = {omit}
