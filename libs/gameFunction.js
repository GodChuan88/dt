var { sequelize } = require("../config/db");

var Game = sequelize.import("../models/game");
var Apply = sequelize.import("../models/apply");
var Questions = sequelize.import("../models/questions");
const User = sequelize.import("../models/User")
const { hget, hdel, hgetall, lrange } = require('../util/redisPromise')
const { client } = require('../libs/redisClient')
  ///集合取交集
  Array.intersect = function () {
      var result = new Array();
      var obj = {};
      for (var i = 0; i < arguments.length; i++) {
          for (var j = 0; j < arguments[i].length; j++) {
              var str = arguments[i][j];
              if (!obj[str]) {
                  obj[str] = 1;
              }
              else {
                  obj[str]++;
                  if (obj[str] == arguments.length)
                  {
                      result.push(str);
                  }
              }//end else
          }//end for j
      }//end for i
      return result;
  }

let gameFunction = async(io, gameId) => {
	// 准备题目
	let questions = await Questions.findAll({
		where: {
			game_id: gameId
		},
		raw: true
	})
	// 准备用户
	let applies = await Apply.findAll({
		where: {
			game_id: gameId
		},
		raw: true
	})
	console.log('---------------applies----------', applies)
	applies = applies || []
	let appledUser = []
	for (let a of applies) {
		appledUser.push(a.openid)
	}
	let online = await lrange(`online`, 0, -1) || []
	// 取交集就位当前参与的人数并且报名的人数即可参与答题的人数
	let apply = Array.intersect(appledUser, online)
	for (let _openid of apply) {
		// 查询复活卡
		let resurrection = await hget('user', _openid) || '{}'
		resurrection = JSON.parse(resurrection)
		client.hset('apply', _openid, JSON.stringify({
			index: 1,
			isAnswer: false,
			resurrection: resurrection.resurrection || 0
		}))
		console.log('============================================resurrection.socketId=====================================================', resurrection.socketId)
		// 加入到答题聊天室
		io.sockets.connected[resurrection.socketId].join('running')
	}
	// 设置为正在进行中
	await Game.update({
		status: 2
	}, {
		where: {
			id: gameId
		}
	})
	client.hset('running', 'game', gameId)
	console.log('-------------------------可参与答题----------------------------------', await hgetall('apply'))
	// 开始答题, 跳转到答题界面
	io.sockets.in('running').emit('start')
	setTimeout(() => {
		// 发送第一道题题目
	  io.sockets.in('running').emit('question', {
	  	index: 1,
	  	question: questions[0].question,
	  	firstAnswer: questions[0].first_answer,
	  	secondAnswer: questions[0].second_answer,
	  	thirdAnswer: questions[0].third_answer,
	  	content: questions[0].content
	  })
	  // 设置正确答案
	  global.ANSWER = {
	  	gameId: gameId,
	  	index: 1,
	  	right: questions[0].right_answer,
	  	question: questions[0].question,
	  	firstAnswer: questions[0].first_answer,
	  	secondAnswer: questions[0].second_answer,
	  	thirdAnswer: questions[0].third_answer,
	  	content: questions[0].content	  	
	  }
	  clearInterval(global.inteval)
		let count = 1
		setTimeout(() => {
		  io.sockets.in('running').emit('answer', {
		  	answer: questions[0].right_answer,
				content: questions[count-1].content
		  })			
		}, 1000 * 7)
		// 发送第二道题目
		global.inteval = setInterval(async() => {
			// 去掉未选择答案
			let _apply = await hgetall('apply') || {}
			for (let openid of Object.keys(_apply)) {
				let applyUser = JSON.parse(_apply[openid])
				console.log('=================applyUser========================', applyUser, !_apply[openid].isAnswer, _apply[openid].resurrection > 0)
				if (!applyUser.isAnswer && (applyUser.resurrection < 1 || applyUser.resurrected)) {
          await Apply.update({
          	successed: 2,
          	bonus: 0
          }, {
          	where: {
          		openid: openid,
          		game_id: gameId
          	}
          })
          console.log('===========================未答题没有复活卡==============================')
					client.hdel('apply', openid)
				} else if (!applyUser.isAnswer && applyUser.resurrection > 0 && !applyUser.resurrected) {
					applyUser.resurrection = applyUser.resurrection - 1
					applyUser.resurrected = true
					User.update({resurrection: sequelize.literal('`resurrection` -1')}, {where:{openid: openid}})
					applyUser.isAnswer = false
					console.log('===========================未答题使用复活卡==============================', applyUser)
					client.hset('apply', openid, JSON.stringify(applyUser))
				} else {
					console.log('===========================已经答题==============================')
					applyUser.isAnswer = false
					client.hset('apply', openid, JSON.stringify(applyUser))
				}
			}
			console.log('-------------------------剩下可参与答题----------------------------------', await hgetall('apply'))
			count ++
			if (count <= questions.length) {
			  // 设置正确答案
			  global.ANSWER = {
			  	gameId: gameId,
			  	index: count,
			  	right: questions[count-1].right_answer,
			  	question: questions[count-1].question,
			  	firstAnswer: questions[count-1].first_answer,
			  	secondAnswer: questions[count-1].second_answer,
			  	thirdAnswer: questions[count-1].third_answer,
	  			content: questions[count-1].content
			  }
			  io.sockets.in('running').emit('question', {
			  	index: count,
			  	question: questions[count-1].question,
			  	firstAnswer: questions[count-1].first_answer,
			  	secondAnswer: questions[count-1].second_answer,
			  	thirdAnswer: questions[count-1].third_answer,
	  			content: questions[count-1].content
			  })
				setTimeout(() => {
				  io.sockets.in('running').emit('answer', {
				  	answer: questions[count-1].right_answer,
				  	content: questions[count-1].content
				  })			
				}, 1000 * 7)
			} else {
				io.sockets.in('running').emit('success', {gameId})
				delete global['ANSWER']
				clearInterval(global.inteval)
				// 设置为已经结束
				let game = await Game.update({
					status: 4
				}, {
					where: {
						id: gameId
					},
					raw: true
				})
				client.hdel('running', 'game')
				console.log('--------------------答对名单--------------------------', await hgetall('apply'))
				// 计算结果 并发送给访客
				let rightApply = await hgetall('apply') || {}
				if (Object.keys(rightApply).length > 0) {
					console.log('----------------------------game.bonus-------------------', game.bonus)
					let bonus = game.bonus / Object.keys(rightApply).length
					console.log('----------------------------bonus-------------------', bonus)
					for (let openid of Object.keys(rightApply)) {
						console.log('----------------------------openid-------------------', openid)
	          await Apply.update({
	          	successed: 1,
	          	bonus: 10
	          }, {
	          	where: {
	          		openid: openid,
	          		game_id: gameId
	          	}
	          })
					}
					setTimeout(() => {
						console.log('----------------------------gameId-------------------', gameId)
						// 发送结果
					  io.sockets.in('running').emit('result', {
					  	gameId: gameId
					  })		
					}, 10 * 1000)		
				}
			}
		}, 1000  * 17)
	}, 10000) 
}
module.exports = gameFunction;