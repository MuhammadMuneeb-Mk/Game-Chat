let username;
while (!username) {
    username = prompt("Enter your username:");
  }

const socket = io({
    auth: {
      serverOffset: 0
    },
    query: { username }
  });
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const trimmedInput = input.value.trim();
  if (!trimmedInput) return;

  if (trimmedInput.startsWith('/')) {
    const parts = trimmedInput.split(' ');
    const command = parts[0];

    // Allow only /msg and /img commands
    if (command === '/msg' || command === '/img') {
      socket.emit('chat message', trimmedInput);
      input.value = '';
    } else if (command === '/help') {
      showClientError(
        'Commands:\n' +
        '/msg [username] [message] - Send a private message\n' +
        '/img [username] - Send a private image (select file after typing)\n' +
        '/help - Show this help message'
      );
      input.value = '';
    } else {
      showClientError('Unknown command. Type /help for help');
      // Do NOT send the message
    }
  } else {
    // Normal message
    socket.emit('chat message', trimmedInput);
    input.value = '';
  }
});


let isAtBottom = true;

function checkScrollPosition() {
    const threshold = 50; // pixels from bottom
    isAtBottom = messages.scrollTop + messages.clientHeight + threshold >= messages.scrollHeight;
}

function formatTime(timestamp) {
try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }}

  function showClientError(msg) {
  const item = document.createElement('li');
  item.textContent = msg;
  item.classList.add('client-error-message');
  item.style.color = 'red';
  item.style.fontStyle = 'italic';
  messages.appendChild(item);
  if (isAtBottom) {
    messages.scrollTop = messages.scrollHeight;
  }
}

  

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imageData = reader.result; // base64 string

    const inputValue = input.value.trim();
    if (inputValue.startsWith('/img ')) {
      const parts = inputValue.split(' ');
      const targetName = parts[1];
      if (!targetName) {
        alert('Specify a recipient using /img username');
        return;
      }
      socket.emit('private image', { to: targetName, image: imageData });
    } else {
      socket.emit('image upload', imageData);
    }

    input.value = ''; // clear input
  };
  reader.readAsDataURL(file); // convert to base64
});


socket.on('chat message', (msg, serverOffset, timestamp) => {
  const item = document.createElement('li');
  const timeSpan = document.createElement('span');
  timeSpan.textContent = formatTime(timestamp);
  timeSpan.className = 'message-time';
  item.appendChild(timeSpan);
  
  const contentSpan = document.createElement('span');
  contentSpan.textContent = msg;
  contentSpan.className = 'message-content';
  item.appendChild(contentSpan);
  
  messages.appendChild(item);
  
  if (isAtBottom) {
    messages.scrollTop = messages.scrollHeight;
  }
  
  socket.auth.serverOffset = serverOffset;
});

socket.on('user joined', (msg) => {
  const notification = document.createElement('li');
  notification.textContent = msg;
  notification.classList.add('join-notification');
  messages.appendChild(notification);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('user left', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  item.classList.add('leave-notification');
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

uploadBtn.addEventListener('click', () => {
  fileInput.click(); // trigger hidden file input
});

/*
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imageData = reader.result; // base64 string
    socket.emit('image upload', imageData);
  };
  reader.readAsDataURL(file); // convert to base64
});
*/

socket.on('image upload', (imageData, serverOffset, timestamp, senderName) => {
  const item = document.createElement('li');
  
  const timeSpan = document.createElement('span');
  timeSpan.textContent = formatTime(timestamp);
  timeSpan.className = 'message-time';
  item.appendChild(timeSpan);

  const senderSpan = document.createElement('span');
  senderSpan.textContent = `<${senderName}>`;
  senderSpan.style.fontWeight = 'bold';
  senderSpan.style.marginRight = '8px';
  item.appendChild(senderSpan);
  
  const img = document.createElement('img');
  img.src = imageData;
  img.className = 'message-image';
  item.appendChild(img);
  
  img.onload = () => {
    if (isAtBottom) {
      messages.scrollTop = messages.scrollHeight;
    }
  };
  
  messages.appendChild(item);
  
  if (isAtBottom) {
    messages.scrollTop = messages.scrollHeight;
  }
});

socket.on('private message', (msg, timestamp) => {
  const item = document.createElement('li');
  const timeSpan = document.createElement('span');
  timeSpan.textContent = formatTime(timestamp);
  timeSpan.className = 'message-time';
  item.appendChild(timeSpan);

  const contentSpan = document.createElement('span');
  contentSpan.textContent = msg;
  contentSpan.className = 'private-message';
  item.appendChild(contentSpan);

  item.style.color = 'purple'; // distinguish private messages
  messages.appendChild(item);
  if (isAtBottom) {
    messages.scrollTop = messages.scrollHeight;
  }
});

socket.on('private image', (imageData, timestamp, { from, to }) => {
  const item = document.createElement('li');
  const timeSpan = document.createElement('span');

  timeSpan.textContent = formatTime(timestamp);
  timeSpan.className = 'message-time';
  item.appendChild(timeSpan);

  const info = document.createElement('div');
  if (from === username) {
    info.textContent = `<Private image to ${to}>`;  // sent by me
  } else {
    info.textContent = `<Private image from ${from}>`;  // received
  }
  info.style.fontStyle = 'italic';
  item.appendChild(info);

  const img = document.createElement('img');
  img.src = imageData;
  img.className = 'message-image';
  item.appendChild(img);

  messages.appendChild(item);
  if (isAtBottom) {
    messages.scrollTop = messages.scrollHeight;
  }
});


// Track scroll position
messages.addEventListener('scroll', checkScrollPosition);

// Initialize scroll position check
checkScrollPosition();