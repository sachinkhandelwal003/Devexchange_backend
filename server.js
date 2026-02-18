import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import WebSocket, { WebSocketServer } from "ws";

import routes from "./Routes/index.js";
import createAdminAccount from "./utils/adminSetup.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ENTITY_TOKEN = process.env.ENTITYSPORT_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({}));
app.use(morgan("dev"));
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Welcome to the DevExchange API!");
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydb")
  .then(() => {
    console.log("✅ Connected to MongoDB");

    createAdminAccount();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    /* ==============================
       🔥 FRONTEND WEBSOCKET SERVER
    =============================== */
    const wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    wss.on("connection", (ws) => {
      console.log("🟢 Frontend Connected");

      ws.on("close", () => {
        console.log("🔴 Frontend Disconnected");
      });
    });

    /* ==============================
       🔥 ENTITYSPORT CONNECTION
    =============================== */

    let entitySocket;
    let messageBuffer = [];

    function connectEntitySocket() {
      console.log("🔄 Connecting to EntitySport...");

      entitySocket = new WebSocket(
        `ws://webhook.entitysport.com:8087/connect?token=${ENTITY_TOKEN}`
      );

      entitySocket.on("open", () => {
        console.log("✅ Connected to EntitySport");
      });

      entitySocket.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());

          // 🚫 Ignore non-data packets
          if (!parsed.api_type) return;

          // 🎯 Only allow important message types
          if (
            parsed.api_type === "match_push_obj" ||
            parsed.api_type === "odds_update"
          ) {
            messageBuffer.push(parsed);
          }

        } catch (err) {
          console.log("Parse Error:", err.message);
        }
      });

      entitySocket.on("close", () => {
        console.log("❌ EntitySport Disconnected. Reconnecting in 5 seconds...");
        setTimeout(connectEntitySocket, 5000); // Auto reconnect
      });

      entitySocket.on("error", (err) => {
        console.log("🔥 EntitySport Error:", err.message);
      });
    }

    // Start first connection
    connectEntitySocket();

    /* ==============================
       🔥 SEND TO FRONTEND EVERY 1 SEC
    =============================== */

    setInterval(() => {
      if (messageBuffer.length === 0) return;

      const batch = [...messageBuffer];
      messageBuffer = [];

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(batch));
        }
      });

      console.log("📤 Sent batch to frontend:", batch.length);

    }, 200);
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });
