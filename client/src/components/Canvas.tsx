import { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import Toolbar from "./Toolbar";
import { Link } from 'react-router-dom'
// import { MdFormatColorFill } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";
import toast from 'react-hot-toast';
import axios from 'axios';
interface CanvasProps {
  boardId: string;
}
interface Slides {
  _id: String,
  boardId: String,
  slideNo: String,
  imageUrl: String,
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
  const [slideno, setSlideNo] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevSlides, setPrevSlides] = useState<Slides[]>([])

  const lastPos = useRef<{ x: number; y: number } | null>(null);
  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX,
      y: e.clientY - rect.top,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // console.log("this is canvas->",canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // console.log("this is canvas2 ->",canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // console.log("ctx: ", ctx);
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
    // socket.on("clear", () => clearCanvas())
    return () => {
      socket.off("draw", ({ x1, y1, x2, y2, color, thickness }) => {
        drawLine(x1, y1, x2, y2, color, thickness);
      });
    };
  }, []);

  const fetchPrevSlides = async () => {
    const res = await axios.get(`http://localhost:3000/api/${boardId}/getPrevSlides`)
    console.log("data: ", res.data.slides);
    setPrevSlides(res.data.slides);
    
  }
  useEffect(() => {
    fetchPrevSlides();
    // console.log("prev slides: ", prevSlides);
  }, [slideno])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };


  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPos.current) return;

    const ctx = ctxRef.current;

    let strokeColor = (tool === "eraser") ? canvasColor : color;
    let strokeWidth = (tool === "eraser") ? 50 : 3;
    if (tool === "highlighter") {
      strokeColor = color + "40";
      strokeWidth = 20;
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    const { x: x1, y: y1 } = lastPos.current;
    const pos = getCanvasPos(e);
    const { x: x2, y: y2 } = pos;
    drawLine(x1, y1, x2, y2, strokeColor, strokeWidth);
    lastPos.current = { x: x2, y: y2 };
    socket.emit("draw", {
      boardId,x1,y1,x2,y2,
      color: strokeColor,
      thickness: strokeWidth
    });


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
    // console.log("ctx here:", ctx);

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

  // when user slides cursor on the canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "text") return;
    const pos = getCanvasPos(e);
    setTextPos(pos);
    setIsTyping(true);
  };

  // finish typing 
  const finishTyping = () => {
    if (!isTyping || !ctxRef.current || !textPos) return;

    const ctx = ctxRef.current;
    ctx.font = "20px sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(textValue, textPos.x, textPos.y);

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
  const exportAsImage = () => {
    const canvas = canvasRef.current;
    // console.log(canvas);
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/jpeg", 1.0);
    console.log("dataurl: ", dataURL);

    const link = document.createElement("a");
    link.href = dataURL;

    link.download = `whiteboard-${Date.now()}.jpg`;
    link.click();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear", { boardId })
  };


  const handleNewSlide = async () => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg", 1.0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    try {
      const res = await axios.post(`http://localhost:3000/api/slides/${boardId}`, { dataURL, slideno });
      console.log(res.data);
    } catch (error) {

    }
    clearCanvas();
    setSlideNo(prev => prev + 1);
  }

  return (
    <div className="fixed w-full h-screen">
      <div className="flex md:flex-row flex-col md:w-3/4 w-full justify-between items-center mx-auto bg-white p-2 rounded-lg mt-2  shadow-md mb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 bg-white shadow-md rounded-lg px-2 py-1 md:px-4 md:py-2 border border-gray-200 z-30">
            {presetColors.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 md:w-7 md:h-7 rounded-full cursor-pointer border flex items-center justify-center${color === c ? "ring-2 ring-blue-400" : ""}`}
                style={{
                  background: c,
                  border: color === c ? "3px solid grey" : "2px solid #555",
                  boxShadow: color === c ? "0 0 8px #87cefa" : "none",
                }}
              />
            ))}
          </div>
          <div>
            <Toolbar tool={tool} setTool={setTool}></Toolbar>
          </div>
        </div>
        <div className="flex flex-row gap-2 mt-1">
          <button
            onClick={handleNewSlide}
            className=" bg-white border border-gray-300 px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
            New Slide +
          </button>
          <button
            onClick={handleCopyLink}
            className=" bg-white border border-gray-300 px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
            <MdContentCopy />
            Copy link
          </button>
          <Link to='/'>
            <button
              className=" bg-red-600 text-white border-none  px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
              Leave
            </button>
          </Link>
        </div>
      </div>
      <div className="relative w-full">
        {isTyping && textPos && (
          <textarea
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => finishTyping()}
            onKeyDown={(e) => {
              if (e.key === "Enter") finishTyping();
            }}
            className="absolute p-[6px] rounded-[4px] outline outline-[2px] outline-[#4aa3ff] bg-white
        text-[20px] z-[2000]"
            style={{
              top: textPos.y,
              left: textPos.x,
              color: color
            }}
          />
        )}
        
        {prevSlides?.length > 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-lg shadow-lg bg-white border border-gray-300 p-2 cursor-pointer hover:scale-105 transition">
           
            <img
              src={String(prevSlides[prevSlides.length - 1]?.imageUrl || "")}
              alt="Previous slide"
              className="h-28 w-40 object-cover rounded"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'>No preview</text></svg>";
              }}
            />
             <p className="text-xs text-gray-500 text-center mb-1">Previous slide</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-[calc(100vh-120px)] block"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          style={{ background: "white" }}
          onClick={handleCanvasClick}
        />
      </div>
      {/* <div className="w-3/4 flex justify-start mx-auto bg-white p-2">
        <button className="border border-gray-400 rounded-lg shadow-sm hover:shadow-md px-2 py-1 md:px-4 md:py-2" onClick={exportAsImage}>Export</button>
      </div> */}
    </div>
  );
};

export default Canvas;
