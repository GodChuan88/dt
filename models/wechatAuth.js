/**
 * 已报名名单、活动关系
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('wechatAuth', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false, //非空
            autoIncrement: true, //自动递增
            primaryKey: true //主键
        },
        createdAt: {
          type: DataTypes.TIME,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.TIME,
          allowNull: false
        },
        accessToken: {
          type: DataTypes.STRING,
          allowNull: false
        }
    }, {
      tableName: 'wechatAuth'
    })
}

//静态方法
const classMethods = {

}