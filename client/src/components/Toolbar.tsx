import { PiPencilBold, PiEraserBold, PiHighlighterBold, PiTextTBold } from "react-icons/pi";

interface ToolbarProps {
  tool: string;
  setTool: (t: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ tool, setTool }) => {
  const tools = [
    { id: "brush", icon: <PiPencilBold size={22} /> },
    { id: "eraser", icon: <PiEraserBold size={22} /> },
    { id: "highlighter", icon: <PiHighlighterBold size={22} /> },
    { id: "text", icon: <PiTextTBold size={22} /> },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 
      bg-white border border-gray-300  rounded-xl shadow-md  px-3 py-2  z-30 ">
      {tools.map((t) => (
        <div
          key={t.id}
          onClick={() => setTool(t.id)}
          className={` w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer
            transition duration-150 select-none text-gray-700
            ${tool === t.id 
              ? "bg-blue-100 border-2 border-blue-500 shadow-md" 
              : "bg-white border border-gray-300 hover:bg-gray-100 shadow-sm"}
          `}
        >
          {t.icon}
        </div>
      ))}
    </div>
  );
};

export default Toolbar;
