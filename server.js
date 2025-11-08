// server.js — Render compatible (keeping your public folder)
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const ACCESS_KEY = process.env.ACCESS_KEY;

// ✅ תיקון: ביטול ה־CSP של Render כדי שה־index.html יעבוד
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

// 🟢 מגיש את כל הקבצים שלך בדיוק כמו שהיה
app.use(express.static('public'));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let phoneSocket = null;

io.on('connection', (socket) => {
  const clientId = uuidv4();
  console.log(`🔗 Client connected: ${clientId}`);

  socket.on('auth', (key) => {
    if (key !== ACCESS_KEY) {
      console.log('❌ Unauthorized connection attempt');
      socket.emit('auth_error', 'Unauthorized');
      socket.disconnect(true);
      return;
    }
    console.log('🔑 Authorized connection');
    socket.emit('auth_success');
  });

  socket.on('register', (type) => {
    socket.data.type = type;
    console.log(`📍 ${clientId} registered as ${type}`);

    if (type === "phone") {
      phoneSocket = socket;
    }
  });

  // ----- WebRTC -----
  socket.on('offer', (data) => {
    console.log('📨 Offer from phone');
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log('📩 Answer from viewer');
    if (phoneSocket) phoneSocket.emit('answer', data);
  });

  socket.on('ice-candidate', (candidate) => {
    if (socket.data.type === "phone") {
      socket.broadcast.emit('ice-candidate', candidate);
    } else {
      if (phoneSocket) phoneSocket.emit('ice-candidate', candidate);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    if (socket === phoneSocket) phoneSocket = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server Running on Port ${PORT}`);
});
