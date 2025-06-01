import { useRef, useEffect, useState, useCallback } from "react";
import rough from "roughjs";
import { useElementStore } from "../zustard/useElementStore.js";
import { HamburgerMenu } from "iconsax-reactjs";

import { motion, AnimatePresence } from "framer-motion";

const Body = () => {
  const canvasRef = useRef(null);
  const generator = useRef(rough.generator()).current;

  const {
    elements,
    setElements,
    addElement,
    selectedTool,
    currentElement,
    setCurrentElement,
    dragOffset,
    draggedElement,
    setDraggedElement,
    setDragOffset,
  } = useElementStore();

  // Viewport state for infinite canvas
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Selection and grouping
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Eraser state
  const [eraserPos, setEraserPos] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [elementsToErase, setElementsToErase] = useState(new Set());

  // Text input state
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textElement, setTextElement] = useState(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // Touch state
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX, screenY) => {
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback(
    (worldX, worldY) => {
      return {
        x: worldX * viewport.zoom + viewport.x,
        y: worldY * viewport.zoom + viewport.y,
      };
    },
    [viewport]
  );

  // Create rough freehand path
  const createRoughPath = useCallback(
    (points) => {
      if (points.length < 2) return null;

      const segments = [];
      for (let i = 1; i < points.length; i++) {
        segments.push(
          generator.line(
            points[i - 1].x,
            points[i - 1].y,
            points[i].x,
            points[i].y,
            {
              stroke: "red",
              strokeWidth: 2,
              roughness: 1,
            }
          )
        );
      }
      return segments;
    },
    [generator]
  );

  const createRoughShape = (element) => {
    const { name, x, y, width, height, x1, y1, x2, y2, text, points } = element;

    switch (name) {
      case "Text":
        return { type: "text", text, x, y };

      case "Rectangle":
        return generator.rectangle(x, y, width, height);

      case "Circle": {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2;
        return generator.circle(cx, cy, r * 2);
      }

      case "Diamond":
        return generator.polygon([
          [x + width / 2, y],
          [x + width, y + height / 2],
          [x + width / 2, y + height],
          [x, y + height / 2],
        ]);

      case "Arrow": {
        if (!x1 || !y1 || !x2 || !y2) return null;

        const headLength = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const shaftLength = Math.hypot(x2 - x1, y2 - y1) - headLength;

        const shaftX2 = x1 + Math.cos(angle) * shaftLength;
        const shaftY2 = y1 + Math.sin(angle) * shaftLength;

        const shaft = generator.line(x1, y1, shaftX2, shaftY2);

        const head = generator.polygon([
          [x2, y2],
          [
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6),
          ],
          [
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6),
          ],
        ]);

        return [shaft, head];
      }

      case "Dash": {
        if (!x1 || !y1 || !x2 || !y2) return null;
        return generator.line(x1, y1, x2, y2);
      }

      case "Draw": {
        if (!points || points.length < 2) return null;
        return createRoughPath(points);
      }

      default:
        return null;
    }
  };

  const drawTextElement = (ctx, element) => {
    if (!element.text) return;

    ctx.save();
    ctx.font = `${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;
    ctx.fillStyle = element.color || "black";
    ctx.textBaseline = "top";

    const lines = element.text.split("\n");
    const lineHeight = (element.fontSize || 16) * 1.2;

    lines.forEach((line, index) => {
      ctx.fillText(line, element.x, element.y + index * lineHeight);
    });

    ctx.restore();
  };

  const getTextBounds = (element) => {
    if (!element.text)
      return { x: element.x, y: element.y, width: 50, height: 20 };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = `${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;

    const lines = element.text.split("\n");
    const lineHeight = (element.fontSize || 16) * 1.2;

    let maxWidth = 0;
    lines.forEach((line) => {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    });

    return {
      x: element.x,
      y: element.y,
      width: maxWidth,
      height: lines.length * lineHeight,
    };
  };

  const isInsideElement = (x, y, element) => {
    if (!element) return false;

    const {
      x: ex,
      y: ey,
      width,
      height,
      x1,
      y1,
      x2,
      y2,
      name,
      points,
    } = element;

    if (name === "Text") {
      const bounds = getTextBounds(element);
      return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      );
    }

    if (["Rectangle", "Circle", "Diamond"].includes(name)) {
      return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
    }

    if (["Arrow", "Dash"].includes(name)) {
      const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
      const a = dist(x1, y1, x2, y2);
      const b = dist(x1, y1, x, y);
      const c = dist(x2, y2, x, y);
      return Math.abs(a - (b + c)) < 5;
    }

    if (name === "Draw" && points) {
      // Simple hit detection for paths - checks if point is near any segment
      for (let i = 1; i < points.length; i++) {
        const dist = pointToLineDistance(
          x,
          y,
          points[i - 1].x,
          points[i - 1].y,
          points[i].x,
          points[i].y
        );
        if (dist < 5) return true;
      }
      return false;
    }

    return false;
  };

  const pointToLineDistance = (x, y, x1, y1, x2, y2) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    return Math.hypot(x - xx, y - yy);
  };

  const isInsideSelectionBox = (element, box) => {
    if (!box) return false;

    let bounds;
    if (element.name === "Text") {
      bounds = getTextBounds(element);
    } else if (element.name === "Draw") {
      if (!element.points || element.points.length === 0) return false;
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    } else {
      bounds = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
    }

    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);

    return (
      bounds.x >= minX &&
      bounds.x + bounds.width <= maxX &&
      bounds.y >= minY &&
      bounds.y + bounds.height <= maxY
    );
  };

  const drawGrid = (ctx) => {
    const gridSize = 20 * viewport.zoom;
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    for (let x = offsetX; x < ctx.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }

    for (let y = offsetY; y < ctx.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawSelectionBox = (ctx) => {
    if (!selectionBox) return;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 123, 255, 0.8)";
    ctx.fillStyle = "rgba(0, 123, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const x =
      Math.min(selectionBox.startX, selectionBox.endX) * viewport.zoom +
      viewport.x;
    const y =
      Math.min(selectionBox.startY, selectionBox.endY) * viewport.zoom +
      viewport.y;
    const width =
      Math.abs(selectionBox.endX - selectionBox.startX) * viewport.zoom;
    const height =
      Math.abs(selectionBox.endY - selectionBox.startY) * viewport.zoom;

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  };

  const drawSelectedElements = (ctx) => {
    selectedElements.forEach((elementId) => {
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      ctx.save();
      ctx.strokeStyle = "rgba(0, 123, 255, 0.8)";
      ctx.lineWidth = 2 / viewport.zoom;
      ctx.setLineDash([5, 5]);

      let bounds;
      if (element.name === "Text") {
        bounds = getTextBounds(element);
      } else if (element.name === "Draw") {
        if (!element.points || element.points.length === 0) return;
        const xs = element.points.map((p) => p.x);
        const ys = element.points.map((p) => p.y);
        bounds = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
      } else {
        bounds = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        };
      }

      const screenPos = worldToScreen(bounds.x, bounds.y);
      ctx.strokeRect(
        screenPos.x - 5,
        screenPos.y - 5,
        bounds.width * viewport.zoom + 10,
        bounds.height * viewport.zoom + 10
      );
      ctx.restore();
    });
  };

  const drawFadedShape = (ctx, element, opacity = 0.3) => {
    const { name, x, y, width, height, x1, y1, x2, y2, points } = element;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    switch (name) {
      case "Text":
        const bounds = getTextBounds(element);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        break;

      case "Rectangle":
        ctx.strokeRect(x, y, width, height);
        break;

      case "Circle": {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case "Diamond":
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height / 2);
        ctx.lineTo(x + width / 2, y + height);
        ctx.lineTo(x, y + height / 2);
        ctx.closePath();
        ctx.stroke();
        break;

      case "Arrow":
      case "Dash":
        if (x1 && y1 && x2 && y2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (name === "Arrow") {
            const headLength = 15;
            const angle = Math.atan2(y2 - y1, x2 - x1);

            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(
              x2 - headLength * Math.cos(angle - Math.PI / 6),
              y2 - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(x2, y2);
            ctx.lineTo(
              x2 - headLength * Math.cos(angle + Math.PI / 6),
              y2 - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
        break;

      case "Draw":
        if (points && points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  };

  const finishTextInput = () => {
    if (textInput.trim() && textElement) {
      const finalTextElement = {
        ...textElement,
        text: textInput,
        roughShape: {
          type: "text",
          text: textInput,
          x: textElement.x,
          y: textElement.y,
        },
      };

      addElement(finalTextElement);
    }

    setIsTyping(false);
    setTextInput("");
    setTextElement(null);
  };

  const cancelTextInput = () => {
    setIsTyping(false);
    setTextInput("");
    setTextElement(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawGrid(ctx);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    const rc = rough.canvas(canvas);

    elements.forEach((el) => {
      if (elementsToErase.has(el.id)) {
        drawFadedShape(ctx, el, 0.4);
      } else {
        if (el.name === "Text") {
          drawTextElement(ctx, el);
        } else if (Array.isArray(el.roughShape)) {
          el.roughShape.forEach((shape) => rc.draw(shape));
        } else if (el.roughShape) {
          rc.draw(el.roughShape);
        }
      }
    });

    if (
      currentElement &&
      selectedTool !== "Eraser" &&
      selectedTool !== "Select" &&
      selectedTool !== "Text" &&
      selectedTool !== "Draw"
    ) {
      const tempShape = createRoughShape(currentElement);
      if (Array.isArray(tempShape)) {
        tempShape.forEach((shape) => rc.draw(shape));
      } else if (tempShape) {
        rc.draw(tempShape);
      }
    }

    // Draw the current path in progress
    if (isDrawing && currentPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }

      ctx.stroke();
      ctx.restore();
    }

    if (isTyping && textInput) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "black";
      ctx.textBaseline = "top";

      const lines = textInput.split("\n");
      const lineHeight = 16 * 1.2;

      lines.forEach((line, index) => {
        ctx.fillText(line, textPosition.x, textPosition.y + index * lineHeight);
      });

      const cursorX =
        textPosition.x + ctx.measureText(lines[lines.length - 1] || "").width;
      const cursorY = textPosition.y + (lines.length - 1) * lineHeight;

      if (Math.floor(Date.now() / 500) % 2) {
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(cursorX, cursorY + 16);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
    drawSelectionBox(ctx);
    drawSelectedElements(ctx);

    if (selectedTool === "Eraser" && eraserPos) {
      const screenPos = worldToScreen(eraserPos.x, eraserPos.y);

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
      ctx.lineWidth = 4;
      ctx.arc(screenPos.x, screenPos.y, 15, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = isMouseDown
        ? "rgba(255, 50, 50, 0.9)"
        : "rgba(255, 100, 100, 0.7)";
      ctx.lineWidth = 2;
      ctx.arc(screenPos.x, screenPos.y, 10, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = isMouseDown
        ? "rgba(255, 0, 0, 0.8)"
        : "rgba(255, 100, 100, 0.6)";
      ctx.arc(screenPos.x, screenPos.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }, [
    elements,
    currentElement,
    selectedTool,
    eraserPos,
    isMouseDown,
    elementsToErase,
    viewport,
    selectionBox,
    selectedElements,
    isTyping,
    textInput,
    textPosition,
    isDrawing,
    currentPath,
  ]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setInitialDistance(distance);
      setInitialZoom(viewport.zoom);
      return;
    }

    if (selectedTool === "Draw") {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const worldPos = screenToWorld(screenX, screenY);

      setIsDrawing(true);
      setCurrentPath([worldPos]);
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;

    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
    });
    mouseEvent.isTouch = true;
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (initialDistance !== null) {
        const scale = currentDistance / initialDistance;
        const newZoom = initialZoom * scale;
        const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = centerX - rect.left;
        const screenY = centerY - rect.top;

        setViewport((prev) => ({
          zoom: clampedZoom,
          x: screenX - (screenX - prev.x) * (clampedZoom / prev.zoom),
          y: screenY - (screenY - prev.y) * (clampedZoom / prev.zoom),
        }));
      }
      return;
    }

    if (isDrawing && selectedTool === "Draw") {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const worldPos = screenToWorld(screenX, screenY);

      setCurrentPath((prev) => [...prev, worldPos]);
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;

    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
    });
    mouseEvent.isTouch = true;
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setInitialDistance(null);

    if (isDrawing && selectedTool === "Draw") {
      if (currentPath.length > 1) {
        const roughShape = createRoughPath(currentPath);
        addElement({
          id: Date.now(),
          name: "Draw",
          points: [...currentPath],
          roughShape,
          color: "red",
        });
      }
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (e.touches.length === 0) {
      const mouseEvent = new MouseEvent("mouseup", {
        button: 0,
      });
      mouseEvent.isTouch = true;
      handleMouseUp(mouseEvent);
    }
  };

  const handleMouseDown = (e) => {
    if (e.isTouch) e.preventDefault();
    setIsMouseDown(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setPanStart({ x: screenX - viewport.x, y: screenY - viewport.y });
      return;
    }

    if (selectedTool === "Text") {
      if (isTyping) finishTextInput();

      setIsTyping(true);
      setTextInput("");
      setTextPosition(worldPos);
      setTextElement({
        id: Date.now(),
        name: "Text",
        x: worldPos.x,
        y: worldPos.y,
        text: "",
        fontSize: 16,
        fontFamily: "Arial",
        color: "black",
      });
      canvasRef.current.focus();
      return;
    }

    if (selectedTool === "Hand") {
      setIsPanning(true);
      setPanStart({ x: screenX - viewport.x, y: screenY - viewport.y });
      return;
    }

    if (selectedTool === "Draw") {
      setIsDrawing(true);
      setCurrentPath([worldPos]);
      return;
    }

    if (selectedTool === "Select") {
      const clickedElement = elements.find((el) =>
        isInsideElement(worldPos.x, worldPos.y, el)
      );

      if (clickedElement) {
        if (selectedElements.has(clickedElement.id)) {
          const offsetX = worldPos.x - clickedElement.x;
          const offsetY = worldPos.y - clickedElement.y;
          setDraggedElement(clickedElement);
          setDragOffset({ x: offsetX, y: offsetY });
        } else {
          if (e.shiftKey) {
            setSelectedElements(
              new Set([...selectedElements, clickedElement.id])
            );
          } else {
            setSelectedElements(new Set([clickedElement.id]));
          }
          const offsetX = worldPos.x - clickedElement.x;
          const offsetY = worldPos.y - clickedElement.y;
          setDraggedElement(clickedElement);
          setDragOffset({ x: offsetX, y: offsetY });
        }
      } else {
        setIsSelecting(true);
        setSelectionBox({
          startX: worldPos.x,
          startY: worldPos.y,
          endX: worldPos.x,
          endY: worldPos.y,
        });

        if (!e.shiftKey) {
          setSelectedElements(new Set());
        }
      }
      return;
    }

    if (selectedTool === "Eraser") {
      setEraserPos(worldPos);
      const newElementsToErase = new Set();
      elements.forEach((el) => {
        if (isInsideElement(worldPos.x, worldPos.y, el)) {
          newElementsToErase.add(el.id);
        }
      });
      setElementsToErase(newElementsToErase);
      return;
    }

    if (!selectedTool || selectedTool === "Select" || selectedTool === "Text")
      return;

    setCurrentElement({
      id: Date.now(),
      name: selectedTool,
      x1: worldPos.x,
      y1: worldPos.y,
      x2: worldPos.x,
      y2: worldPos.y,
    });
  };

  const handleMouseMove = (e) => {
    if (e.isTouch) e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: screenX - panStart.x,
        y: screenY - panStart.y,
      }));
      return;
    }

    if (isDrawing && selectedTool === "Draw") {
      setCurrentPath((prev) => [...prev, worldPos]);
      return;
    }

    if (isSelecting && selectionBox) {
      setSelectionBox((prev) => ({
        ...prev,
        endX: worldPos.x,
        endY: worldPos.y,
      }));
      return;
    }

    if (draggedElement && selectedElements.size > 0) {
      const dx = worldPos.x - dragOffset.x;
      const dy = worldPos.y - dragOffset.y;
      const offsetX = dx - draggedElement.x;
      const offsetY = dy - draggedElement.y;

      const updated = [...elements];
      selectedElements.forEach((elementId) => {
        const index = updated.findIndex((el) => el.id === elementId);
        if (index !== -1) {
          const el = { ...updated[index] };
          el.x += offsetX;
          el.y += offsetY;
          if (el.x1 !== undefined) el.x1 += offsetX;
          if (el.y1 !== undefined) el.y1 += offsetY;
          if (el.x2 !== undefined) el.x2 += offsetX;
          if (el.y2 !== undefined) el.y2 += offsetY;
          if (el.points) {
            el.points = el.points.map((p) => ({
              x: p.x + offsetX,
              y: p.y + offsetY,
            }));
          }
          el.roughShape = createRoughShape(el);
          updated[index] = el;
        }
      });

      setElements(updated);
      setDraggedElement((prev) => ({
        ...prev,
        x: dx,
        y: dy,
      }));
      return;
    }

    if (selectedTool === "Eraser") {
      setEraserPos(worldPos);
      if (isMouseDown) {
        const newElementsToErase = new Set(elementsToErase);
        elements.forEach((el) => {
          if (isInsideElement(worldPos.x, worldPos.y, el)) {
            newElementsToErase.add(el.id);
          }
        });
        setElementsToErase(newElementsToErase);
      }
      return;
    }

    if (currentElement && selectedTool !== "Draw") {
      const { x1, y1 } = currentElement;

      let shapeX = x1;
      let shapeY = y1;
      let width = worldPos.x - x1;
      let height = worldPos.y - y1;

      if (width < 0) {
        shapeX = worldPos.x;
        width = Math.abs(width);
      }
      if (height < 0) {
        shapeY = worldPos.y;
        height = Math.abs(height);
      }

      setCurrentElement({
        ...currentElement,
        x2: worldPos.x,
        y2: worldPos.y,
        x: shapeX,
        y: shapeY,
        width,
        height,
      });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsPanning(false);

    if (isDrawing && selectedTool === "Draw") {
      if (currentPath.length > 1) {
        const roughShape = createRoughPath(currentPath);
        addElement({
          id: Date.now(),
          name: "Draw",
          points: [...currentPath],
          roughShape,
          color: "red",
        });
      }
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (isSelecting && selectionBox) {
      const newSelected = new Set(selectedElements);
      elements.forEach((el) => {
        if (isInsideSelectionBox(el, selectionBox)) {
          newSelected.add(el.id);
        }
      });
      setSelectedElements(newSelected);
      setSelectionBox(null);
      setIsSelecting(false);
      return;
    }

    if (selectedTool === "Eraser") {
      if (elementsToErase.size > 0) {
        const filtered = elements.filter((el) => !elementsToErase.has(el.id));
        setElements(filtered);
      }
      setElementsToErase(new Set());
      setEraserPos(null);
      return;
    }

    if (
      currentElement &&
      selectedTool !== "Eraser" &&
      selectedTool !== "Select" &&
      selectedTool !== "Text" &&
      selectedTool !== "Draw"
    ) {
      const roughShape = createRoughShape(currentElement);
      addElement({
        ...currentElement,
        roughShape,
      });
      setCurrentElement(null);
    }

    setDraggedElement(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));

    setViewport((prev) => ({
      zoom: newZoom,
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
    }));
  };

  const resetZoom = () => {
    setViewport({
      x: 0,
      y: 0,
      zoom: 1,
    });
  };

  const handleKeyDown = (e) => {
    if (isTyping) {
      e.preventDefault();

      if (e.key === "Enter") {
        if (e.shiftKey) {
          setTextInput((prev) => prev + "\n");
        } else {
          finishTextInput();
        }
      } else if (e.key === "Backspace") {
        setTextInput((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        cancelTextInput();
      } else if (e.key.length === 1) {
        setTextInput((prev) => prev + e.key);
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedElements.size > 0) {
        const filtered = elements.filter((el) => !selectedElements.has(el.id));
        setElements(filtered);
        setSelectedElements(new Set());
      }
    }

    if (e.key === "Escape") {
      setSelectedElements(new Set());
      setCurrentElement(null);
      if (isTyping) cancelTextInput();
      if (isDrawing) {
        setIsDrawing(false);
        setCurrentPath([]);
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "a") {
        e.preventDefault();
        const allIds = new Set(elements.map((el) => el.id));
        setSelectedElements(allIds);
      }
    }

    if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      resetZoom();
    }
  };

  const viewPortZoom = (viewport.zoom * 100).toFixed(0);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElements, elements, isTyping, textInput, isDrawing]);

  return (
    <div
      className="relative"
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor:
            selectedTool === "Hand"
              ? "grab"
              : selectedTool === "Eraser"
              ? "none"
              : selectedTool === "Select"
              ? "default"
              : selectedTool === "Draw"
              ? "crosshair"
              : "crosshair",
          display: "block",
          touchAction: "none",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
        }}
      >
        <div className="relative">
          <div className="absolute right-0 flex justify-center gap-4 items-center">
            <div className="relative  hidden md:block">
              <div className="cursor-pointer">?</div>
              <div
                className="absolute right-2 top-8 rounded-3xl text-gray-800 bg-white/95 backdrop-blur-2xl w-[280px] p-6 shadow-2xl border border-white/30"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                }}
              >
                <div
                  style={{
                    marginBottom: "16px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      borderRadius: "50%",
                    }}
                  />
                  Controls
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Mouse wheel
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Zoom
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Middle click
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Pan
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Ctrl+A
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Select all
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Delete
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Remove selected
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Escape
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Deselect
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      background: "rgba(248, 250, 252, 0.8)",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      Ctrl+0
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Reset zoom
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <HamburgerMenu className="h-auto w-10 md:w-8 bg-gray-200 p-2 rounded-md cursor-pointer hover:opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {Number(viewPortZoom) !== 100 && (
          <motion.button
            onClick={resetZoom}
            className="fixed left-1/2 bg-purple-800 -translate-x-1/2 bottom-8 flex items-center gap-3 px-6 py-3"
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.8,
              x: "-50%",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              x: "-50%",
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.8,
              x: "-50%",
            }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              duration: 0.5,
            }}
            whileHover={{
              scale: 1.05,
              x: "-50%",
            }}
            whileTap={{
              scale: 0.95,
              x: "-50%",
            }}
            style={{
              fontSize: "14px",
              color: "white",
              fontWeight: "500",
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              // background: "rgba(17, 24, 39, 0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(55, 65, 81, 0.3)",
              borderRadius: "24px",
              cursor: "pointer",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <path d="M3 2v6h6" />
              <path d="M21 12A9 9 0 0 0 6 7l-3 3" />
              <path d="M21 22v-6h-6" />
              <path d="M3 12a9 9 0 0 0 15 5l3-3" />
            </motion.svg>
            Reset Zoom ({viewPortZoom}%)
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Body;
