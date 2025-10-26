import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import logger from "morgan";
import cron from "node-cron";

import authRoutes from "./router/auth.route.js";
import websocketRoutes from "./Websockets/websocket.controller.js";
import { createTournament } from "./controllers/tournament.controller.js";
import { getRegularQueueCounts } from "./controllers/matchmaking.controller.js";
import { v1LeaderboardController } from "./controllers/leaderboards/1v1leaderboard.controller.js";
import { getTournamentLeaderboard } from "./controllers/leaderboards/tournamentLeaderboard.controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// ------------------
// HTTP + Socket setup
// ------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
      : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ------------------
// Middleware
// ------------------
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));

// Basic CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow mobile apps (no origin)
      if (!origin) return callback(null, true);
      // allow all if CORS_ALLOW_ALL=true
      if (process.env.CORS_ALLOW_ALL === "true") return callback(null, true);
      // check whitelist
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin: " + origin), false);
    },
    credentials: true,
  })
);

// ------------------
// API routes
// ------------------
app.get("/", (_, res) => res.json({ status: "running" }));

app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", v1LeaderboardController);
app.use("/api/tournaments", getTournamentLeaderboard);

app.get("/api/queue/live-users", async (_, res) => {
  try {
    const data = await getRegularQueueCounts();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[live-users] Error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// ------------------
// WebSocket routes
// ------------------
websocketRoutes(io);

// ------------------
// Daily tournament cron (9 AM server time)
// ------------------
cron.schedule("0 9 * * *", async () => {
  try {
    const now = new Date();
    const startTime = new Date(now);
    const endTime = new Date(now);
    startTime.setHours(9, 0, 0, 0);
    endTime.setHours(23, 59, 59, 999);

    await createTournament({
      name: `Daily Tournament ${now.toLocaleDateString()}`,
      capacity: 200,
      startTime,
      endTime,
    });

    console.log(`[CRON] Created daily tournament for ${now.toLocaleDateString()}`);
  } catch (err) {
    console.error("[CRON] Failed to create tournament:", err);
  }
});

// ------------------
// MongoDB + Server
// ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, HOST, () =>
      console.log(`🚀 Server running on http://${HOST}:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
