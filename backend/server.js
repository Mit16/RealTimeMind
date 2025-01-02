import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.error("Invalid projectId");
      return next(new Error("Invalid projectId"));
    }

    socket.project = await projectModel.findById(projectId);

    if (!token) {
      console.error("Missing token");
      return next(new Error("Authentication Error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      console.error("Invalid token");
      return next(new Error("Authentication Error"));
    }

    socket.user = decoded;
    console.log("Socket authentication successful:", decoded);
    next();
  } catch (error) {
    console.error("Socket middleware error:", error);
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log("User connected to room:", socket.roomId);

  socket.join(socket.roomId);

  socket.on("project-message", async (data) => {
    const message = data.message;
    const aiIsPresentInMessage = message.includes("@ai");
    
    if (aiIsPresentInMessage) {
      const prompt = message.replace("@ai", "").trim();
      console.log("Processing AI message:", prompt);
      
      // Broadcast normal messages directly
      io.to(socket.roomId).emit("project-message", data);
      
      // Notify only the sender about AI processing
      socket.emit("ai-processing", { message: "Processing AI response..." });

      // Process the AI response
      const result = await generateResult(prompt);

      // Broadcast AI-generated message to the room
      io.to(socket.roomId).emit("project-message", {
        message: result,
        sender: { _id: "ai", email: "AI" },
      });
    } else {
      // Broadcast normal messages directly
      io.to(socket.roomId).emit("project-message", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
    socket.leave(socket.roomId);
  });
});

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
