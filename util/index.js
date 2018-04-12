const request = require('request')
const requestPromise = (config) => {
  return new Promise((resolve, reject) => {
    request(config, (err, res, body) => {
      if (err) {
        reject(err)
      } else {
        resolve(body)
      }
    })
  })
}

module.exports = {
  requestPromise
}
