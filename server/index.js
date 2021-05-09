const WebSocket = require('ws')

// 创建socket端口
const socket = new WebSocket.Server({port:3000})
// 当有人进入聊天室的时候 +1
let group = {}
// 客户端使用连接 var ws = new WebSocket('ws://127.0.0.1:3000') 
socket.on('connection',function connection(ws){
     console.log('连接成功')
   
    //  接受客户端信息
    ws.on('message', function(msg){
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
      socket.clients.forEach((client)=>{
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
       socket.clients.forEach((client)=>{
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