const { sequelize } = require('../config/db')
const User = sequelize.import('../models/User')
// 获取用户复活卡
module.exports.resurrection = (socket, io) => {
  return async (obj, fn) => {
    console.log('-------------obj----------------', obj)
    if (global.online && global.online[obj.openid]) {
      fn(global.online[obj.openid].resurrection)
    } else {
      // 查询个人信息
      let info = await User.findOne({
        where: {
          openid: obj.openid
        },
        raw: true
      }) 
      fn(info.resurrection)     
    }
  }
}
