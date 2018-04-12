/**
 * 已报名名单、活动关系
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('apply', {
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
        game_id: {
          type: DataTypes.INTEGER,
          comment: '活动id',
          allowNull: true
        },
        openid: {
          type: DataTypes.STRING,
          comment: '微信号',
          allowNull: true
        },
        resurrected: {
          type: DataTypes.INTEGER,
          comment: '已使用复活次数'          
        },
        successed: {
          type: DataTypes.INTEGER,
          comment: '答题是否成功'    // 1 成功 2 失败        
        },
        bonus: {
          type: DataTypes.DECIMAL,
          comment: '奖金' 
        }
    }, {
      tableName: 'apply'
    })
}

//静态方法
const classMethods = {

}