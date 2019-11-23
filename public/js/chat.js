 const socket = io()
//Elements
 const $messageForm = document.querySelector('#msg-form')
 const $messageFormInput = $messageForm.querySelector('input')
 const $messageFormButton = $messageForm.querySelector('button')
 const $locationButton = document.querySelector('#send-location')
 const $messages = document.querySelector('#messages')


 //  socket.on('countUpdated',(count) => {
//      console.log(`the count has been updated`,count)
//  })
//  document.querySelector('#increment').addEventListener('click',()=> {
//      console.log('Clicked')
//      socket.emit('increment')    ///sending data from client to server
//  })

const autoscroll = ( ) => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight+newMessageMargin

    //visible height 
     const visibleHeight = $messages.offsetHeight

    //height of message container
     const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})
socket.on('message',(message) =>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('locationMessage',(text) => {
    console.log(text)
    const html = Mustache.render(locationTemplate,{
        username:text.username,
        url:text.url,
        createdAt:moment(text.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room , users}) => {
  const html = Mustache.render(sidebarTemplate,{
      room,
      users
  })
  document.querySelector('#sidebar').innerHTML = html
})
const messageForm = document.querySelector('#msg-form')
messageForm.addEventListener('submit',(e) => {
    e.preventDefault()
    //disabling button
    $messageFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value
    socket.emit('Message',message,(error) =>{
        //enabling button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log('Message Delivered!')
    })
})

document.querySelector('#send-location').addEventListener('click',() => {
    
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) =>{
           socket.emit('send-location',{
               latitude:position.coords.latitude,
            longitude: position.coords.longitude
           },() =>{
              console.log('location shared!') 
              $locationButton.removeAttribute('disabled')
           })
    })
})

socket.emit('join',{username,room},(error) =>{
    if(error) {
        alert(error)
        location.href='/'
    }
})