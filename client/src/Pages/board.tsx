import {useEffect} from "react";
import {socket} from "../socket"
export const Board = () => {
  useEffect(()=>{
      socket.on("connect", ()=>{
        console.log("connected: ",socket.id);
        socket.emit("join-board", "b123");
      });

      socket.on("draw", (data)=>{
        console.log("new data: ", data);
      });

      return ()=>{
        socket.off("connect");
        socket.off("draw");
      }
  }, [])
  const sendEvent = ()=>{
    socket.emit("draw", {
      boardId:"b123",
      x: Math.random()*500,
      y: Math.random()*500
    })
  }
  return (
    <div>
      <div>Board Page</div>
      <button onClick={sendEvent}>Send draw Event</button>
    </div>
  )
}
