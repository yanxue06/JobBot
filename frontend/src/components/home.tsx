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
import { BookOpen, Briefcase, FileText, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserMenu from "@/components/auth/UserMenu";

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

const Home = () => {
  const [activeTab, setActiveTab] = useState<string>("job-posting");
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
      <header className="sticky top-0 z-10 px-4 py-3 bg-white border-b dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            JobBot
          </h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}

      <section className="px-4 py-16 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 md:py-24">
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
              <div className="flex flex-wrap gap-4">
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
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm dark:bg-slate-800">
                  <Heart className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Completely Non-profitable
                  </span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80"
                alt="Job application process"
                className="w-full rounded-lg shadow-md"
              />
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
                defaultValue="job-posting"
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

      {/* Mission Statement */}

      <section className="px-4 py-12 bg-blue-50 dark:bg-slate-800">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="mb-4 text-2xl font-semibold md:text-3xl text-slate-800 dark:text-white">
            Our Mission
          </h2>
          <p className="max-w-3xl mx-auto mb-6 text-slate-600 dark:text-slate-300">
            We believe everyone deserves access to quality job application
            assistance. This tool is completely free and designed to democratize
            access to AI-powered job search tools that would otherwise be
            expensive or inaccessible.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="max-w-xs p-6 bg-white rounded-lg shadow-sm dark:bg-slate-700">
              <div className="flex items-center justify-center w-12 h-12 p-3 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 font-medium text-slate-800 dark:text-white">
                Completely Non-profitable
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are charged for the amount you amount of tokens you use. We
                make no profit from this service.
              </p>
            </div>

            <div className="max-w-xs p-6 bg-white rounded-lg shadow-sm dark:bg-slate-700">
              <div className="flex items-center justify-center w-12 h-12 p-3 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 font-medium text-slate-800 dark:text-white">
                Equal Opportunity
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                We're committed to helping job seekers from all backgrounds
                improve their applications.
              </p>
            </div>
          </div>
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
