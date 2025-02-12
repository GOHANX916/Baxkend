const express = require("express");
const WebSocket = require("ws");
const axios = require("axios");
const cors = require("cors");

const PORT = process.env.PORT || 10000; // Use Render's dynamic port
const app = express();
app.use(cors());

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

let users = {}; // Store connected users

// WebSocket Connection
wss.on("connection", (ws) => {
    ws.on("message", (data) => {
        const message = JSON.parse(data);
        
        if (message.type === "join") {
            users[message.username] = ws;
            broadcast({ type: "updateUsers", users: Object.keys(users) });
        }

        if (message.type === "message") {
            sendMessage(message);
        }

        if (message.type === "seen") {
            notifySeen(message);
        }
    });

    ws.on("close", () => {
        const user = Object.keys(users).find((key) => users[key] === ws);
        if (user) delete users[user];
        broadcast({ type: "updateUsers", users: Object.keys(users) });
    });
});

// Send messages
function sendMessage(message) {
    if (users[message.to]) {
        users[message.to].send(JSON.stringify({ type: "message", ...message, status: "received" }));
    }
    if (users[message.from]) {
        users[message.from].send(JSON.stringify({ type: "message", ...message, status: "sent" }));
    }
}

// Notify message seen
function notifySeen(message) {
    if (users[message.from]) {
        users[message.from].send(JSON.stringify({ type: "seen", id: message.id }));
    }
}

// Broadcast updates
function broadcast(data) {
    wss.clients.forEach((client) => client.send(JSON.stringify(data)));
}

// Prevent Render from sleeping
setInterval(() => {
    axios.get("https://baxkend.onrender.com/").catch(() => {});
}, 300000); // Every 5 minutes

app.get("/", (req, res) => res.send("Chat Server is Running"));
