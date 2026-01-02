import { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import Toolbar from "./Toolbar";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PiSlideshowLight } from "react-icons/pi";
import { IoIosMenu } from "react-icons/io";
import { CiExport } from "react-icons/ci";
import { IoSunnyOutline } from "react-icons/io5";
import { IoMoonOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";

import toast from 'react-hot-toast';
import axios from 'axios';
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
  const [color, setColor] = useState<string>("black");
  const [tool, setTool] = useState("brush");
  const [slideno, setSlideNo] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fold, setFold] = useState(true);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<string>("light");
  const [url, setUrl] = useState("");
  const [otherPanel, setOtherPanel] = useState(true);
  const [inviteBlock, setInviteBlock] = useState(false);
  const [toEmail, setToEmail] = useState<string>("");

  const location = useLocation();
  const navigate = useNavigate();

  const slideImageUrl = location.state?.imageurl;
  useEffect(() => {
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      ctx.fillStyle = "#222222";
    } else {
      document.documentElement.classList.remove("dark");
      ctx.fillStyle = "#ffffff"
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [theme]);

  useEffect(() => { setOtherPanel(true) }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // console.log("this is canvas->",canvas);
   

    // console.log("this is canvas2 ->",canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
     const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    ctx.scale(dpr, dpr);
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
    socket.on("change-theme", ({ theme }) => {
      // console.log(`theme: ${theme}`)
      setTheme(theme);
    });
    // socket.on("clear", () => clearCanvas())
    return () => {
      socket.off("draw", ({ x1, y1, x2, y2, color, thickness }) => {
        drawLine(x1, y1, x2, y2, color, thickness);
      });
    };
  }, []);

  useEffect(() => { setUrl(window.location.href) 

  }, [url])
  useEffect(() => {
    if (!slideImageUrl) return; 
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = slideImageUrl;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    img.onload = () => {
       ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [slideImageUrl]);


  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
  };


  function getCanvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
   
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    };
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    lastPos.current = null;
  };


  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPos.current) return;

    const ctx = ctxRef.current;

    let strokeColor = color;
    if (tool === "eraser") {
      if (theme === "dark") strokeColor = "#222222";
      else strokeColor = "white";
    }
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
      boardId, x1, y1, x2, y2,
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
  const handleCanvasClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setFold(true);
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
    socket.emit("clear", { boardId });
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!),
        "image/jpeg", 0.7)
    });
  }
  const handleNewSlide = async () => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataURL = await canvasToBlob(canvas);
    const formData = new FormData();

    formData.append("file", dataURL, "slide.jpg");
    formData.append("slideno", String(slideno));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    if (isUploading) return;
    setUploading(true);
    try {

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/slides/${boardId}`, formData);
      console.log(res.data);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setUploading(false);
    }
    clearCanvas();
    setSlideNo(prev => prev + 1);
  }
  const showAllSlides = () => {
    navigate(`/board/${boardId}/slides`);
  }

  const sendInvite = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/boardId/send-invite`, {
        toEmail, url
      });
      toast.success("Invitation sent");
    } catch (error) {
      toast.error("Failed to send invite");
    }

    setInviteBlock(false);
    toast.success("Invitation sent");

  }

  return (
    <div className="fixed w-full h-screen bg-white dark:bg-[#222222]">
      {
        inviteBlock && (<div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Add people</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setInviteBlock(false)}>
                ✕
              </button>
            </div>

            <div className="flex justify-center border-b">
              <div className="flex items-center gap-2 px-4 py-3 text-blue-600 border-b-2 border-blue-600 font-medium">
                <span>👤+</span>
                <span>Invite</span>
              </div>
            </div>
            <div className="px-6 py-4">
              <input
                type="email"
                placeholder="You can enter multiple emails using ; at back"
                className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 py-2" onChange={(e) => { e.preventDefault(); setToEmail(e.target.value) }}
              />
            </div>
            {
              toEmail?.length > 0 && (
                <div className="flex justify-end px-6 py-4">
                  <button className="px-4 py-2 text-white bg-blue-600 rounded-xl " onClick={sendInvite}>Send</button>
                </div>

              )
            }
          </div>
        </div>)
      }
      <div className="absolute top-6 left-4 cursor-pointer rounded-md p-2 bg-slate-200 border border-gray-400 " onClick={() => setFold(!fold)} ><IoIosMenu size={20} /></div>

      <div className="md:w-2/3 flex flex-col justify-evenly md:justify-between items-center mx-auto mt-2 mb-1 bg-white p-2 rounded-lg shadow-md  dark:bg-gray-300" >
        <div className="flex flex-col items-center md:flex-row gap-2">
          <div className="flex items-center gap-3 bg-white shadow-md rounded-lg px-2 py-1 md:px-4 md:py-2 border border-gray-400 z-30 dark:bg-gray-300">
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
          <Toolbar tool={tool} setTool={setTool}></Toolbar>
        </div>
        <div className="flex flex-row  gap-2 mt-1">
          <button
            onClick={handleNewSlide}
            className=" bg-white border border-gray-400 px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2 dark:bg-gray-300">
            New Slide +
          </button>
          <Link to='/'>
            <button
              className=" bg-red-600 text-white border-none  px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2">
              Leave
            </button>
          </Link>
        </div>
      </div>
      <div className="relative w-full h-[calc(100vh-60px)]">
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

        {
          !fold && (
            <div className="absolute w-2/3 md:w-1/6 h-1/3 md:h-1/2 top-2 left-2 flex flex-col items-center gap-2 px-2 py-2  border  border-gray-200 shadow-md rounded-xl bg-white dark:bg-[#0f244a1a] dark:text-white dark:border-none " >
              <button className="w-full flex  items-center gap-3 px-1 py-1 text-md rounded-md dark:hover:bg-gray-600" onClick={showAllSlides}><span ><PiSlideshowLight size={20} /></span>Previous Slides</button>
              <button className="w-full flex items-center gap-3 px-1 py-1 text-md rounded-md dark:hover:bg-gray-600" onClick={exportAsImage}><span ><CiExport size={20} /></span>Export</button>

              <div className="mt-auto w-full px-1">
                <hr className="mb-2" />
                <div className="flex flex-wrap justify-between">
                  <span className="text-md">Theme</span>
                  <div className="flex flex-row gap-2 cursor-pointer">
                    <div className="light p-1 border border-gray-200 rounded-md bg-gray-400 dark:bg-[#222222]" onClick={() => { setTheme("light"); socket.emit("change-theme", { theme: "light", boardId }); }}>
                      <IoSunnyOutline size={22} />
                    </div>
                    <div className="dark p-1 border border-gray-200 rounded-md dark:bg-gray-400" onClick={() => { setTheme("dark"); socket.emit("change-theme", { theme: "dark", boardId }); }}>
                      <IoMoonOutline size={22} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {otherPanel && (
          <div
            className="fixed md:absolute inset-x-0 bottom-0 md:inset-auto md:right-4 md:top-1/2 md:-translate-y-1/2 w-full md:w-[360px] lg:w-[400px] max-h-[80vh] bg-white border border-gray rounded-t-xl md:rounded-xl shadow-xl  p-4 md:p-5  flex flex-col gap-3  z-50">
            <div className="flex justify-between items-center">
              <p className="text-base md:text-lg font-semibold text-gray-900">
                Your meeting's ready
              </p>
              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => setOtherPanel(false)}
              >
                <RxCross2 size={20} />
              </button>
            </div>

            <button className=" flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-full text-white text-sm md:text-base font-medium "
              onClick={() => setInviteBlock(true)}>
              <MdOutlinePersonAddAlt1 size={20} />
              Add others
            </button>

            <p className="text-sm text-gray-700">
              Or share the below link with others that you want in the meeting
            </p>

            <div className="w-full flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 cursor-pointer break-all text-sm"
              onClick={handleCopyLink} >
              {url}
            </div>
          </div>
        )}


        <canvas
          ref={canvasRef}
          className="w-full h-[calc(100vh-60px)] block bg-white dark:bg-[#222222] touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onClick={handleCanvasClick}
        />
      </div>

    </div>
  );
};

export default Canvas;
