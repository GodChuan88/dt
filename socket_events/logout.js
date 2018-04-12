const { sequelize } = require('../config/db')
const User = sequelize.import('../models/User')
const { hget, hdel, hgetall, lrange } = require('../util/redisPromise')
const { client } = require('../libs/redisClient')

module.exports.logout = (socket, io) => {
  return async (user, fn) => {
    fn(true)
    client.del(`apply`, user.openid)
    socket.leave('running')
  }
}
