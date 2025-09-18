import express from "express";
import http from "http";
import { randomUUID,randomBytes  } from "crypto";

import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { initRedis, redis } from "./redis";
import { sessionRouter } from "./routes/session.routes";
import { authRouter } from "./routes/auth.routes";
import { registerSocket, emitPendingIfAny } from "./services/session.service";
import { v4 as uuidv4 } from "uuid";

import cors from "cors";


const cookieParser = require("cookie-parser")
const app = express();
const morgan = require("morgan")
const server = http.createServer(app);
const io = new SocketIOServer(server, {path: "/socket.io", cors: { origin: "http://localhost:5173",credentials:true } });


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
app.use(cookieParser());

// make io available to routes/services
app.set("io", io);

app.use("/api/session", sessionRouter);
app.use("/api/auth",authRouter)


// issue a CSRF cookie if it's missing
app.use((req, res, next) => {
  if (!req.cookies?.csrf) {
    const csrfToken = randomBytes(32).toString("base64url");
    res.cookie("csrf", csrfToken, {
      sameSite: "lax",      // "strict" in prod if you can
      secure: process.env.NODE_ENV === "production",        // true behind HTTPS in prod
      path: "/",
    });
  }
  next();
});


app.use((req, res, next) => {
  const SAFE = new Set(["GET","HEAD","OPTIONS"]);
  if (SAFE.has(req.method)) return next();
  
  const csrfHeader = req.get("X-CSRF-Token");
  const csrfCookie = req.cookies?.csrf;
  
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) return res.sendStatus(403);
  next();
});




// WS handlers
io.on("connection", (socket) => {
  socket.on("join-session", async ({ sessionId }: { sessionId: string }) => {
    const ok = await registerSocket(sessionId, socket.id);
    if (ok) await emitPendingIfAny(io, sessionId);
  });
});

