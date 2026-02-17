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

    // 🔥 FRONTEND WEBSOCKET SERVER
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
      console.log("🟢 Frontend Connected");

      ws.on("close", () => {
        console.log("🔴 Frontend Disconnected");
      });
    });

    // 🔥 ENTITYSPORT WEBSOCKET CONNECTION
    const entitySocket = new WebSocket(
      `ws://webhook.entitysport.com:8087/connect?token=${ENTITY_TOKEN}`
    );

    entitySocket.on("open", () => {
      console.log("✅ Connected to EntitySport");
    });

    entitySocket.on("message", (data) => {
      const message = data.toString();
      console.log("📩 Entity Data:", message);

      // Broadcast to all frontend clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });

    entitySocket.on("close", () => {
      console.log("❌ EntitySport Connection Closed");
    });

    entitySocket.on("error", (err) => {
      console.log("🔥 EntitySport Error:", err.message);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });
