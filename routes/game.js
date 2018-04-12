var express = require('express');
var router = express.Router();

var { sequelize } = require("../config/db");
const User = sequelize.import("../models/User")
const Game = sequelize.import("../models/game");
const Apply = sequelize.import("../models/apply");
const Questions = sequelize.import("../models/questions");
let { ANSWER } = require("../libs/game.js")
const { hget, hdel, hgetall, lrange } = require('../util/redisPromise')
const { client } = require('../libs/redisClient')

// 获取今天的开始时间
let getTodayStartTime = () => {
  try {
    let time = new Date()
    let Year = time.getFullYear()
    let month = time.getMonth() + 1
    let date = time.getDate()
    return `${Year}-${month}-${date} 00:00:00`
  } catch (e) {
    console.log('getTodayTime', e)
  }
}

// 获取今天的开始时间
let getTodayEndTime = () => {
  try {
    let time = new Date()
    let Year = time.getFullYear()
    let month = time.getMonth() + 1
    let date = time.getDate()
    return `${Year}-${month}-${date} 23:59:59`
  } catch (e) {
    console.log('getTodayTime', e)
  }
}

/**
 * 获取单个用户
 */
router.get('/', async (req, res, next) => {
	try {
		let status = parseInt(req.query.status)
		let openid = 'oF8NMv1cLqoH5kNIeRQgkttjVLJI'
		let where = {}
		if (status === 1) {
			where = {
				$or: [{status: 1}, {status: 2}]
			}
		} else {
			where = {status: 4}
		}
		where.startTime = {
		   $between: [getTodayStartTime(), getTodayEndTime()]
		}
		let games = await Game.findAll({
			where: where,
			order: [['startTime']],
			raw: true
		})
		let result = []
		// 查询是否有在进行中的答题
		let RunningGame = Game.findOne({
			where: {
				status: 2
			}
		})
		// 查询是否已经报名
		for (let item of games) {
			let apply = await Apply.findOne({
				where: {
					game_id: item.id, 
					openid: openid
				}
			})
			if (apply) {
				item.appled = true
			} else {
				item.appled = false
			}
			result.push(item)
		}
		res.json({code: 0, data: result})
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});


router.post('/answer', async (req, res, next) => {
	try {
		let qIndex = req.body.qIndex
		let answer = req.body.answer
		let openid = req.body.openid
		console.log('===========openid==================', openid)
		let apply = await hget('apply', openid) || '{}'
		apply = JSON.parse(apply)
		console.log('===========apply==================', apply)
		if (Object.keys(apply).length === 0 || qIndex !== global.ANSWER.index) {
			res.json({
				code: 0,
				msg: '出错啦'
			})
			return
		} 
		if (apply && apply.isAnswer) {
			res.json({
				code: 1,
				msg: '已经回答过'
			})
			return			
		}
		if (answer === global.ANSWER.right && Object.keys(apply).length > 0 ) {
			apply.isAnswer = true
			client.hset('apply', openid, JSON.stringify(apply))
			res.json({
				code: 0,
				msg: '回答正确'
			})
			return
		} else {
			if (Object.keys(apply).length > 0  && apply.resurrection > 0 && !apply.resurrected) {
				apply.isAnswer = true
				client.hset('apply', openid, JSON.stringify(apply))
				User.update({resurrection: sequelize.literal('`resurrection` -1')}, {where:{openid: openid}})
				res.json({
					code: 2,
					msg: '自动使用复活卡'
				})			
			} else {
				client.hdel('apply', openid)
        Apply.update({
        	successed: 2,
        	bonus: 0
        }, {
        	where: {
        		openid: openid,
        		game_id: global.ANSWER.gameId
        	}
        })
				res.json({
					code: 0,
					msg: '回答错误'
				})
			}
		}
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});


router.post('/apply', async (req, res, next) => {
	try {
		let gameId = req.body.gameId
		let openid = req.body.openid
		let game = await Game.findOne({
			where: {
				id: gameId
			},
			raw: true
		})
		if (!game) {
			res.json({code: -1})
			return
		}
		console.log('---------game.apply < game.limit-----------------------------', game.apply < game.limit)
		if (game.apply < game.limit) {
			// 查询是否已经报名
			let apply = await Apply.findOne({
				where: {
					openid: openid,
					game_id: gameId
				}
			})
			console.log('---------!apply-----------------------------', !apply)
			if (!apply) {
				await Apply.create({
					game_id: gameId,
					openid: openid,
					resurrected: 0,
					bonus: 0
				})
				await Game.update({
					apply: game.apply + 1
				}, {
					where: {
						id: gameId
					}
				})
			}
		}
		res.json({code: 0})
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});


router.get('/question', async (req, res, next) => {
	try {
		res.json({
			code: 0,
	  	index: global.ANSWER.index,
	  	question: global.ANSWER.question,
	  	firstAnswer: global.ANSWER.firstAnswer,
	  	secondAnswer: global.ANSWER.secondAnswer,
	  	thirdAnswer: global.ANSWER.thirdAnswer
		})		
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});

router.get('/result/:gameId', async (req, res, next) => {
	try {
		let gameId = req.params.gameId
		let applies = await Apply.findAll({
			attributes: ['openid', 'bonus'],
			where: {
				successed: 1,
				game_id: gameId
			},
			raw: true
		})
		let result = []
		if (applies) {
			for (let apply of applies) {
				let obj = {}
				let user = await User.findOne({
					where: {
						openid: apply.openid
					},
					raw: true
				})
				console.log('=====================', apply)
				obj.bonus = apply.bonus
				obj.nickname = user.nickname
				obj.headimgurl = user.headimgurl
				result.push(obj)
			}
		}
		res.json({
			code: 0,
			data: result
		})
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});


router.get('/record', async (req, res, next) => {
	try {
		let openid = req.query.openid
		console.log('============record=============================', openid)
	  let apply = await Apply.findAll({
	  	where: {
	  		openid: openid,
	  		successed: {
	  			$not: null
	  		}
	  	}
	  })
	  res.json({
	  	code: 0,
	  	data: apply
	  })
	} catch (e) {
		console.log(e)
		res.json({code: -1})
	}
});
// /**
//  * 获取所有用户
//  */
// router.get('/', function(req, res, next) {
//     User.getUsers({
//         limit: parseInt(req.query.limit) || 10, //默认查询10条
//         offset: parseInt(req.query.offset) || 0 //默认查询第一页
//     }).then(function(result) {
//         res.json({
//             status: 1,
//             data: result
//         });
//     }).catch(next);
// });
// /**
//  * 新增
//  */
// router.post('/', function(req, res, next) {
//     User.create(req.body).then(function(user) {
//         return user.createRole({
//             roleName: req.body.roleName
//         });
//     }).then(function(result) {
//         res.json({
//             status: 1,
//             data: result
//         });
//     }).catch(next);
// });

// /**
//  * 修改
//  */
// router.post('/:id/update', function(req, res, next) {
//     User.updateUserById(req.body, req.params.id).then(function(result) {
//         res.json({
//             status: 1,
//             data: result
//         });
//     }).catch(next);
// });

// /**
//  * 删除
//  */
// router.get('/:id/del', function(req, res, next) {
//     User.deleteById(req.params.id).then(function(result) {
//         res.json({
//             status: 1,
//             data: result
//         });
//     }).catch(next);
// });

// /**
//  * 查找用户的所有地址
//  */
// router.get("/:id/addresses", function(req, res, next) {
//     var user = User.build({
//         id: req.params.id
//     });
//     user.getAddresses({
//         // limit: 1,
//         // offset: 1
//         order: "id desc" //按照id倒排
//     }).then(function(addresses) {
//         res.json({
//             status: 1,
//             data: addresses
//         });
//     }).catch(next);
// });

// /**
//  * 查询用户的登录信息
//  */
// router.get("/:id/logininfo", function(req, res, next) {
//     User.findOne({
//         where: {
//             id: req.params.id
//         },
//         include: {
//             model: LoginInfo
//         }
//     }).then(function(user) {
//         res.json({
//             status: 1,
//             data: user
//         });
//     }).catch(next);
// });

// /**
//  * 查询当前用户所有的角色
//  */
// router.get("/:id/roles", function(req, res, next) {
//     var user = User.build({
//         id: req.params.id
//     });
//     user.getUserRoles({
//         order: "id desc"
//     }).then(function(userRoles) {
//         res.json({
//             status: 1,
//             data: userRoles
//         });
//     }).catch(next);
// });

module.exports = router;
