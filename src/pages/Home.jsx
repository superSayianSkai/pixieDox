import Tools from "../component/Tools"
import Body from "../component/Body"
const Home = () => {
  return (
    <div className="bg-white overflow-hidden">
  
        <>
          <Tools />
          <Body />
          <footer className="fixed bottom-0  translate-x-1/2 -translate-y-1/2 text-[24px] font-thin right-20 user-select">
            Pixie<span className="text-purple-800">dox</span>
          </footer>
        </>
      
    </div>
  );
};

export default Home;
