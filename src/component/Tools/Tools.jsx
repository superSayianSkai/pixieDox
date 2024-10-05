import Icons from "./Icons";
import { ShapeContext } from "../../context/shapeContext";
import { useContext } from "react";
const Tools = () => {

  const { elementId, tool } = useContext(ShapeContext);

  return (
    <div className=" border-[2px] py-5 px-5 p-4 rounded-3xl shadow-2xl bg-white border-gray-300 fixed top-[50%] left-6 -translate-y-1/2 z-10">
      <div className="relative">
        {Icons.map((icon) => {
          return (
            <div
              className={`cursor-pointer text-xl ${
                icon.id === tool ? "bg-purple-800 rounded-xl text-white" : ""
              }hover:bg-purple-600 hover:rounded-xl`}
              key={icon.id}
            >
              <div
                onClick={() => elementId(icon)}
                className={`${
                  icon.id === tool && "text-white"
                } w-[35px] h-[35px] flex justify-center items-center text-center text-black rounded-xl my-[3px] hover:text-white`}
              >
                <icon.Icon />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tools;
