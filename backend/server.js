const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

dotenv.config();

const userRouter = require("./routes/userRoutes");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");
const socketIo = require("./socket");

const app = express();

// ================== HTTP SERVER ==================

const server = http.createServer(app);

// ================== MIDDLEWARES ==================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mern-chat-omega-six.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ================== SOCKET.IO ==================

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mern-chat-omega-six.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket.IO
socketIo(io);

// ================== DATABASE ==================

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

if (!mongoUri) {
  console.error("Missing MONGO_URI/MONGO_URL in .env file.");
}

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    tls: true,
  })
  .then(() => console.log("Connected to DB"))
  .catch((err) => {
    console.error("Database connection error:", err.message);
    console.error(
      "Fix: add your current public IP to MongoDB Atlas Network Access, verify the username/password, and confirm the MongoDB connection string is correct."
    );
  });

// ================== ROUTES ==================

app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);

// ================== START SERVER ==================

const PORT = process.env.PORT || 5000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or change the PORT in your .env file.`
    );
    process.exit(1);
  }

  console.error("Server startup error:", error.message);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});