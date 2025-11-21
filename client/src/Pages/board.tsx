import Canvas from "../components/Canvas";
import { useEffect } from "react";
import { socket } from "../socket";

function Board() {
  const boardId = "board123";

  useEffect(() => {
    socket.emit("join-board", boardId);
  }, []);

  return (
    <div>
      <Canvas boardId={boardId} />
    </div>
  );
}

export default Board;
