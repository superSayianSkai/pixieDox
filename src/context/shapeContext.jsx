import { createContext, useState } from "react";
export const ShapeContext = createContext();

export const ShapeProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState();
  const [tool, setTool] = useState();

  const elementId = (e) => {
    setTool(e.id);
    setActiveTool(e.name);
  };
  return (
    <ShapeContext.Provider value={{ tool, activeTool, elementId }}>
      {children}
    </ShapeContext.Provider>
  );
};
