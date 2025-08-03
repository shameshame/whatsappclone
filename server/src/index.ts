import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// In-memory store: sessionId → socketId
const sessions = new Map();

// 1) When desktop requests a new session:
app.post("/api/session", (req, res) => {
  const sessionId = uuidv4();
  // don’t set socketId yet—that comes in the WebSocket “join”
  sessions.set(sessionId, null);
  res.json({ sessionId });
});

// 2) When mobile scanner validates:
app.post("/api/session/validate", (req, res) => {
  const { sessionId } = req.body;
  const socketId = sessions.get(sessionId);
  if (socketId) {
    io.to(socketId).emit("session-validated", { sessionId });
    res.json({ ok: true });
  } else {
    res.status(404).json({ ok: false, message: "Unknown session" });
  }
});

io.on("connection", (socket) => {
  console.log("WS connected:", socket.id);

  // 3) Desktop calls this over WS after generating sessionId
  socket.on("join-session", ({ sessionId }) => {
    if (sessions.has(sessionId)) {
      sessions.set(sessionId, socket.id);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    }
  });

  socket.on("disconnect", () => {
    // clean up any sessions that pointed to this socket
    for (const [sid, sock] of sessions.entries()) {
      if (sock === socket.id) sessions.delete(sid);
    }
  });
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
