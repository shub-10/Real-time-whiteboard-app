import Canvas from "../components/Canvas";
import { useEffect } from "react";
import { socket } from "../socket";
import {useParams} from 'react-router-dom';
function Board() {
  const { boardId } = useParams<{ boardId: string }>();

  useEffect(() => {
    if (!boardId) return;
    socket.emit("join-board", boardId);
  }, [boardId]);

  if (!boardId) {
    return <div>Invalid board. No boardId in URL.</div>;
  }

  return (
    <div>
      <Canvas boardId={boardId} />
    </div>
  );
}

export default Board;
