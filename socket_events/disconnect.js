const { hget, hdel, hgetall, lrange } = require('../util/redisPromise')
const { client } = require('../libs/redisClient')


module.exports.disconnect = (socket, io) => {
  return async (reason) => {
    /*
    *  reason: String: transport close                     直接关闭网页
    *                  ping timeout                        掉线
    *                  client namespace disconnect         主动踢下线
    */
    console.log('reason..................', reason)
    try {
      // 从掉线的 socket.id 找出对应的 访客/客服
      let openid = await hget('socket', socket.id)
      console.log('...........openid..................', openid)
      try {
        if (!openid) {
          return
        }
        if (reason === 'transport close') {
          client.hdel(`user`, openid)
          client.lrem(`online`, 0, openid)
          client.hdel(`socket`, socket.id)
          // 访客浏览往网站下线
          // 有可能是刷新
          // setTimeout(async () => {
          //   let userSocket = await hget('user', openid) || '{}'
          //   userSocket = JSON.parse(userSocket)
          //   if (Object.keys(userSocket).length === 0) {
          //     client.hdel(`user`, openid)
          //     client.lrem(`online`, 0, openid)
          //     client.hdel(`socket`, socket.id)
          //   }
          // }, 1000)
        } else if (reason === 'client namespace disconnect') {
          client.hdel(`user`, openid)
          client.lrem(`online`, 0, openid)
          client.hdel(`socket`, socket.id)
        } else { 
          // 如果是非正常下线，有可能还会连上来
          let timer = setTimeout(async () => {
            let userSocket = await hget('user', openid) || '{}'
            userSocket = JSON.parse(userSocket)
            if (Object.keys(userSocket).length === 0) {
              client.hdel(`user`, openid)
              client.lrem(`online`, 0, openid)
              client.hdel(`socket`, socket.id)
            }
            delete timers[openid]
          }, 1000 * 5 * 60)
        }
      } catch (e) {
        logger.error(e)
      }
    } catch (e) {
      logger.error(e)
    }
  }
}
