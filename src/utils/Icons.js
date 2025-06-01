import { BiRectangle } from "react-icons/bi";
import { IoIosColorPalette } from "react-icons/io";
import { LuCircle } from "react-icons/lu";
import { MdOutlineEdit } from "react-icons/md";
import { RxText } from "react-icons/rx";
import { FaRegHandPaper } from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { LuImage } from "react-icons/lu";
import { TbEraser } from "react-icons/tb";
import { BsDashLg } from "react-icons/bs";




import { LuDiamond } from "react-icons/lu";

const Icons = [
  {
    id: 0,
    name: "Hand",
    Icon: FaRegHandPaper,
  },
  {
    id: 1,
    name: "Rectangle",
    Icon: BiRectangle,
  },
  {
    id: 2,
    name: "Diamond",
    Icon: LuDiamond,
  },
  {
    id: 3,
    name: "Circle",
    Icon: LuCircle,
  },
  {
    id: 4,
    name: "Arrow",
    Icon: HiOutlineArrowNarrowRight,
  },
  {
    id: 5,
    name: "Draw",
    Icon: MdOutlineEdit,
  },
  {
    id: 6,
    name: "Dash",
    Icon: BsDashLg,
  },
  {
    id: 7,
    name: "Text",
    Icon: RxText,
  },
  {
    id: 8,
    name: "Picture",
    Icon:  LuImage,
  },
  {
    id: 9,
    name: "Eraser",
    Icon: TbEraser,
  },
  {
    id: 10,
    name: "Color",
    Icon: IoIosColorPalette,
  },
];
export default Icons;
