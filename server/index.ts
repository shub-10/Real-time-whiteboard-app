import express, {Request, Response} from 'express';
import cors from 'cors';
import http from 'http';
import {Server} from 'socket.io';
import {createServer} from "http";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors:{
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
app.use(express.json());
app.use(cors());
const port = process.env.port || 3000;


io.on('connection', (socket)=>{
  console.log(`new user connected with id ${socket.id}`);

  socket.on("join-board", (boardId)=>{
    socket.join(boardId);
    // console.log(boardId)
    console.log(`user ${socket.id} joined board: ${boardId}`)
  });
  socket.on("draw", (data) => {
    socket.to(data.boardId).emit("draw", data);
  });

  socket.on("disconnect", ()=>{
    console.log("user disconnected: ", socket.id);
  });
})
app.get('/', (req: Request, res:Response)=>{
  res.json("server is running");
})
server.listen(port, ()=>{
  console.log(`server running at 🚀: ${port}`)
})