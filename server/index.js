// staging
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import logger from "morgan";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./router/auth.route.js";
import websocketRoutes from "./Websockets/websocket.controller.js";
import UserModel from "./models/User.model.js";
import { createTournament } from "./controllers/tournament.controller.js";
import cron from 'node-cron';
import { getRegularQueueCounts } from "./controllers/matchmaking.controller.js";
import { v1LeaderboardController } from "./controllers/leaderboards/1v1leaderboard.controller.js";
import { getTournamentLeaderboard } from "./controllers/leaderboards/tournamentLeaderboard.controller.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// HTTP server created from the Express app
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',             // allow native apps (no Origin header)
    methods: ['GET','POST'],
  },
  transports: ['websocket', 'polling'],
});

// CORS configuration
const allowedOrigins = [
  "http://localhost:8081",
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Add this
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Add this
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ], // Add this
  })
);

// app.options("*", cors());

// To check server status
app.get("/", (req, res) => {
  res.json({ status: "running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leaderboard",  v1LeaderboardController);
app.use("/api/tournaments", getTournamentLeaderboard);

app.get("/api/queue/live-users", async (req, res) => {
  try {
    const responsePayload = await getRegularQueueCounts();
    res.json({ success: true, data: responsePayload });
  } catch (error) {
    console.error("[live-users] Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live user counts",
    });
  }
});


// web-socket
websocketRoutes(io);

cron.schedule('08 00 * * *', async () => {
        try {
            const now = new Date();
            // For testing, use current time
            const startTime = new Date(now);
            const endTime = new Date(now);
            startTime.setHours(0, 8, 0, 0); // Set start time to 9 AM
            endTime.setHours(24, 0, 0, 0); // Set end time to 9 PM
            
            await createTournament({ 
                name: `Daily Tournament ${now.toLocaleDateString()}`, 
                capacity: 200,
                startTime: startTime,
                endTime: endTime
            });

            console.log(`[scheduleAutomaticTournaments] Created daily tournament starting at ${startTime}`);
        } catch (error) {
            console.error('[scheduleAutomaticTournaments] Failed to create daily tournament:', error);
        }
    });

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("Failed to connect to MongoDB", err));
