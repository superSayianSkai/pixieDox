import Icons from "../utils/Icons";
import { useElementStore } from "../zustard/useElementStore";
const Tools = () => {
  const { setSelectedTool, selectedTool } = useElementStore();
  return (
    <div className=" border-[2px] py-5 px-2 rounded-3xl shadow-2xl bg-white border-gray-300 fixed top-[50%] left-2 md:left-6 -translate-y-1/2 z-10">
      <div className="relative">
        {Icons.map((icon) => {
          const isActive = selectedTool === icon.name;
          return (
            <div
              className={`cursor-pointer text-xl ${
                isActive ? "bg-purple-800 rounded-xl text-white" : ""
              }hover:bg-purple-600 hover:rounded-xl`}
              key={icon.id}
            >
              <div
                onClick={() => setSelectedTool(icon.name)}
                className={`${
                  isActive && "text-white"
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
