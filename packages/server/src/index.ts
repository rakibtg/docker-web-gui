import { createServer } from "http";
import { initializeDatabase } from "./db/connection";
import { handleHttpRequest } from "./routes/httpRouter";
import { initializeWebSocketServer } from "./websocket/wsServer";
import { isAuthRequired } from "./auth";
import { getSettings } from "./settings";

const server = createServer(handleHttpRequest);

async function startServer() {
  try {
    await initializeDatabase();
    const users = getSettings("users");
    if (isAuthRequired() && (!users || users.length === 0)) {
      throw new Error(
        "Authentication is enabled but no users are configured. Please set users in .settings.json."
      );
    }

    const bindHost = process.env.BIND_HOST || "127.0.0.1";
    server.listen(8080, bindHost, () => {
      console.log(`HTTP server running on ${bindHost}:8080`);
      console.log(`WebSocket server running on ${bindHost}:8080`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
initializeWebSocketServer(server);
