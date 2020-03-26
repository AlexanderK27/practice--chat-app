const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const systemMessageTemplate = document.querySelector('#system-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) + parseInt(newMessageStyles.marginTop)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHieght = $messages.scrollHeight

    // How far user has scrolled:
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHieght - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

const insertSystemMessageToHTML = (message) => {
    const html = Mustache.render(systemMessageTemplate, {
        message
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
}

socket.on('systemMessage', (message) => {
    insertSystemMessageToHTML(message)
})

socket.on('message', (message, id) => {
    if (id === socket.id) {
        const html = Mustache.render(messageTemplate, {
            class: 'my-message',
            username: 'You',
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    } else {
        const html = Mustache.render(messageTemplate, {
            class: 'message',
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    }
    autoscroll()
})

socket.on('locationMessage', (message, id) => {
    if (id === socket.id) {
        const html = Mustache.render(locationMessageTemplate, {
            class: 'my-message',
            username: 'You',
            locationURL: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    } else {
        const html = Mustache.render(locationMessageTemplate, {
            class: 'message',
            username: message.username,
            locationURL: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    }
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    const messageText = e.target.elements.message.value

    if (messageText.trim() != '') {
        $messageFormButton.setAttribute('disabled', 'disabled')

        socket.emit('sendMessage', messageText, (error) => {
            $messageFormButton.removeAttribute('disabled')
            $messageFormInput.value = ''

            if (error) {
                return insertSystemMessageToHTML(error)
            }
            //console.log('Message delivered!')
        })
    }
    $messageFormInput.focus()
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation does not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            //console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})