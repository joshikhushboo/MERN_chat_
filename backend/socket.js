const socket = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  // Handle socket connection
  io.on("connection", (socket) => {
    const user = socket.handshake.auth?.user;

    console.log(
      "A user connected:",
      user?.username || "Unknown user"
    );

    // ================= JOIN ROOM =================
    socket.on("joinRoom", (groupId) => {
      if (!groupId || !user?._id) return;

      socket.join(groupId);

      connectedUsers.set(socket.id, {
        user,
        room: groupId,
      });

      // Get all online users in this room
      const usersInRoom = Array.from(connectedUsers.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);

      // Send online users list to everyone in the room
      io.in(groupId).emit("onlineUsers", usersInRoom);

      // Notify other users that someone joined
      socket.to(groupId).emit("userJoined", {
        type: "user joined",
        message: `${user?.username || "A user"} has joined the group`,
        user,
      });

      console.log(
        `${user?.username} joined room ${groupId}`
      );
    });

    // ================= LEAVE ROOM =================
    socket.on("leaveRoom", (groupId) => {
      if (!groupId) return;

      console.log(
        `User ${user?.username} left room ${groupId}`
      );

      socket.leave(groupId);

      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
      }

      // Tell remaining users that this user went offline
      socket.to(groupId).emit("userLeft", user?._id);

      // Send updated online users list
      const usersInRoom = Array.from(connectedUsers.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);

      io.in(groupId).emit("onlineUsers", usersInRoom);
    });

    // ================= NEW MESSAGE =================
    socket.on("new message", (message) => {
      if (!message?.groupId) return;

      console.log(
        `New message in group ${message.groupId} from ${user?.username}`
      );

      socket
        .to(message.groupId)
        .emit("message received", message);
    });

    // ================= DELETE MESSAGE =================
    socket.on("message deleted", ({ messageId, groupId }) => {
      if (!messageId || !groupId) return;

      socket.to(groupId).emit("message deleted", messageId);
    });

    // ================= TYPING =================
    socket.on("typing", ({ groupId, username }) => {
      if (!groupId) return;

      socket.to(groupId).emit("user typing", {
        username,
      });
    });

    // ================= STOP TYPING =================
    socket.on("stop typing", ({ groupId, username }) => {
      if (!groupId) return;

      socket.to(groupId).emit("user stop typing", {
        username,
      });
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log(
        "A user disconnected:",
        user?.username || "Unknown user"
      );

      if (connectedUsers.has(socket.id)) {
        const userInfo = connectedUsers.get(socket.id);

        if (userInfo?.room) {
          const room = userInfo.room;

          // Remove user first
          connectedUsers.delete(socket.id);

          // Notify remaining users
          socket.to(room).emit("userLeft", userInfo.user?._id);

          // Send updated online users
          const usersInRoom = Array.from(connectedUsers.values())
            .filter((u) => u.room === room)
            .map((u) => u.user);

          io.in(room).emit("onlineUsers", usersInRoom);
        } else {
          connectedUsers.delete(socket.id);
        }
      }
    });
  });
};

module.exports = socket;