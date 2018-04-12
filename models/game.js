/**
 * 答题活动
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('game', {
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
        startTime: {
          type: DataTypes.TIME,
          allowNull: true,
          comment: '开始时间'
        },
        limit: {
          type: DataTypes.STRING,
          comment: '报名上限',
          allowNull: true
        },
        apply: {
          type: DataTypes.STRING,
          comment: '已报名人数',
          allowNull: true
        },
        status: {
          type: DataTypes.INTEGER,
          comment: '状态',   // 1 等待开始 2 进行中 4 已结束,
          allowNull: true
        },
        bonus: {
          type: DataTypes.DECIMAL,
          comment: '奖金',
          allowNull: true
        },
        resurrection: {
          type: DataTypes.INTEGER,
          comment: '可复活次数'   
        }
    }, {
      tableName: 'game'
    })
}

//静态方法
const classMethods = {

}