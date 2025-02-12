const express = require("express");
const http = require("http");
const https = require("https"); // Fix for HTTPS self-ping
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

// ✅ **Fix: Self-ping using `https` to keep the server alive**
setInterval(() => {
    https.get("https://baxkend.onrender.com/", (res) => {
        console.log("Self-pinging to keep alive... Status:", res.statusCode);
    }).on("error", (err) => console.error("Ping failed:", err.message));
}, 5 * 60 * 1000); // Every 5 minutes

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
