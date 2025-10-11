import { io } from "socket.io-client";
import { WS_BASE_URL } from "../app/lib/constants";

let socketInstance = null;

export const getSocket = (
  userId,
  connectionType,
  sessionId,
  variant,
  subvariant,
  source
) => {
  console.log("getSocket called with parameters:",  userId, connectionType, sessionId, variant, subvariant);
  if (!socketInstance || !socketInstance.connected) {
    console.log(userId, connectionType, sessionId);

    let namespace = "";
    switch (connectionType) {
      case "matchmaking":
        namespace = "/matchmaking";
        break;
      case "game":
        namespace = "/game";
        break;
      default:
        console.error(`Invalid connection type: ${connectionType}`);
        return null;
    }


    const socketUrl = `${WS_BASE_URL}${namespace}`;
    const socketOptions = {
      path: "/socket.io",
      auth: { userId, sessionId, variant, subvariant, source },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    console.log(`Connecting to socket with URL: ${socketUrl}`);
    socketInstance = io(socketUrl, socketOptions);

    socketInstance.on("connect", () => {
      console.log(
        "Socket.IO connection established with ID:",
        socketInstance.id
      );
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket.IO connection closed. Reason:", reason);
    });
  }

  return socketInstance;
};

export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("Socket.IO connection closed manually.");
  }
};

export const getSocketInstance = () => socketInstance;
