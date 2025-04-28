import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import JobPostingAnalyzer from "./JobPostingAnalyzer";
import ResumeAnalyzer from "./ResumeAnalyzer";
import { BookOpen, Briefcase, FileText, Heart, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserMenu from "@/components/auth/UserMenu";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Define the job analysis data interface
interface JobAnalysisData {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  location: string;
  salary: string;
}

interface HomeProps {
  defaultTab?: string;
}

const Home: React.FC<HomeProps> = ({ defaultTab = "job-posting" }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobAnalysisData, setJobAnalysisData] =
    useState<JobAnalysisData | null>(null);

  // Load saved job data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("analysisData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setJobAnalysisData(parsedData);

        // If we have the original job description, load that too
        const savedJobDescription = localStorage.getItem("jobDescription");
        if (savedJobDescription) {
          setJobDescription(savedJobDescription);
        }
      }
    } catch (e) {
      console.error("Error loading saved job data:", e);
    }
  }, []);

  // Handle job analysis completion
  const handleJobAnalysisComplete = (data: JobAnalysisData) => {
    setJobAnalysisData(data);
  };

  // Switch to job posting tab
  const switchToJobPostingTab = () => {
    setActiveTab("job-posting");
  };

  // Switch to resume tab
  const switchToResumeTab = () => {
    setActiveTab("resume");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}


      {/* Hero Section */}
      <section className="px-4 py-10 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 md:py-16">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="md:w-1/2">
              <h1 className="mb-4 text-4xl font-bold md:text-5xl text-slate-800 dark:text-white">
                AI-Powered Job Application Assistant
              </h1>
              <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
                Simplify your job application process with our AI tools that
                analyze job postings and improve your resume to increase your
                chances of landing interviews.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm dark:bg-slate-800">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Job Posting Analysis
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm dark:bg-slate-800">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Resume Optimization
                  </span>
                </div>
              </div>
              <Link to="/resume-editor">
                <Button className="flex items-center gap-2">
                  Try our new Resume Editor
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12">
        <div className="container max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-white border-b rounded-t-lg dark:bg-slate-800 dark:border-slate-700">
              <CardTitle className="text-2xl text-center text-slate-800 dark:text-white">
                Start Your Analysis
              </CardTitle>
              <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                Choose an option below to begin improving your job application
                materials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs
                defaultValue={defaultTab}
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-0">
                  <TabsTrigger
                    value="job-posting"
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Analyze Job Posting
                  </TabsTrigger>
                  <TabsTrigger
                    value="resume"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Analyze Resume
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="job-posting" className="m-0">
                  <JobPostingAnalyzer
                    onAnalysisComplete={handleJobAnalysisComplete}
                    initialJobDescription={jobDescription}
                    onSaveDescription={(desc) => {
                      setJobDescription(desc);
                      localStorage.setItem("jobDescription", desc);
                    }}
                  />
                </TabsContent>
                <TabsContent value="resume" className="m-0">
                  <ResumeAnalyzer
                    jobDescription={jobDescription}
                    onRequestJobDescription={switchToJobPostingTab}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resume Editor Promo */}
      <section className="px-4 py-12 bg-blue-50 dark:bg-slate-800">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="mb-4 text-2xl font-semibold md:text-3xl text-slate-800 dark:text-white">
            New! Resume Editor with AI Suggestions
          </h2>
          <p className="max-w-3xl mx-auto mb-6 text-slate-600 dark:text-slate-300">
            Try our new resume editor that allows you to upload your existing resume,
            edit it with AI-powered suggestions, and export it in DOCX or PDF format.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="max-w-xs p-6 bg-white rounded-lg shadow-sm dark:bg-slate-700">
              <div className="flex items-center justify-center w-12 h-12 p-3 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 font-medium text-slate-800 dark:text-white">
                Free to Use
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are charged only for the AI tokens you use. We
                make no profit from this service.
              </p>
            </div>

            <div className="max-w-xs p-6 bg-white rounded-lg shadow-sm dark:bg-slate-700">
              <div className="flex items-center justify-center w-12 h-12 p-3 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 font-medium text-slate-800 dark:text-white">
                AI-Powered Editing
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Get tailored suggestions to strengthen your resume based on the job description.
              </p>
            </div>
          </div>
          
          <Link to="/resume-editor" className="inline-block mt-6">
            <Button size="lg" className="flex items-center gap-2">
              Open Resume Editor
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-white bg-slate-800 dark:bg-slate-900">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold">
                AI Job Application Assistant
              </h2>
              <p className="text-sm text-slate-300">
                Making job applications easier for everyone.
              </p>
            </div>
            <div className="text-sm text-slate-300">
              © {new Date().getFullYear()} AI Job Application Assistant. All
              rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
