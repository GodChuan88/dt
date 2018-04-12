/**
 * 用户信息
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false, //非空
            autoIncrement: true, //自动递增
            primaryKey: true //主键
        },
        createdAt: {
          type: DataTypes.TIME,
          allowNull: true
        },
        updatedAt: {
          type: DataTypes.TIME,
          allowNull: true
        },
        openid: {
          type: DataTypes.INTEGER,
          comment: '微信号',
          allowNull: true
        },
        subscribe: {
          type: DataTypes.INTEGER,
          comment: '用户是否订阅该公众号标识'     // 值为0时，代表此用户没有关注该公众号，拉取不到其余信息。      
        },
        nickname: {
          type: DataTypes.STRING,
          comment: '昵称'      
        },
        sex: {
          type: DataTypes.INTEGER,
          comment: '性别'             // 值为1时是男性，值为2时是女性，值为0时是未知
        },
        city: {
          type: DataTypes.STRING,
          comment: '城市'        
        },
        country: {
          type: DataTypes.STRING,
          comment: '国家'          
        },
        province: {
          type: DataTypes.STRING,
          comment: '省份'          
        },
        headimgurl: {
          type: DataTypes.STRING,
          comment: '头像'          
        },
        subscribe_time: {
          type: DataTypes.BIGINT,
          comment: '关注时间'          
        },
        resurrection: {
          type: DataTypes.INTEGER,
          comment: '复活次数'          
        },
        bonus: {
          type: DataTypes.DECIMAL,
          comment: '奖金' 
        },
        codeUrl: {
          type: DataTypes.STRING,
          comment: '收款二维码' 
        },
        ticket: {
          type: DataTypes.STRING,
          comment: '邀请二维码ticket'           
        }
    }, {
      tableName: 'user'
    })
}

//静态方法
const classMethods = {

}