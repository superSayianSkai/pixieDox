import { HamburgerMenu } from "iconsax-reactjs";
import { useEffect, useRef } from "react";
import useModalStore from "../zustard/useModalStore";
const AssetsBody = () => {
  const modalRef = useRef(null);
  const { modal, toggleModal, closeModal } = useModalStore();
  console.log(modal);
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [closeModal]);

  return (
    <div>
      <div className="absolute top-6 right-6">
        <div className="relative">
          <div className="absolute right-0 flex justify-center gap-4 items-center">
            <div className="relative hidden md:block">
              <div
                onClick={() => toggleModal("tips")}
                className="cursor-pointer hover:opacity-50"
              >
                ?
              </div>
              {/* {modal.type === "tips" && modal.state && (
                <div ref={modalRef} className="absolute right-2 top-8 rounded-3xl text-gray-800 bg-white/95 backdrop-blur-xl w-[280px] p-6 shadow-2xl border border-white/30">
                  <div className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                    Controls
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Mouse wheel
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Zoom
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Middle click
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Pan
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Ctrl+A
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Select all
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Delete
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Remove selected
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Escape
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Deselect
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/80 transition-all duration-200">
                      <span className="text-sm font-medium text-slate-500">
                        Ctrl+0
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        Reset zoom
                      </span>
                    </div>
                  </div>
                </div>
              )} */}
            </div>

            <div>
              <HamburgerMenu className="h-auto w-10 md:w-8 bg-gray-200 p-2 rounded-md cursor-pointer hover:opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsBody;
