import express from "express";
import http from "http";

import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { initRedis, redis } from "./redis";
import { sessionRouter } from "./routes/session.routes";
import { authRouter } from "./routes/auth.routes";
import { registerSocket, emitPendingIfAny } from "./services/session.service";
import { v4 as uuidv4 } from "uuid";

import cors from "cors";



const app = express();
const morgan = require("morgan")
const server = http.createServer(app);
const io = new SocketIOServer(server, {path: "/socket.io", cors: { origin: "*" } });


async function main() {
  await initRedis();               // <-- used to be top-level await
  server.listen(3000, () => {
    console.log("API on http://localhost:3000");
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

// (Optional but recommended if you’ll run multiple server instances)
// const pub = createClient({ url: process.env.REDIS_URL });
// const sub = pub.duplicate();
// await pub.connect(); await sub.connect();
// io.adapter(createAdapter(pub, sub));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// make io available to routes/services
app.set("io", io);

app.use("/api/session", sessionRouter);
app.use("/api/auth",authRouter)

// WS handlers
io.on("connection", (socket) => {
  socket.on("join-session", async ({ sessionId }: { sessionId: string }) => {
    const ok = await registerSocket(sessionId, socket.id);
    if (ok) await emitPendingIfAny(io, sessionId);
  });
});

