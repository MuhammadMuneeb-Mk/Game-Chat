🎮 Game Chat Application

A real-time multiplayer chat application inspired by in-game chat systems. Built using **Node.js**, **Socket.IO**, and a simple  
**HTML/CSS/JavaScript frontend**, it brings game-style communication features into a web environment.  

---  

📂 Project Structure  
  /index.js (Server-side Node.js with Socket.IO) 
  /chat.db  (SQLite database (optional))  
  /package.json  (Project metadata and dependencies)    
  /frontend/index.html (Chat UI)  
  /frontend/index.css (Styling for Game-Themed Chat [Minecraft Blocky Theme])  
  /frontend/app.js    (Client Side Socket Handling)  
  
---  
  
✨ Features  
  
  💬 Real-Time Global Chat  
    - Multiple users can join and chat simultaneously in a Global Chat.  
    - Messages are sent and received instantly via Socket.IO.  
  
  🖼️ Picture Messaging  
    - Users can send **images** & **GIF** in chat using file upload.  
    - Images and **GIF** are rendered inline like in game lobbies.  
  
  🔐 Private Messaging  
    - Send messages only visible to selected users.  
    - Supports **private image & GIF sharing**.  
  
  🧙 Slash Commands  
    - Use command `/help` for a list of all the commands avalaible and how to use them  
    - Use command `/msg [username] message` for sending private chats.  
    - Use command `/img [username]` and then upload the Images or GIF for sending it privately.  
    - Behaves like commands in MMORPG or FPS game lobbies.  
  
  🔔 User Activity Notifications  
    - Notifications when a user **joins** or **leaves** in the chat.  
  
---  
  
📦 Prerequisites  
  - [Node.js](https://nodejs.org/)  
  - npm socket  
  - npm express   
  - npm nodemon (Optional for automatic server Starting and Restarting)

📥 Setup
install all three nodes and then start the start the server using  
node index.js  
by typing it in the terminal and then access the local host through any browser [default port is 3000]
