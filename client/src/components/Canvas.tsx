import { useRef, useEffect, useState } from "react";
import { socket } from "../socket";

interface CanvasProps {
  boardId: string;
}

const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  // Track last mouse positions
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Setup canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";

    ctxRef.current = ctx;

    // Listen for draw events from other clients
    const handler = (data: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }) => {
      drawLine(data.x1, data.y1, data.x2, data.y2);
    };

    socket.on("draw", handler);

    return () => {
      socket.off("draw", handler);
    };
  }, []);

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  // Draw event
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPos.current) return;

    const { x: x1, y: y1 } = lastPos.current;
    const x2 = e.clientX;
    const y2 = e.clientY;

    drawLine(x1, y1, x2, y2);

    // Emit to server
    socket.emit("draw", {
      boardId,
      x1,
      y1,
      x2,
      y2,
    });

    lastPos.current = { x: x2, y: y2 };
  };

  // Draw a line on canvas
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  };

  return (
    
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onMouseMove={draw}
      style={{ background: "white" }}
    />
  );
};

export default Canvas;
