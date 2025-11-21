import { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import Toolbar from "./Toolbar";
interface CanvasProps {
  boardId: string;
}
const presetColors = [
  "#000000", "#4d4d4d", "#999999", "#e60000", "#ff1a1a",
  "#e65c00", "#ff9900", "#33cc33", "#009933", "#0066cc",
  "#3399ff", "#7a00cc", "#b366ff", "#ffffff", "#cccccc"
];

const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [color, setColor] = useState<string>("black");
  const [tool, setTool] = useState("brush");

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

    socket.on("draw", ({ x1, y1, x2, y2, color, thickness }) => {
      drawLine(x1, y1, x2, y2, color, thickness);
    });
    return () => {
      socket.off("draw", ({ x1, y1, x2, y2, color, thickness }) => {
        drawLine(x1, y1, x2, y2, color, thickness);
      });
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


  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPos.current) return;

    const ctx = ctxRef.current;

    // Apply tool settings
    let strokeColor = tool === "eraser" ? "white" : color;
    let strokeWidth = tool === "eraser" ? 50 : 3;
    if(tool === "highlighter"){
      strokeColor = color+"40";
      strokeWidth = 20;
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    const { x: x1, y: y1 } = lastPos.current;
    const x2 = e.clientX;
    const y2 = e.clientY;

    drawLine(x1, y1, x2, y2, strokeColor, strokeWidth);

    // Emit to server
    socket.emit("draw", {
      boardId,
      x1,
      y1,
      x2,
      y2,
      color: strokeColor,
      thickness: strokeWidth
    });

    lastPos.current = { x: x2, y: y2 };
  };


  // Draw a line on canvas. `col` may be provided for remote draws.

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    col?: string,
    thickness?: number
  ) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (col) ctx.strokeStyle = col;
    if (thickness) ctx.lineWidth = thickness;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();

    // Restore local brush color and thickness after remote draw
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
  };


  // Keep canvas context strokeStyle in sync with local `color` state
  useEffect(() => {
    if (ctxRef.current) ctxRef.current.strokeStyle = color;
  }, [color]);

  return (
    <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flexWrap: "wrap",
            padding: "7px",
            background: "#605e5eff",
            borderRadius: "10px",
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 20
          }}
        >
          {presetColors.map((c) => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: c,
                border: color === c ? "3px solid #87cefa" : "2px solid #555",
                boxShadow: color === c ? "0 0 8px #87cefa" : "none",
                cursor: "pointer"
              }}
            />
          ))}

          {/* Add your own color button */}
          <label
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, red, yellow, green, cyan, blue, magenta)",
              cursor: "pointer",
              border: "2px solid #fff"
            }}
          >
            <input
              type="color"
              onChange={(e) => setColor(e.target.value)}
              style={{ display: "none" }}
            />
          </label>
        </div>
       <div> <Toolbar tool={tool} setTool={setTool}></Toolbar></div>
    
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        style={{ background: "white" }}
      />
    </div>
  );
};

export default Canvas;
