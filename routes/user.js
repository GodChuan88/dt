const express = require('express')
const router = express.Router()
const fs = require('fs')
const { sequelize } = require("../config/db");
const User = sequelize.import("../models/User")
const Game = sequelize.import("../models/game");
const Apply = sequelize.import("../models/apply");
const Questions = sequelize.import("../models/questions")
const PresentRecord = sequelize.import("../models/presentRecord")
const WechatAuth = sequelize.import('../models/wechatAuth')
let { ANSWER } = require("../libs/game.js")
const { requestPromise } = require('../util/index.js')
const InvitationRecord = sequelize.import("../models/invitationRecord")
/**
 * 获取用户信息
 */
router.get('/', async (req, res, next) => {
	try {
	  let openid = req.query.openid
	  console.log('-------------openid--------------', openid)
	  let user = await User.findOne({
	  	where: {
	  		openid: openid
	  	},
	  	raw: true
	  })
	  if (user) {
	  	res.json({
	  		code: 0,
	  		data: user
	  	})	  	
	  } else {
	  	res.json({
	  		code: -1
	  	})
	  }
	} catch (e) {
  	res.json({
  		code: -1
  	})
	}
})

/**
* 获取用户账户信息
*/
router.get('/balance', async (req, res, next) => {
	try {
	  let openid = req.query.openid
	  console.log('-------------openid--------------', openid)
	  let user = await User.findOne({
	  	where: {
	  		openid: openid
	  	},
	  	raw: true
	  })
	  if (user) {
	  	// 查询用户的提现记录
	  	let presentRecord = await PresentRecord.findAll({
	  		where: {
	  			openid: openid
	  		},
	  		raw: true
	  	})
	  	res.json({
	  		code: 0,
	  		data: presentRecord,
	  		balance: user.bonus
	  	})	  	
	  } else {
	  	res.json({
	  		code: -1
	  	})
	  }
	} catch (e) {
  	res.json({
  		code: -1
  	})
	}
})

router.post('/tx', async (req, res, next) => {
	try {
	  let account = req.body.account
	  let openid = req.body.openid
	  let user = await User.findOne({
	  	where: {
	  		openid: openid
	  	},
	  	raw: true
	  })
	  if (user) {
			// 判断提现金额
			if (account > user.bonus) {
		  	res.json({
		  		code: -1,
		  		msg: '提现金额超过账户金额'
		  	})	
		  	return			
			}
			if (account < 50) {
		  	res.json({
		  		code: -1,
		  		msg: '提现金额必须超过50元'
		  	})	
		  	return			
			}
			// 开始提现
			// 创建提现金额
			await PresentRecord.create({
				account: account,
				result: 1,
				openid: openid
			})
			// 账户金额减去提现金额
			await User.update({
				bonus: user.bonus - account
			}, {
				where: {
					openid: openid
				}
			})
		  res.json({
	  		code: 0
	  	})
	  } else {
	  	res.json({
	  		code: -1
	  	})
	  }
	} catch (e) {
		console.log(e)
  	res.json({
  		code: -1
  	})
	}
})


const multer = require('multer')
// 配置 multer 模块
// dest 表示文件上传之后保存的路径
var limits = { fileSize: 21 * 1024 * 1024 }
var storage = multer.diskStorage({
  destination: async (req, file, cb) => {
  	let openid = req.body.openid
  	let dir = `upload`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    cb(null, dir)
  }
})
const fileUpload = multer({ storage, limits })
const path = require('path')
//文件上传服务
router.post('/upload', fileUpload.single('file'), async (req, res, next) => {
    const file = req.file
    const fileName = file.filename
   	let openid = req.body.openid
  	console.log('--------openid--------------1', openid)
    let user = await User.findOne({
    	where: {
    		openid: openid
    	},
    	raw: true
    })
    if (user) {
    	await User.update({
    		codeUrl: file.filename
    	}, {
    		where: {
    			openid: openid
    		}
    	})
    }
    // 保存
    res.json({code: 0, message: '上传成功', name: fileName})
});

router.get('/upload', async (req, res) => {
  const avatar = req.query.code
  try {
    let filePath = `upload/${avatar}`
    let absolutePath = path.resolve(filePath)
    let isFileExist = fs.existsSync(absolutePath)
    if (!isFileExist) {
      return res.json({code: 1, message: '文件已被删除'})
    }
    return res.sendFile(absolutePath)
  } catch (e) {
    console.log('get avatar', e)
    return res.json({code: 1, message: '获取图像出错'})
  }
})



// 创建临时二维码
let createQrcode = async(openid) => {
	try {
	  let wechatAuth = await WechatAuth.findOne({
	    where: {
	      id: 1
	    },
	    logging: false
	  })
	  let opt = {
	    url: `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${wechatAuth.accessToken}`,
	    method: 'POST',
	    headers: {
	      "Content-Type": "application/json"
	    },
	    body: JSON.stringify({
	      expire_seconds: 604800, 
	      action_name: 'QR_SCENE',
	      action_info: {scene: {scene_str: openid}}    
	    })
	  }
	  let body = await requestPromise(opt)
	  body = JSON.parse(body)
	  console.log('---------createQrcode-------', body)
	  if (body.errcode) {
	  	return null
	  }
	  return body.ticket
	} catch (e) {
		console.log(e)
		return null
	}
  // {"ticket":"gQES8DwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyamRUa016bjM5Y18xQ3F4T2hxMWoAAgQaJ6laAwSAOgkA","expire_seconds":604800,"url":"http:\/\/weixin.qq.com\/q\/02jdTkMzn39c_1CqxOhq1j"}  
}

router.get('/qrcode', async (req, res) => {
	let openid = req.query.openid
  let user = await User.findOne({
  	where: {
  		openid: openid
  	},
  	raw: true
  })
  console.log('================user==================', user)
  if (user) {
  	if (user.ticket) {
  		console.log('================user.ticket==================', user.ticket)
	    let imgOpt = {
	      url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${user.ticket}`,
	      method: 'GET'
	    }
	    let img = await requestPromise(imgOpt)
	    res.json({
	    	code: 0,
	    	data: user.ticket
	    })
  	} else {
	    // 生成二维码的ticket
	    let ticket = await createQrcode(openid)
	    console.log('================ticket==================', ticket)
	    await User.update({
	    	ticket: ticket
	    }, {
	    	where: {
	    		openid: openid
	    	}
	    })
	    res.json({
	    	code: 0,
	    	data: ticket
	    })
  	}
  }
})


router.get('/resurrection', async (req, res) => {
	try {
	  let openid = req.query.openid
	  let invitationRecord = await InvitationRecord.findAll({
	  	where: {
	  		openid: openid,
	  		invatedTime: {
	  			$not: null
	  		}
	  	},
	  	raw: true
	  })
	  res.json({
	  	code: 0,
	  	data: invitationRecord
	  })
	} catch (e) {
		console.log(e)
		res.json({
			code: 0
		})
	}
})
module.exports = router;