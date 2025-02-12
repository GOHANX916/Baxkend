const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.get("/", (req, res) => res.send("WebSocket Server is running"));

// Store connected clients
const clients = new Set();

// WebSocket Connection
wss.on("connection", (ws) => {
    console.log("A user connected");
    clients.add(ws);

    ws.on("message", (message) => {
        console.log("Received:", message.toString());

        // Convert message to object
        const msgObj = JSON.parse(message);
        msgObj.seen = false; // Initially, the message is not seen

        // Broadcast message to all clients except sender
        clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify(msgObj));
            }
        });
    });

    ws.on("close", () => {
        console.log("A user disconnected");
        clients.delete(ws);
    });
});

// Keep Server Alive
setInterval(() => {
    require("http").get("https://baxkend.onrender.com/");
    console.log("Self-pinging to keep alive...");
}, 5 * 60 * 1000);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
