var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var Router = require('./routes');
// const getAccessToken = require('./routes/wechat.js');
var app = express();


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));

//加载主外键关系及创建数据库
require('./models/ref')

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'X-HTTP-Method-Override, talk, X-Token, smail, Content-Type, Content-Length, X-Requested-With, Accept,Access-Control-Request-Method, Access-Control-Request-Headers, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

Router(app);

app.get('/', function (req, res) {
   res.send('Hello World');
})

app.get('/test', function (req, res) {
   res.json({
    code: 1,
    msg: 'success'
   });
})


let server = app.listen(3000, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
})
const { login, resurrection, disconnect, logout } = require('./socket_events')
// 间隔 8 秒发送一次心跳检测，6 秒后确认连接
let io = require('socket.io')(server, {
  pingInterval: 8000,
  pingTimeout: 6000
})

io.on('connection', async (socket) => {
  socket.on('login', login(socket, io))
  socket.on('logout', logout(socket, io))
  socket.on('resurrection', resurrection(socket, io))
    // 意外断开连接，会自动离开 room
  socket.on('disconnect', disconnect(socket, io))
})
var gameFunction = require('./libs/gameFunction.js')
app.get('/start/:id', function (req, res) {
  let id = req.params.id
  gameFunction(io, id)
  res.json({code: 0})
})


module.exports = app;