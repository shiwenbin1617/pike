import React, { useState, useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import Toolbar from "../components/Toolbar";

const MyComponent = () => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0).cloneRange();
    const rects = range.getClientRects();
    if (selection.toString().trim() !== "") {
      setSelectedText(selection.toString());
      setRect(rects[0]);
      setIsOpen(true);
    }
  };

  // 初始化 Selection 监听器
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("mouseup", handleSelectionChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("mouseup", handleSelectionChange);
      }
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setRect(null);
  };

  return (
    <ChakraProvider>
      <div>
        <p>选择一些文本来显示工具栏。</p>
        {isOpen && rect && (
          <Toolbar selectedText={selectedText} rect={rect} onClose={handleClose} />
        )}
      </div>
    </ChakraProvider>
  )
};

export default MyComponent;