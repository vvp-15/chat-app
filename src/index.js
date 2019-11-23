const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {addUser , removeUser , getUser , getUsersInRoom} = require('./utils/users')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const app = express();
const server = http.createServer(app)
const io = socketio(server)

const port =process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname ,'../public')
app.use(express.static(publicDirectoryPath))

// let count =0 
io.on('connection',(socket) => {      //socket is an object
    // console.log('New websocket connection')

    // socket.emit('countUpdated',count)       //sending the event from server to client...it acceps name of the event as a parameter etc.
    // socket.on('increment',() => {
    //     count++
    //     //socket.emit('countUpdated',count)//only the 1 which perform will get notified ...thats why its a problem
    //     io.emit('countUpdated',count)
    // })

    
    socket.on('join',({username,room},callback) => {
        const {error, user} =addUser({id:socket.id , username, room})
            
        if(error) {
            return callback(error)
        }
        
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
     
    socket.on('Message',(message,callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username,message))  
        callback()
     }) 

     socket.on('send-location',(coords,callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
         callback()
     })
     
     socket.on('disconnect',() => {
       const user = removeUser(socket.id)
        if(user){
         io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
         io.to(user.room).emit('roomData',{
             room:user.room ,
             users : getUsersInRoom(user.room)
         })
        }

        })
})



server.listen(port ,(req,res)=> {
    console.log(`Server is up at port ${port}`)
})