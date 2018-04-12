const { client } = require('../libs/redisClient')

const llen = (listName) => {
  return new Promise((resolve, reject) => {
    client.llen(listName, (err, data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
        }
      } else {
        reject(err)
      }
    })
  })
}

const hget = (htable, key) => {
  return new Promise((resolve, reject) => {
    client.hget(htable, key, (err, data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
        }
      } else {
        reject(err)
      }
    })
  })
}

const hgetall = (htable) => {
  return new Promise((resolve, reject) => {
    client.hgetall(htable, (err, data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
          logger.error('setTimeout hgetall err', e)
        }
      } else {
        reject(err)
        logger.error('setTimeout hgetall err', e)
      }
    })
  })
}

const hlen = (htable) => {
  return new Promise((resolve, reject) => {
    client.hlen(htable, (err, data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
        }
      } else {
        reject(err)
      }
    })
  })
}

const hset = (htable, key, value) => {
  return new Promise(function (resolve, reject) {
  client.hset(htable, key, value, (err,data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
        }
      } else {
        reject(err)
      }
  })
  })
}

const lrange = (command, start, end) => {
  return new Promise(function (resolve, reject) {
  client.lrange(command, start, end, (err,data) => {
      if (!err) {
        try {
          resolve(data)
        } catch (e) {
          reject(e)
        }
      } else {
        reject(err)
      }
  })
  })
}

module.exports = { hget, llen, hlen, lrange, hset, hgetall }
