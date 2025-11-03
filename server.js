// server.js — Socket.IO v4.8.1 (Node.js)
const { v4: uuidv4 } = require('uuid');

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  const clientId = uuidv4();
  console.log(`🔗 Client connected: ${clientId}`);
  socket.join(clientId);

  // Keep track of whether this client is a phone or a browser
  socket.on('register', (type) => {
    socket.data.type = type; // 'phone' or 'viewer'
    console.log(`📍 ${clientId} registered as ${type}`);
  });

  // ----- WebRTC signaling -----
  socket.on('offer', (data) => {
    console.log('📨 Offer from phone');
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log('📨 Answer from viewer');
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  // ----- Camera commands (same as before) -----
  socket.on('command', (cmd) => {
    console.log('🖥️ Command received:', cmd);
    io.emit(cmd); // broadcast to phones
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
  });
});
// שליחת פקודת הפעלת מצלמה
app.get("/start", (req, res) => {
  io.emit("start_camera");
  res.send("📸 Camera Permission Sent!");
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running on Port :${PORT}`);
});
