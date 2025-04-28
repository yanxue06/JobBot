import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { Toaster } from "@/components/ui/toaster";
import ResumeEditor from "./components/ResumeEditor";
import Navbar from "./components/Navbar";

const App: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume-editor" element={<ResumeEditor />} />
          <Route path="/job-analysis" element={<Home defaultTab="job-posting" />} />
          <Route path="/resume-analysis" element={<Home defaultTab="resume" />} />
        </Routes>
        <Toaster />
      </>
    </Suspense>
  );
};

export default App;
