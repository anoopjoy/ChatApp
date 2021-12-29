const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const port = process.env.PORT;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Define paths for Express config
const publicDirPath = path.join(__dirname, "../public");

// Setup static directory to serve
app.use(express.static(publicDirPath));

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, ackCallback) => {
    const { error, user } = addUser(socket.id, username, room);
    if (error) {
      return ackCallback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    ackCallback();
  });

  socket.on("sendMessage", (msg, ackCallback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return ackCallback("Should not send profanity!");
    }

    const user = getUser(socket.id);
    io.to(user.room).emit("message", generateMessage(user.username, msg));
    ackCallback();
  });

  socket.on("sendLocation", (locationData, ackCallback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`
      )
    );
    ackCallback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
