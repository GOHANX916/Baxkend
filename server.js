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

// WebSocket Connection
wss.on("connection", (ws) => {
    console.log("A user connected");

    ws.on("message", (message) => {
        console.log("Received:", message.toString());

        // Broadcast message to all clients **except the sender**
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
                client.send(message.toString());
            }
        });
    });

    ws.on("close", () => console.log("A user disconnected"));
});

// **Self-ping every 5 minutes to keep the server alive**
setInterval(() => {
    require("http").get("https://baxkend.onrender.com/");
    console.log("Self-pinging to keep alive...");
}, 5 * 60 * 1000); // 5 minutes

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
