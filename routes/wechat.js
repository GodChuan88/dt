let express = require('express');
let router = express.Router();
const { requestPromise } = require('../util/index.js')
const { appId, appSecret, cfgToken} = require('../config/wechatCfg.js')
const { sequelize } = require("../config/db");
const User = sequelize.import("../models/User")
const WechatAuth = sequelize.import('../models/wechatAuth')
const Game = sequelize.import("../models/game")
const Apply = sequelize.import("../models/apply")
const InvitationRecord = sequelize.import("../models/invitationRecord")
const crypto = require('crypto')
const path = require('path')
const parseString = require('xml2js').parseString;

let getAccessToken = async() => {
  let wechatAuth = await WechatAuth.findOne({
    where: {
      id: 1
    },
    logging: false
  })
  if (new Date().getTime() - wechatAuth.dataValues.updatedAt < 7200 * 1000) {
    return
  }
  let opt = {
    url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
    method: 'GET',
    headers: {
      "Content-Type": "application/json"
    }
  }
  let body = await requestPromise(opt)
  body = JSON.parse(body)
  if (body.access_token) {
    if (wechatAuth) {
      await WechatAuth.update({
        accessToken: body.access_token,
        updatedAt: new Date().getTime()
      }, {
        where: {
          id: 1
        }
      })
    } else {
      await WechatAuth.create({
        accessToken: body.access_token,
        updatedAt: new Date().getTime(),
        createdAt: new Date().getTime()
      })      
    }
  }
}
// 刷新accessToken
setInterval(async() => {
  await getAccessToken()
}, 1000 * 60 * 30)



/**
 * 微信授权，得到accesstoken
 */
router.post("/auth", async (req, res, next) => {
  let code = req.body.code
  let openid = req.body.openid
  try {
    if (openid) {
      // 根据code得到微信授权
      let opt = {
        url: `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`,
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: req.body.code      
        })
      }  
      let body = await requestPromise(opt)  
      body = JSON.parse(body) 
      console.log('-------------------------微信授权信息------------------------', body)
      openid = body.openid
    }
    let wechatAuth = await WechatAuth.findById(1)
    let access_token = wechatAuth.dataValues.accessToken
    // 查询是否有关注微信公众号
    let userInfoOpt = {
      url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${access_token}&openid=${openid}&lang=zh_CN`,
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    }
    let userInfoRes = await requestPromise(userInfoOpt)
    userInfoRes = JSON.parse(userInfoRes)
    console.log('-------------------------微信访客信息------------------------', userInfoRes)
    let subscribe = userInfoRes.subscribe
    // 查询是否已经存在数据库，如果不存在则加入
    let user = await User.findOne({
      where: {
        openid: openid
      }
    })
    if (subscribe !== 0) { // 已关注
      if (!user) {
        await User.create({
          openid: openid,
          subscribe: subscribe,
          nickname: userInfoRes.nickname,
          sex: userInfoRes.sex,
          headimgurl: userInfoRes.headimgurl,
          resurrection: 0,
          bonus: 0
        })
      } else {
        if (user.subscribe === 0) {
          await User.update({
            subscribe: 1
          }, {
            where: {
              openid: openid
            }
          })         
        }
      }
      // 查询是否有在进行中的答题
      let runningGame = await Game.findOne({
        where: {
          status: 2
        },
        raw: true
      })
      // 是否跳转到答题
      let turnDt = false
      if (runningGame) {
        let apply = await Apply.findOne({
          where: {
            game_id: runningGame.id,
            openid: openid
          },
          raw: true
        }) 
        if (apply) {
          turnDt = true
        }
      } 
      console.log()
      res.json({
        subscribe: subscribe,
        openid: openid,
        turnDt: turnDt,
        code: 0
      })
      return
    } else { // 未关注
      if (user && user.subscribe !== 0) {
        await User.update({
          subscribe: 0
        }, {
          where: {
            openid: openid
          }
        })
      }
      res.json({
        subscribe: 0,
        openid: openid
      })
      return
    }
  } catch (error) {
    res.json({
      code: -1
    })
    console.log('错误------->', error)
  }
  res.json({ 
    code: req.body.code
  })
});

// 创建临时二维码
let createQrcode = async() => {
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
      action_info: {scene: {scene_str: '111111111111111111111'}}    
    })
  }
  let body = await requestPromise(opt)
  body = JSON.parse(body)
  return body.ticket
  // {"ticket":"gQES8DwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyamRUa016bjM5Y18xQ3F4T2hxMWoAAgQaJ6laAwSAOgkA","expire_seconds":604800,"url":"http:\/\/weixin.qq.com\/q\/02jdTkMzn39c_1CqxOhq1j"}  
}
//进行sha1加密
let sha1 =(str) => {
  var shasum = crypto.createHash("sha1");
  shasum.update(str);
  str = shasum.digest("hex");
  return str;
}



const { wechatCrypto } = require('../util/cryptoUtil')

/**
* 微信消息推送
*/
router.get("/event", async (req, res, next) => {
  try { 
    var query = req.query;
    var signature = query.signature;
    var echostr = query.echostr;
    var timestamp = query['timestamp'];
    var nonce = query.nonce;

    var reqArray = [nonce, timestamp, cfgToken];

    //对数组进行字典排序
    reqArray.sort();
    var sortStr = reqArray.join('');//连接数组
    var sha1Str = sha1(sortStr);

    if (signature === sha1Str) {
      res.end(echostr);
    } else {
      res.end("false");
      console.log("授权失败!");
    }
  }catch (error) {
    console.log('错误------->', error)
  }
})

/**
* 微信消息推送
*/
router.post("/event", async (req, res, next) => {
  try { 
    console.log('--------------req.body--------------', req.body.xml)
    // let cryptor = new wechatCrypto(cfgToken, config.kstcs.encodingAESKey, config.kstcs.appId)
    // let decryptMessage = cryptor.decrypt(req.body.xml.encrypt)
    var buffer = []
    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data)
    })
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        let msgXml = Buffer.concat(buffer).toString('utf-8')
        //解析xml
        parseString(msgXml, {explicitArray : false}, async (err,result) => {
          if(!err){
            //打印解析结果
            console.log(result)
            let xml = result.xml
            let msgType = xml.MsgType
            let event = xml.Event
            if (msgType === 'event' && event === 'subscribe') {  // 用户未关注时，进行关注后的事件推送
             // { ToUserName: 'gh_0ac36468b34f',
             //   FromUserName: 'oF8NMv8f2xwdmXdxRZ-cMp6nFQ-s',
             //   CreateTime: '1521036821',
             //   MsgType: 'event',
             //   Event: 'subscribe',
             //   EventKey: 'qrscene_0',
             //   Ticket: 'gQGC8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyWEVPck42bjM5Y18xQWJFTzFxMXAAAgSLLalaAwSAOgkA' } }
              let FromUserName = xml.FromUserName
              let user = await User.findOne({
                where: {
                  openid: FromUserName
                },
                raw: true
              })
              if (!user) {
                let wechatAuth = await WechatAuth.findOne({
                  where: {
                    id: 1
                  },
                  logging: false,
                  raw: true
                })
                let userInfoOpt = {
                  url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${wechatAuth.accessToken}&openid=${FromUserName}&lang=zh_CN`,
                  method: 'GET',
                  headers: {
                    "Content-Type": "application/json"
                  }
                }
                let userInfoRes = await requestPromise(userInfoOpt)
                userInfoRes = JSON.parse(userInfoRes)
                await User.create({
                  openid: FromUserName,
                  subscribe: 1,
                  nickname: userInfoRes.nickname,
                  sex: userInfoRes.sex,
                  headimgurl: userInfoRes.headimgurl,
                  resurrection: 0,
                  bonus: 0
                })
                // 插入一条邀请记录
                let inviteUser = await User.findOne({
                  where: {
                    ticket: xml.Ticket
                  },
                  raw: true
                })
                if (inviteUser) {
                  let invitationRecords = await InvitationRecord.findAll({
                    where: {
                      openid: inviteUser.openid,
                      recroded: false
                    }
                  }) || []
                  if (invitationRecords.length >= 4) {
                    await InvitationRecord.create({
                      openid: inviteUser.openid,
                      invited_openid: FromUserName,
                      recroded: true,
                      invatedTime: new Date()
                    })  
                    try {
                      await InvitationRecord.update({
                        recroded: true
                      }, {
                        where: {
                          openid: inviteUser.openid
                        }
                      })
                    } catch (e) {
                      console.log(e)
                    }
                    await User.update({
                      resurrection: inviteUser.resurrection + 1
                    }, {
                      where: {
                        openid: inviteUser.openid
                      }
                    })
                  } else {
                    await InvitationRecord.create({
                      openid: inviteUser.openid,
                      invited_openid: FromUserName,
                      recroded: false
                    })                        
                  }
                }                  
              }
            }
          } else {
             //打印错误信息
            console.log(err);
          }
        })
    })
    res.send('success')
  }catch (error) {
    console.log('错误------->', error)
  }
})
// getAccessToken()

module.exports = router