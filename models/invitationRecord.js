/**
 * 题库
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('invitation_record', {
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
          type: DataTypes.STRING,
          comment: '微信号',
          allowNull: true
        },
        invited_openid: {
          type: DataTypes.STRING,
          comment: '被邀请的opinid'          
        },
        recroded: {
          type: DataTypes.BOOLEAN, 
          comment: '是否记录得到复活卡的5次'  //       
        },
        invatedTime: {
          type: DataTypes.TIME, 
          comment: '满足的时间'      
        }
    }, {
      tableName: 'invitation_record'
    })
}

//静态方法
const classMethods = {

}