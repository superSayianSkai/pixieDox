import { useEffect, useState } from "react";
import rough from "roughjs";
import { ShapeContext } from "../../context/shapeContext";
import { useContext } from "react";

const Body = () => {
  const [drawing, setDrawing] = useState(false);
  const [elements, setElements] = useState([]);
  const { activeTool } = useContext(ShapeContext);
  console.log(activeTool);

  const generator = rough.generator();

  const createElement = (x1, y1, x2, y2) => {
    const roughElement =
      activeTool === "Dash"
        ? generator.line(x1, y1, x2, y2)
        : activeTool === "Rectangle"
        ? generator.rectangle(x1, y1, x2 - x1, y2 - y1)
        : "";

    return { x1, y1, x2, y2, roughElement };
  };

  useEffect(() => {
    const canvas = document.getElementById("myStage");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height); // clear canvas before re-drawing

    const roughCanvas = rough.canvas(canvas);

    // Draw each tool (element) in the tools array
    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  const onMouseDown = (event) => {
    setDrawing(true); // Start drawing
    const { clientX, clientY } = event;

    const element = createElement(clientX, clientY, clientX, clientY); // Create a new element
    setElements((prev) => [...prev, element]); // Add the element to the tools array
  };

  const onMouseMove = (event) => {
    if (!drawing) return; // Only proceed if drawing is active

    const index = elements.length - 1; // Get the last drawn element

    if (index < 0) return; // Safeguard: if no element exists, do nothing

    const { clientX, clientY } = event;
    const { x1, y1 } = elements[index]; // Get starting point of the current element

    // Create a new updated element with new end coordinates
    const updatedElement = createElement(x1, y1, clientX, clientY);

    const updatedTools = [...elements]; // Copy the tools array
    updatedTools[index] = updatedElement; // Replace the last element with the updated one
    setElements(updatedTools); // Update the state with the new array
  };

  const onMouseUp = () => {
    setDrawing(false); // Stop drawing when mouse is released
  };

  return (
    <canvas
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      id="myStage"
      style={{ backgroundColor: "" }}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};

export default Body;
