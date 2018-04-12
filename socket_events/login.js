const { sequelize } = require('../config/db')
const User = sequelize.import('../models/User')
const { hget, hdel, hgetall, lrange } = require('../util/redisPromise')
const { client } = require('../libs/redisClient')

module.exports.login = (socket, io) => {
  return async (user, fn) => {
    console.log('-------------login----------------', user)
    // 查询个人信息
    let info = await User.findOne({
    	where: {
    		openid: user.openid
    	},
    	raw: true
    })
    if (info) {
     //  let userSocket = await hget('user', user.openid) || '{}'
     //  userSocket = JSON.parse(userSocket)
     //  if (Object.keys(userSocket).length === 0) {
     //    client.hset(`user`, user.openid, JSON.stringify({resurrection: info.resurrection, socketId: socket.id}))
     //    client.lpush(`online`, user.openid)
	    // }
     //  client.hset(`socket`, socket.id, user.openid)
	    // socket.join('game')
      client.hset(`user`, user.openid, JSON.stringify({resurrection: info.resurrection, socketId: socket.id}))
      client.lpush(`online`, user.openid)
      client.hset(`socket`, socket.id, user.openid)
      let game = await hget('running', 'game')
      if (game) {
        fn(true)
      } else {
        fn(false)
      }  
    }
  }
}
