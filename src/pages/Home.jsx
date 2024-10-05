import Tools from "../component/Tools/Tools";
import Body from "../component/Body/Body";
import ExperimentPage from "../sandbox/ExperimentPage";
import { FeatureFlags } from "../FeaturesFlag/FeatureFlag";

const Home = () => {
  return (
    <div className="bg-white overflow-auto">
      {FeatureFlags.ExperimentPage ? (
        <ExperimentPage />
      ) : (
        <>
          {" "}
          <Tools />
          <Body/>
        </>
      )}
    </div>
  );
};

export default Home;
