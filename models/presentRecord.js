/**
 * 题库
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('present_record', {
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
        account: {
          type: DataTypes.DECIMAL,
          comment: '提现金额'          
        },
        result: {
          type: DataTypes.INTEGER, 
          comment: '提现结果'  // 1 等待提现 2 提现成功 3 提现失败      
        }
    }, {
      tableName: 'present_record'
    })
}

//静态方法
const classMethods = {

}