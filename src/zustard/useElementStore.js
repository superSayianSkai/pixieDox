  import { create } from "zustand";

  export const useElementStore = create((set) => ({
    elements: [],
    selectedTool: null,
    currentElement: null,
    draggedElement: null,
    dragOffset: null,
    eraserStrokes: [],

    setElements: (newElements) => set({ elements: newElements }),
    setSelectedTool: (newSelectedTool) => set({ selectedTool: newSelectedTool }),
    setCurrentElement: (newElement) => set({ currentElement: newElement }),
    setDraggedElement: (newDraggedElement) =>
      set({ draggedElement: newDraggedElement }),
    setDragOffset: (newDragOffset) => set({ dragOffset: newDragOffset }),

    addElement: (element) =>
      set((state) => ({
        elements: [...state.elements, element],
      })),

    addEraserStroke: (stroke) =>
      set((state) => ({
        eraserStrokes: [...state.eraserStrokes, stroke],
      })),
    updateElement: (id, newProps) =>
      set((state) => ({
        elements: state.elements.map((el) =>+
          
          el.id === id ? { ...el, ...newProps } : el
        ),
      })),

    removeElement: (id) =>
      set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
      })),
    clearEraserStrokes: () => set({ eraserStrokes: [] }),
    clearElements: () => set({ elements: [] }),
  }));
