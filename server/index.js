const WebSocket = require('ws')
const http = require('http')


// 创建socket端口
const wss = new WebSocket.Server({noServer:true})
const server = http.createServer()
const jwt = require('jsonwebtoken')

const timeInterval = 1000
// 当有人进入聊天室的时候 +1
let group = {}
// 客户端使用连接 var ws = new WebSocket('ws://127.0.0.1:3000') 
wss.on('connection',function connection(ws){
  // 初始的心跳连接状态
  ws.isAlive = true
     console.log('连接成功')
    //  接受客户端信息
    ws.on('message', function(msg){
      console.log(msg)
    // 接受客户端消息并转换对象
    const msgObj = JSON.parse(msg)
    // 如果是携带enter进来，把消息当用名字
     if(msgObj.event === 'enter'){
       ws.name = msgObj.message
       ws.id = msgObj.id
       if(typeof group[ws.id] === 'undefined'){
         group[ws.id] = 1
       }else{
         group[ws.id] ++
       }
     }
    //  鉴权
    if(msgObj.event === 'auth'){
      jwt.verify(msgObj.message,'secret',(err,decode)=>{
        if(err){
          // websocket返回 鉴权失败
           ws.send(JSON.stringify({
               event:'noauth',
               message:'鉴权失败'
             }))
          console.log('auth error')
          return
        }else{
          // 鉴权通过
          console.log('鉴权成功')
          ws.isAuth = true
          return
        }
      })
      return
    }
    // 鉴权拦截，
    if(!ws.isAuth){
     return
    }

    // 心跳检测
    if(msgObj.event === 'heartbeat' && msgObj.message === 'pong'){
      ws.isAlive = true
      return  
    }
      wss.clients.forEach((client)=>{
        // 根据id房间号进行广播消息
        if(client.readyState === WebSocket.OPEN && client.id === ws.id ){
          msgObj.name = ws.name
          // 获取当前连接数
          // 广播消息客户端
          msgObj.num = group[ws.id]
          client.send(JSON.stringify(msgObj))
        }
      })
    })

    // 监听客户端关闭连接
    ws.on('close',function(){
      // 客户端关闭连接，对人数进行减一
      if(ws.name){
        group[ws.id] --
      }
      let msgObj = {}
      // 给客户端广播谁离开的聊天室，并更新在线人数
       wss.clients.forEach((client)=>{
        // 判断非自己客户端
        if(client.readyState === WebSocket.OPEN && client.id === ws.id){
          msgObj.name = ws.name
          msgObj.num = group[ws.id]
          // 离开聊天室
          msgObj.event = 'out'
          client.send(JSON.stringify(msgObj))
        }
      })
    })
})

server.on('upgrade',function upgrade(request,socket,head){
  // console.log('1',request)

  wss.handleUpgrade(request,socket,head,function done(ws){
    wss.emit('connection',ws)
  })
})

server.listen(3000)


setInterval(() => {
   wss.clients.forEach((ws)=>{
     if(ws.isAlive === false && ws.id){
      group[ws.id] --
      // 删除id
      delete ws['id']
      // 终止websocket
      return ws.terminate() 
     }
    // 主动发送心跳检测请求
    // 当客户端返回消息后，主动设置flag为在线
    ws.isAlive = false
    ws.send(JSON.stringify({
      event:'heartbeat',
      message:'ping',
      num:group[ws.id]
    }))
   })
}, timeInterval);