import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { createServer } from "http";
import { appendInDb } from './routes/storingRoute.ts';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db.ts';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const allowed_origin = process.env.FRONTEND_URL
app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({limit:"10mb", extended:true}))
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
const port = process.env.PORT || 3000;

connectDB();
// console.log(process.env.MONGODB_URL);
io.on('connection', (socket) => {
  console.log(`new user connected with id ${socket.id}`);

  socket.on("join-board", (boardId) => {
    socket.join(boardId);
    // console.log(boardId)
    console.log(`user ${socket.id} joined board: ${boardId}`)
  });
  socket.on("leave-board", (boardId: string) => {
    socket.leave(boardId);
    console.log(`socket ${socket.id} left board ${boardId}`);
  });
  socket.on("text", (data) => {
    socket.to(data.boardId).emit("text", data);
  });

  socket.on("draw", (data) => {
    socket.to(data.boardId).emit("draw", data);
  });
  socket.on("clear", ({boardId})=>{
    socket.to(boardId).emit("clear");
  })
  socket.on("disconnect", () => {
    console.log("user disconnected: ", socket.id);
  });
})
app.get('/', (req: Request, res: Response) => {
  res.json("server is running");
})
app.use('/api', appendInDb());

server.listen(port, () => {
  console.log(`server running at 🚀: ${port}`)
})