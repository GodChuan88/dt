/**
 * 题库
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('questions', {
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
          comment: '活动id'
        },
        number: {
          type: DataTypes.INTEGER,
          comment: '序号'
        },
        question: {
          type: DataTypes.STRING,
          comment: '已使用复活次数'          
        },
        first_answer: {
          type: DataTypes.STRING,
          comment: '第一题'      
        },
        second_answer: {
          type: DataTypes.STRING,
          comment: '第二题'     
        },
        third_answer: {
          type: DataTypes.STRING,
          comment: '第三题'        
        },
        right_answer: {
          type: DataTypes.INTEGER,
          comment: '正确答案'          
        },
        content: {
          type: DataTypes.STRING,
          comment: '答案解释'
        }
    }, {
      tableName: 'questions'
    })
}

//静态方法
const classMethods = {

}