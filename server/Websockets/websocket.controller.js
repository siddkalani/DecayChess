import dotenv from "dotenv";
import {
  makeMove,
  getPossibleMoves,
  resign,
  offerDraw,
  acceptDraw,
  declineDraw,
  applyTimeoutPenalty
} from "../controllers/game.controller.js";
import {
  joinQueue,
  cleanupIdleUsers,
  handleDisconnect,
  emitRegularQueueCounts,
} from "../controllers/matchmaking.controller.js";
import { createTournament, getActiveTournamentDetails, joinTournament, leaveTournament } from "../controllers/tournament.controller.js";
import tournamentModel from "../models/tournament.model.js";
import UserModel from "../models/User.model.js";

dotenv.config();

// In-memory mapping for socketId <-> userId
const socketIdToUserId = {};

const websocketRoutes = (io) => {
  const matchmakingNamespace = io.of("/matchmaking");

  matchmakingNamespace.on("connection", (socket) => {
        // userId should ideally come from an authenticated session (e.g., JWT in handshake.auth.token)
        const queryParams = socket.handshake.auth;
        const userId = queryParams.userId; // Get userId from auth payload

        if (!userId) {
            console.error("UserId not provided in handshake auth");
            socket.disconnect(true);
            return;
        }

        // Store the mapping for disconnection handling
        socketIdToUserId[socket.id] = userId;
      console.log(`User ${userId} connected to socket: ${socket.id}`);

      emitRegularQueueCounts(matchmakingNamespace, socket.id);

      socket.on("queue:get_live_counts", async () => {
        await emitRegularQueueCounts(matchmakingNamespace, socket.id);
      });

        // --- Regular Matchmaking Events ---
        socket.on("queue:join", async ({ variant, subvariant = '' }) => {
            console.log("Received queue:join for user", userId, "variant", variant, subvariant);

            try {
                // The socketIdToUserId mapping is already handled on connection.

                await joinQueue({
                    userId,
                    socketId: socket.id,
                    variant,
                    io: matchmakingNamespace, // Pass the namespace for emitting events
                    subvariant,
                });

                console.log(`User ${userId} successfully joined the regular queue`);
            } catch (err) {
                console.error("Error joining regular queue:", err);
                socket.emit("queue:error", {
                    message: "Failed to join regular queue",
                    error: err.message || err,
                });
            }
        });

      socket.on("queue:leave", async () => {
        try {
          await handleDisconnect(userId, socket.id); // Use the general disconnect handler for cleanup
          socket.emit("queue:left");
          console.log(`User ${userId} explicitly left the regular queue`);
          await emitRegularQueueCounts(matchmakingNamespace);
        } catch (err) {
          socket.emit("queue:error", {
            message: "Failed to leave regular queue",
            error: err.message,
          });
            }
        });

        // --- Tournament Matchmaking Events ---
        socket.on("tournament:join", async () => {
            console.log(`Received tournament:join for user ${userId}`);
            try {
                await joinTournament({
                    userId,
                    socketId: socket.id,
                    io: matchmakingNamespace, // Pass the namespace
                });
                console.log(`User ${userId} successfully joined the tournament`);
            } catch (err) {
                console.error("Error joining tournament:", err);
                socket.emit("tournament:error", {
                    message: "Failed to join tournament",
                    error: err.message || err,
                });
            }
        });

        socket.on("tournament:leave", async () => {
            console.log(`Received tournament:leave for user ${userId}`);
            try {
                const activeTournament = await getActiveTournamentDetails();
                if (activeTournament) {
                    await leaveTournament(userId, activeTournament.id); // Use the tournament-specific leave
                    socket.emit("tournament:left", { message: 'You have left the tournament.' });
                    console.log(`User ${userId} explicitly left tournament ${activeTournament.id}`);
                } else {
                    socket.emit("tournament:error", { message: "No active tournament to leave." });
                }
            } catch (err) {
                console.error("Error leaving tournament:", err);
                socket.emit("tournament:error", {
                    message: "Failed to leave tournament",
                    error: err.message,
                });
            }
        });

        socket.on("tournament:get_active", async () => {
            console.log(`Received tournament:get_active for user ${userId}`);
            try {
                const activeTournament = await getActiveTournamentDetails();
                socket.emit("tournament:active_details", { tournament: activeTournament });
            } catch (err) {
                console.error("Error fetching active tournament details:", err);
                socket.emit("tournament:error", {
                    message: "Failed to fetch active tournament details.",
                    error: err.message || err,
                });
            }
        });

        // Event for creating tournaments (typically an admin-only action)
        socket.on("tournament:create", async ({ name, capacity, startTime, duration, entryFee, prizePool }) => {
            // Implement authorization check here (e.g., if user is admin)
            if (userId !== 'ADMIN_USER_ID') { // Replace with actual admin check
                socket.emit('tournament:error', { message: 'Unauthorized: Only admins can create tournaments.' });
                return;
            }
            try {
                const tournamentId = await createTournament({ name, capacity, startTime, duration, entryFee, prizePool });
                // Emit to all connected clients in the namespace to notify about new tournament
                matchmakingNamespace.emit('tournament:new_active', { tournamentId, name, message: 'A new tournament has been created!' });
                socket.emit('tournament:created', { tournamentId, message: 'Tournament created successfully.' });
                console.log(`Admin ${userId} created tournament ${tournamentId}`);
            } catch (error) {
                console.error('Error creating tournament:', error);
                socket.emit('tournament:error', { message: 'Failed to create tournament.' });
            }
        });


        // --- Disconnect Handling ---
      socket.on("disconnect", async () => {
          const disconnectedUserId = socketIdToUserId[socket.id];
          if (disconnectedUserId) {
              // Use the universal handleDisconnect that checks both regular and tournament queues
              await handleDisconnect(disconnectedUserId, socket.id);
              delete socketIdToUserId[socket.id];
              console.log(`User disconnected and cleaned up from queues: ${disconnectedUserId}`);
              await emitRegularQueueCounts(matchmakingNamespace);
          } else {
              console.log(`Socket disconnected without mapped user: ${socket.id}`);
          }
        });
    });

  // Periodic cleanup of idle users
  const intervalId = setInterval(() => {
    cleanupIdleUsers()
      .then(() => emitRegularQueueCounts(matchmakingNamespace))
      .catch((err) => console.error('[cleanupIdleUsers] Interval error:', err));
  }, 60 * 1000);

  // Optional: cleanup on server shutdown
  process.on("SIGINT", () => {
    clearInterval(intervalId);
    process.exit();
  });

  // Game namespace for handling chess moves
  const gameNamespace = io.of("/game");

  gameNamespace.on("connection", (socket) => {
    const queryParams = socket.handshake.auth
    console.log("queryParams:", queryParams)
    const { userId, sessionId, variant, subvariant } = queryParams
    console.log("User connected to game socket:", socket.id, "UserId:", userId, "SessionId:", sessionId)

    if (!userId || !sessionId) {
      console.error("UserId/sessionId not provided in handshake auth")
      socket.disconnect(true)
      return
    }

    // Join the session room so both players get updates
    socket.join(sessionId)
    console.log(`User ${userId} joined session room ${sessionId}`)
    // --- Outgoing events from client ---
    // Make move
    socket.on("game:makeMove", async ({ move, timestamp }) => {
      try {
        const result = await makeMove({ sessionId, userId, move, timestamp, variant, subvariant })
        if (result && result.type === "game:warning") {
          console.warn("Game warning:", result.message)
          gameNamespace
            .to(sessionId)
            .emit("game:warning", { message: result.message, move: result.move, gameState: result.gameState })
          return
        }
        
        // Special handling for timeout penalty
        if (result && result.type === "game:timeoutPenalty") {
          console.log("Timeout penalty applied:", result.message)
          
          // Emit timeout penalty notification
          gameNamespace.to(sessionId).emit("game:warning", { 
            message: result.message, 
            timeoutPenalty: result.timeoutPenalty,
            gameState: result.gameState 
          })
          
          // Emit game state update to refresh UI
          gameNamespace.to(sessionId).emit("game:gameState", { gameState: result.gameState })
          
          // Emit timer update to show new turn and reset timers
          gameNamespace.to(sessionId).emit("game:timer", {
            white: result.gameState.board.whiteTime,
            black: result.gameState.board.blackTime,
            activeColor: result.gameState.board.activeColor,
          })
          
          console.log(`Timeout penalty processed for session ${sessionId}`)
          return
        }
        
        const { move: moveObj, gameState } = result
        // Always emit all game events to the whole session
        gameNamespace.to(sessionId).emit("game:move", { move: moveObj, gameState })

        // --- MODIFICATION START ---
        // Emit main game timers from gameState.board
        gameNamespace.to(sessionId).emit("game:timer", {
          white: gameState.board.whiteTime,
          black: gameState.board.blackTime,
          // For Crazyhouse withTimer, pass dropTimers if available
          dropTimers: gameState.board.dropTimers || null,
        })
        // --- MODIFICATION END ---

        if (gameState.status === "finished") {
          if (gameState.metadata.source === "tournament") {
            const updatedTournament = await tournamentModel.findOneAndUpdate(
              { "matches.sessionId": sessionId },
              {
                $set: {
                  "matches.$.result": gameState.result,
                  "matches.$.gameState": gameState.board,
                },
              },
              { new: true },
            )
            if (updatedTournament) {
              console.log(`Tournament match updated for session ${sessionId} with result ${gameState.result}`)
              const winnerId = gameState.result === "white" ? updatedTournament.player1 : updatedTournament.player2
              const updatedUserPoints = await UserModel.findByIdAndUpdate(
                { winnerId },
                {
                  // will continue to update points based on your logic
                },
              )
            }
          } else if (gameState.metadata.source === "matchmaking") {
            let incPoint = 0
            if (variant === "classic") {
              incPoint = 1
            } else if (variant === "crazyhouse") {
              incPoint = 2
            } else if (variant === "sixpointer") {
              incPoint = 3
            } else if (variant === "decay") {
              incPoint = 3
            }
            const winnerId =
              gameState.winnerColor === "white" ? gameState.players.white.userId : gameState.players.black.userId
            const looserId =
              gameState.winnerColor === "white" ? gameState.players.black.userId : gameState.players.white.userId
            const updateWinner = await UserModel.findByIdAndUpdate(
              winnerId,
              {
                $inc: {
                  ratings: incPoint,
                  win: 1,
                },
              },
              { new: true },
            )

            if (!updateWinner) {
              console.error(`Failed to update user points for winner ${winnerId}`)
              gameNamespace.to(sessionId).emit("game:error", { message: "Failed to update user points." })
            }

            const updateLooser = await UserModel.findByIdAndUpdate(
              looserId,
              {
                $inc: { lose: 1 },
              },
              { new: true },
            )

            if (!updateLooser) {
              console.error(`Failed to update user points for looser ${looserId}`)
              gameNamespace.to(sessionId).emit("game:error", { message: "Failed to update user points." })
            }
            console.log(`User ${winnerId} points updated by ${incPoint} points.`)
          }

          gameNamespace.to(sessionId).emit("game:end", { gameState })
        }
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })

    // Client-reported timeout: ask server to apply authoritative penalty (sixpointer)
    socket.on("game:timeoutPenalty", async ({ timestamp }) => {
      try {
        console.log(`[TIMEOUT PENALTY] Request from user ${userId} in session ${sessionId} at ${timestamp}`)

        const result = await applyTimeoutPenalty({ sessionId, userId, timestamp, variant, subvariant })
        if (result && result.validationResult) {
          // Emit a game warning similar to previous behavior
          gameNamespace.to(sessionId).emit("game:warning", {
            message: result.validationResult.reason,
            timeoutPenalty: result.validationResult.timeoutPenalty,
            move: result.move,
            gameState: result.gameState,
            validationResult: result.validationResult,
          })

          // Emit a game:move-style update so clients update UI (move may be synthetic timeout move)
          gameNamespace.to(sessionId).emit("game:move", { move: result.move, gameState: result.gameState })

          // Also emit timers
          gameNamespace.to(sessionId).emit("game:timer", {
            white: result.gameState.board.whiteTime,
            black: result.gameState.board.blackTime,
            activeColor: result.gameState.board.activeColor,
          })

          // Also emit entire gameState so clients refresh all derived fields
          gameNamespace.to(sessionId).emit("game:gameState", { gameState: result.gameState })

          console.log(
            `[TIMEOUT PENALTY] Successfully applied penalty for ${result.validationResult.timeoutPenalty?.newActiveColor}`,
          )
        } else if (result && result.type === "game:error") {
          socket.emit("game:error", { message: result.message })
          console.log(`[TIMEOUT PENALTY] Error: ${result.message}`)
        }
      } catch (err) {
        console.error("Error applying timeout penalty:", err)
        socket.emit("game:error", { message: err.message || "Failed to apply timeout penalty" })
      }
    })

    // Get possible moves
    socket.on("game:getPossibleMoves", async ({ square }) => {
      try {
        const moves = await getPossibleMoves({ sessionId, square, variant, subvariant })
        gameNamespace.to(sessionId).emit("game:possibleMoves", { square, moves })
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })

    // Resign
    socket.on("game:resign", async () => {
      try {
        const { gameState } = await resign({ sessionId, userId, variant, subvariant })
        gameNamespace.to(sessionId).emit("game:end", { gameState })
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })

    // Offer draw
    socket.on("game:offerDraw", async () => {
      try {
        const { gameState } = await offerDraw({ sessionId, userId, variant, subvariant })
        gameNamespace.to(sessionId).emit("game:gameState", { gameState })
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })

    // Accept draw
    socket.on("game:acceptDraw", async () => {
      try {
        const { gameState } = await acceptDraw({ sessionId, userId, variant, subvariant })
        gameNamespace.to(sessionId).emit("game:end", { gameState })
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })

    // Decline draw
    socket.on("game:declineDraw", async () => {
      try {
        const { gameState } = await declineDraw({ sessionId, userId, variant, subvariant })
        gameNamespace.to(sessionId).emit("game:gameState", { gameState })
      } catch (err) {
        gameNamespace.to(sessionId).emit("game:error", { message: err.message })
      }
    })
  })
};

export default websocketRoutes;
