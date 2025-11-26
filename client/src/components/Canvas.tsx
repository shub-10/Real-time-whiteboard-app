import { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import Toolbar from "./Toolbar";
import { MdFormatColorFill } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";
import toast from 'react-hot-toast';
interface CanvasProps {
  boardId: string;
}
const presetColors = [
  "#000000", "#ffffff", "#e60000",
  "#e65c00", "#ff9900", "#009933", "#0066cc",
  "#3399ff", "#7a00cc",
];

const Canvas: React.FC<CanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [canvasColor, setCanvasColor] = useState("white");
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
    socket.on("text", (data) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.font = "20px sans-serif";
      ctx.fillStyle = data.color;
      ctx.fillText(data.text, data.x, data.y);
    });

    socket.on("draw", ({ x1, y1, x2, y2, color, thickness }) => {
      drawLine(x1, y1, x2, y2, color, thickness);
    });
    socket.on("clear", ()=>clearCanvas())
    return () => {
      socket.off("draw", ({ x1, y1, x2, y2, color, thickness }) => {
        drawLine(x1, y1, x2, y2, color, thickness);
      });
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (!ctx) return;
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, [canvasColor])

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
    let strokeColor = tool === "eraser" ? canvasColor : color;
    let strokeWidth = tool === "eraser" ? 50 : 3;
    if (tool === "highlighter") {
      strokeColor = color + "40";
      strokeWidth = 20;
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    const { x: x1, y: y1 } = lastPos.current;
    const x2 = e.clientX;
    const y2 = e.clientY;

    drawLine(x1, y1, x2, y2, strokeColor, strokeWidth);


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
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
  };


  useEffect(() => {
    if (ctxRef.current) ctxRef.current.strokeStyle = color;
  }, [color]);
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "text") return;

    setIsTyping(true);
    setTextValue("");
    setTextPos({ x: e.clientX, y: e.clientY });
  };
  const finishTyping = () => {
    if (!isTyping || !ctxRef.current || !textPos) return;

    const ctx = ctxRef.current;
    ctx.font = "20px sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(textValue, textPos.x, textPos.y);

    // Emit to server
    socket.emit("text", {
      boardId,
      x: textPos.x,
      y: textPos.y,
      text: textValue,
      color,
    });

    setIsTyping(false);
    setTextValue("");
    setTool("brush");
  };
 const handleCopyLink = () => {
    const fullLink = window.location.href;
    console.log("full Link: ", fullLink);
    navigator.clipboard.writeText(fullLink);
    toast.success("Board link copied!");
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear", {boardId})
  };

  return (
    <div>
      {/* <div className="fixed top-5 left-1/2 -translate-x-1/2 z-20 flex flex-row items-center gap-3"> */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white shadow-md rounded-xl px-4 py-2 border border-gray-200 z-30">
        {presetColors.map((c) => (
          <div
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full cursor-pointer border flex items-center justify-center${color === c ? "ring-2 ring-blue-400" : ""}`}
            style={{
              background: c,
              border: color === c ? "3px solid grey" : "2px solid #555",
              boxShadow: color === c ? "0 0 8px #87cefa" : "none",
            }}
          />
        ))}
      </div>

      {/* </div> */}

     
        <Toolbar tool={tool} setTool={setTool}></Toolbar>
        <div className="flex flex-row fixed top-4 right-4 gap-2">
          <button
            onClick={clearCanvas}
            className=" bg-white border border-gray-300  px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
            Clearboard
          </button>
          <button
            onClick={handleCopyLink}
            className=" bg-white border border-gray-300  px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
            <MdContentCopy />
            Copy link
          </button>
        </div>
      
      {isTyping && textPos && (
        <textarea
          autoFocus
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={() => finishTyping()}
          onKeyDown={(e) => {
            if (e.key === "Enter") finishTyping();
          }}
          className="absolutep-[6px]rounded-[4px]outline outline-[2px] outline-[#4aa3ff] bg-white
        text-[20px] z-[2000]"
          style={{
            top: textPos.y,
            left: textPos.x,
            color: color
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        style={{ background: "white" }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default Canvas;
