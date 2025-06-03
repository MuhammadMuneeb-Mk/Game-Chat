import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server, {
  connectionStateRecovery: {}
});
const users = {};

let db;
try {
  db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT,
      type TEXT CHECK(type IN ('text', 'image')),
      timestamp TEXT NOT NULL
    );
  `);
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}

app.use(express.static(join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'frontend', 'index.html'));
});

// Helper function to get consistent timestamps
function getCurrentLocalTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}



io.on('connection', async (socket) => {
  const username = socket.handshake.query.username;
  users[socket.id] = username;
  
  socket.broadcast.emit('user joined', `<${username}> joined the chat!`);


  socket.on('chat message', async (msg) => {
    const timestamp = getCurrentLocalTimestamp();

    if (msg.startsWith('/msg ')) {
      const parts = msg.trim().split(' ');
      if (parts.length < 3) {
      socket.emit('private message', 'Invalid format. Use: /msg username message', timestamp);
      return;
      }

      const targetName = parts[1];
      const privateMsg = parts.slice(2).join(' ');

      const targetSocketId = Object.keys(users).find(id => users[id] === targetName);

        if (targetSocketId) {
          io.to(targetSocketId).emit('private message', `<Private from ${username}> ${privateMsg}`, timestamp);
          socket.emit('private message', `<Private to ${targetName}> ${privateMsg}`, timestamp);
      } else {
          socket.emit('private message', `User "${targetName}" not found.`, timestamp);
      }
      return;
    }

    try {

      const result = await db.run(
        'INSERT INTO messages (content, type, timestamp) VALUES (?, ?, ?)',
        [`<${username}> ${msg}`, 'text', timestamp]
      );
      io.emit('chat message', `<${username}> ${msg}`, result.lastID, timestamp);
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  });

  socket.on('image upload', async (imageData) => {
    try {
      const timestamp = getCurrentLocalTimestamp();
      const result = await db.run(
        'INSERT INTO messages (content, type, timestamp) VALUES (?, ?, ?)',
        [imageData, 'image', timestamp]
      );
      io.emit('image upload', imageData, result.lastID, timestamp, username);
    } catch (e) {
      console.error('Failed to save image:', e);
    }
  });

  socket.on('private image', async ({ to, image }) => {
  const from = users[socket.id];
  const timestamp = getCurrentLocalTimestamp();

  const targetSocketId = Object.keys(users).find(id => users[id] === to);
  if (!targetSocketId) {
    socket.emit('private message', `User "${to}" not found.`, timestamp);
    return;
  }

  
    io.to(targetSocketId).emit('private image', image, timestamp, { from, to });
    socket.emit('private image', image, timestamp, { from, to }); // Show to sender too


});


  if (!socket.recovered) {
    try {
      await db.each(
        'SELECT id, content, type, timestamp FROM messages WHERE id > ?',
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          if (row.type === 'text') {
            socket.emit('chat message', row.content, row.id, row.timestamp);
          } else if (row.type === 'image') {
            socket.emit('image upload', row.content, row.id, row.timestamp);
          }
        }
      );
    } catch (e) {
      console.error('Recovery failed:', e);
    }
  }

  socket.on('disconnect', () => {
    socket.broadcast.emit('user left', `<${users[socket.id]}> has left the chat`);
    delete users[socket.id]
  });
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});