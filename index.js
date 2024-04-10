import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import ACTIONS from "./actions.js";

const port = 3000;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const socketUserList = {};

function getAllConnectedUsers(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        userName: socketUserList[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on(ACTIONS.JOIN, ({roomId, userName})=>{
    socketUserList[socket.id] = userName;
    socket.join(roomId);
    const users = getAllConnectedUsers(roomId);
    users.forEach(({socketId}) =>{
        io.to(socketId).emit(ACTIONS.JOINED, {
            users,
            userName, 
            socketId
        })
    })
  })


  socket.on(ACTIONS.CODE_CHANGE, ({roomId, code})=>{
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
  })
  

  socket.on('mouse_activity', (data)=>{
    console.log('iamjsfbskhvb');
    console.log(data);
  })

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      io.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        userName: socketUserList[socket.id]
      });
    });
    delete socketUserList[socket.id];
    socket.leave();
  });
  

});

app.get("/", (req, res) => {
  res.send("Hello World");
});

httpServer.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
