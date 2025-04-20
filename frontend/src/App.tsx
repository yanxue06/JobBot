import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";

const App: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </>
    </Suspense>
  );
};

export default App;
