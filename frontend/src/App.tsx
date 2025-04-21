import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { Toaster } from "@/components/ui/toaster";

const App: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <Toaster />
      </>
    </Suspense>
  );
};

export default App;
