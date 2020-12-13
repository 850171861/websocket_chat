const WebSocket = require('ws')

const wss = new WebSocket.Server({
  port: 3003
})

let num = 0
wss.on('connection', function connection(ws) {
  console.log('服务器连接成功')
  //接送客户端信息
  ws.on('message', function (msg) {
    // console.log('接送客户端信息成功', msg)
    //主动发送信息给client
    // ws.send(msg)
    //赋值名字
    const msgObj = JSON.parse(msg)
    if (msgObj.event === 'enter') {
      ws.name = msgObj.message
      num++
    }
    //广播信息
    wss.clients.forEach((client) => {
      //判断非自己客户端
      // console.log(ws)
      // console.log(client)
      if (client.readyState === WebSocket.OPEN) {
        msgObj.name = ws.name
        msgObj.num = num
        client.send(JSON.stringify(msgObj))

      }
    })
  })
  //当ws客户断开连接的时候
  ws.on('close', function () {
    if (ws.name) {
      num--
    }
    let msgObj = {}
    wss.clients.forEach((client) => {
      //判断非自己的客户端
      if (client.readyState === WebSocket.OPEN) {
        msgObj.name = ws.name
        msgObj.num = num
        msgObj.event = 'out'
        client.send(JSON.stringify(msgObj))
      }
    })
  })

})