const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 10000;
let users = {}; // Store connected users {socket: {id, username, status}}

app.use(cors());
app.use(express.json());

// Keep server awake on Render
setInterval(() => {
  http.get("http://baxkend.onrender.com");
}, 60000); // Ping every 1 minute

wss.on("connection", (ws) => {
  console.log("A user connected");

  // Assign a unique ID to each user
  const userId = Date.now();
  users[ws] = { id: userId, status: "online" };

  // Notify others of new online user
  broadcastUserStatus();

  ws.on("message", (message) => {
    try {
      let data = JSON.parse(message);
      
      if (data.type === "message") {
        // Broadcast message with single tick (sent)
        let msg = { 
          type: "message", 
          sender: userId, 
          text: data.text, 
          status: "✔" 
        };
        broadcastMessage(msg);

        // Simulate message being received
        setTimeout(() => {
          msg.status = "✔✔"; // Double tick (received)
          broadcastMessage(msg);
        }, 500);

        // Simulate message being seen
        setTimeout(() => {
          msg.status = "✔✔ (blue)"; // Blue double tick (seen)
          broadcastMessage(msg);
        }, 1500);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.on("close", () => {
    console.log("A user disconnected");
    delete users[ws];
    broadcastUserStatus();
  });
});

// Send updated online/offline users
function broadcastUserStatus() {
  let onlineUsers = Object.values(users).map((user) => ({
    id: user.id,
    status: user.status,
  }));
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "users", users: onlineUsers }));
    }
  });
}

// Send message to all connected users
function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
