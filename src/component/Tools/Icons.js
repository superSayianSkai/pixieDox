import { BiRectangle } from "react-icons/bi";
import { BsDiamond } from "react-icons/bs";
import { IoIosColorPalette } from "react-icons/io";
import { LuCircle } from "react-icons/lu";
import { IoIosArrowRoundForward } from "react-icons/io";
import { MdOutlineEdit } from "react-icons/md";
import { GoDash } from "react-icons/go";
import { RxText } from "react-icons/rx";
import { CiImageOn } from "react-icons/ci";
import { CiEraser } from "react-icons/ci";
import { PiHandThin } from "react-icons/pi";

const Icons = [
  {
    id: 0,
    name: "Hand",
    Icon: PiHandThin,
  },
  {
    id: 1,
    name: "Rectangle",
    Icon: BiRectangle,
  },
  {
    id: 2,
    name: "Diamond",
    Icon: BsDiamond,
  },
  {
    id: 3,
    name: "Circle",
    Icon: LuCircle,
  },
  {
    id: 4,
    name: "Arrow",
    Icon: IoIosArrowRoundForward,
  },
  {
    id: 5,
    name: "Draw",
    Icon: MdOutlineEdit,
  },
  {
    id: 6,
    name: "Dash",
    Icon: GoDash,
  },
  {
    id: 7,
    name: "Text",
    Icon: RxText,
  },
  {
    id: 8,
    name: "Picture",
    Icon: CiImageOn,
  },
  {
    id: 9,
    name: "Eraser",
    Icon: CiEraser,
  },
  {
    id: 10,
    name: "Color",
    Icon: IoIosColorPalette,
  },
];
export default Icons;
