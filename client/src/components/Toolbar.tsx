import { PiPencilBold, PiEraserBold, PiHighlighterBold, PiTextTBold, PiEyedropperBold } from "react-icons/pi";

interface ToolbarProps {
  tool: string;
  setTool: (t: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ tool, setTool }) => {
  const tools = [
    { id: "brush", icon: <PiPencilBold size={24} />, label: "Brush" },
    { id: "eraser", icon: <PiEraserBold size={24} />, label: "Eraser" },
    { id: "highlighter", icon: <PiHighlighterBold size={24} />, label: "Highlighter" },
    { id: "text", icon: <PiTextTBold size={24} />, label: "Text" },
    { id: "eyedropper", icon: <PiEyedropperBold size={24} />, label: "Pick" }
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        top: 100,
        background: "#1e1e1e",
        padding: "10px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 10000,
      }}
    >
      {tools.map((t) => (
        <div
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: tool === t.id ? "#333" : "#1e1e1e",
            border: tool === t.id ? "2px solid #76b7ff" : "2px solid transparent",
            cursor: "pointer",
            color: "white",
            transition: "0.1s",
          }}
        >
          {t.icon}
        </div>
      ))}
    </div>
  );
};

export default Toolbar;
