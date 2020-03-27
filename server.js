const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { 
    userJoin, 
    getCurrentUser, 
    userLeave, 
    getRoomUsers 
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
require('dotenv/config')

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        
        const user = userJoin(socket.id, username, room)
        
        socket.join(user.room)
        
        //runs when client come out
        const botName = 'Монгол чат бот '
        socket.emit('message',formatMessage(botName,'Өдрийн мэнд!, тавтай морил :)'))
        //when a user connects
        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage(botName,`${user.username}, өрөөнд нэвтэрлээ!`))
        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    //listen for chatmessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        socket.join(user.room)
        io.to(user.room).emit('message',formatMessage(user.username, msg))
    })
    //runs when client disconnects
    socket.on('disconnect', () => {
        const botName = 'Монгол чат бот '
        const user = userLeave(socket.id)
        
        if(user){
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username}, өрөөнөөс гарлаа!`))
            
            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
        })
        }
    })

})

server.listen(process.env.PORT, () => {
    console.log(`server running on ${process.env.PORT}`)
})