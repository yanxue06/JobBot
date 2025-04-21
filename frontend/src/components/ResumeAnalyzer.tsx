import React, { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ResumeAnalyzerProps {
  jobDescription?: string;
  onRequestJobDescription?: () => void;
}

interface SavedJobData {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  location: string;
  salary: string;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  jobDescription = "",
  onRequestJobDescription = () => {},
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    compatibilityScore: number;
    missingKeywords: string[];
    improvementSuggestions: { category: string; suggestions: string[] }[];
    matchedKeywords: string[];
  } | null>(null);
  const [savedJobData, setSavedJobData] = useState<SavedJobData | null>(null);
  const [hasJobDescription, setHasJobDescription] = useState(!!jobDescription);

  const mockAnalysisResults = {
    compatibilityScore: 72,
    missingKeywords: [
      "Docker",
      "Kubernetes",
      "CI/CD",
      "AWS",
      "Agile methodology",
    ],
    matchedKeywords: [
      "React",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "Node.js",
      "REST API",
    ],
    improvementSuggestions: [
      {
        category: "Technical Skills",
        suggestions: [
          "Add experience with containerization technologies like Docker and Kubernetes",
          "Include cloud platform experience, particularly with AWS",
          "Highlight any experience with CI/CD pipelines",
        ],
      },
      {
        category: "Experience Description",
        suggestions: [
          "Quantify your achievements with metrics and specific outcomes",
          "Use more action verbs to describe your responsibilities",
          "Align your experience descriptions with the job requirements",
        ],
      },
      {
        category: "Resume Structure",
        suggestions: [
          "Consider adding a skills section at the top of your resume",
          "Ensure your most relevant experience is prominently featured",
        ],
      },
    ],
  };

  // Load saved job data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("analysisData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSavedJobData(parsedData);
        setHasJobDescription(true);
      }
    } catch (e) {
      console.error("Error loading saved job data:", e);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setAnalysisComplete(false);
    setAnalysisResults(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.type === "application/pdf" ||
        droppedFile.type === "application/msword" ||
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setFile(droppedFile);
      setAnalysisComplete(false);
      setAnalysisResults(null);
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    if (!hasJobDescription && !savedJobData) {
      onRequestJobDescription();
      return;
    }

    setIsAnalyzing(true);

    // forms let you send files and other data types to the server
    const form = new FormData();
    form.append("resume", file);
    form.append("analysisData", localStorage.getItem("analysisData") || "");

    try {
      // Resume analysis logic here
      const response = await fetch("http://localhost:5317/analyze_resume", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze resume");
      }

      const data = await response.json();
      console.log("Resume analysis results:", data);

      // Transform the backend response into the format expected by the UI
      if (data.suggestions) {
        // Create categorized suggestions from the backend data
        const categorizedSuggestions = [];

        // Group suggestions by category if they're already categorized
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          if (
            typeof data.suggestions[0] === "object" &&
            data.suggestions[0].category
          ) {
            // If suggestions are already categorized objects
            categorizedSuggestions.push(...data.suggestions);
          } else {
            // Otherwise, put all suggestions in a general category
            categorizedSuggestions.push({
              category: "General Improvements",
              suggestions: data.suggestions,
            });
          }
        }

        // Take the results, but if not filled in, use mock data (FOR TESTING)
        const results = {
          compatibilityScore: data.compatibilityScore || 65,
          missingKeywords:
            data.missingKeywords || mockAnalysisResults.missingKeywords,
          matchedKeywords:
            data.matchedKeywords || mockAnalysisResults.matchedKeywords,
          improvementSuggestions:
            categorizedSuggestions.length > 0
              ? categorizedSuggestions
              : mockAnalysisResults.improvementSuggestions,
        };

        setAnalysisResults(results);
        setAnalysisComplete(true);
      } else {
        // Fallback to mock data if no suggestions in response
        setAnalysisResults(mockAnalysisResults);
        setAnalysisComplete(true);
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysisComplete(false);
    setAnalysisResults(null);
  };

  return (
    <div>
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            Resume Analyzer
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-slate-300">
            Upload your resume to get AI-powered analysis and improvement
            suggestions based on job requirements.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!analysisComplete ? (
            <div className="space-y-6">
              {!hasJobDescription && !savedJobData ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Job description required</AlertTitle>
                  <AlertDescription>
                    Please provide a job description first to compare your
                    resume against.
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={onRequestJobDescription}
                    >
                      Add Job Description
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : savedJobData ? (
                <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-100">
                    Using saved job data
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-200">
                    Analyzing resume against saved job:{" "}
                    <strong>{savedJobData.title}</strong> at{" "}
                    <strong>{savedJobData.company}</strong>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div
                className="p-10 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("resume-upload")?.click()
                }
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200">
                    Upload your resume
                  </h3>
                  <p className="max-w-md text-sm text-gray-500 dark:text-slate-400">
                    Drag and drop your resume file here, or click to browse.
                    Supported formats: PDF, DOC, DOCX
                  </p>
                </div>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-700 dark:text-slate-200">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={resetAnalysis}
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                    <Button
                      onClick={analyzeResume}
                      disabled={
                        isAnalyzing || (!hasJobDescription && !savedJobData)
                      }
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                    </Button>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Analyzing your resume...
                  </p>
                  <Progress value={45} className="h-2" />
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Analysis Results
                </h3>
                <Button variant="outline" size="sm" onClick={resetAnalysis}>
                  <Upload className="w-4 h-4 mr-2" /> Upload New Resume
                </Button>
              </div>

              <div className="p-6 rounded-lg bg-gray-50 dark:bg-slate-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 dark:text-slate-200">
                      Compatibility Score
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      How well your resume matches the job requirements
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults?.compatibilityScore || 0}%
                        </span>
                      </div>
                      <svg className="w-24 h-24" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200 dark:text-slate-700"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-blue-600 dark:text-blue-400"
                          strokeWidth="8"
                          strokeDasharray={251.2}
                          strokeDashoffset={
                            251.2 -
                            (251.2 *
                              (analysisResults?.compatibilityScore || 0)) /
                              100
                          }
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                    </div>
                    <div>
                      {(analysisResults?.compatibilityScore || 0) >= 80 ? (
                        <Badge className="text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800">
                          Strong Match
                        </Badge>
                      ) : (analysisResults?.compatibilityScore || 0) >= 60 ? (
                        <Badge className="text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800">
                          Good Match
                        </Badge>
                      ) : (
                        <Badge className="text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800">
                          Needs Improvement
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="suggestions">
                    Improvement Suggestions
                  </TabsTrigger>
                  <TabsTrigger value="missing">Missing Keywords</TabsTrigger>
                  <TabsTrigger value="matched">Matched Keywords</TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible className="w-full">
                        {analysisResults?.improvementSuggestions.map(
                          (category, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                              <AccordionTrigger className="font-medium text-left">
                                {category.category}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="pl-6 space-y-2 list-disc">
                                  {category.suggestions.map((suggestion, i) => (
                                    <li
                                      key={i}
                                      className="text-gray-700 dark:text-slate-300"
                                    >
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ),
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="missing" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <h4 className="font-medium dark:text-white">
                            Keywords not found in your resume
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults?.missingKeywords.map(
                            (keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-800"
                              >
                                {keyword}
                              </Badge>
                            ),
                          )}
                        </div>
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900 dark:border-blue-800">
                          <AlertDescription className="text-blue-800 dark:text-blue-100">
                            Consider adding these keywords to your resume to
                            improve your match score.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="matched" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <h4 className="font-medium dark:text-white">
                            Keywords found in your resume
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults?.matchedKeywords.map(
                            (keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-green-800 border-green-200 bg-green-50 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
                              >
                                {keyword}
                              </Badge>
                            ),
                          )}
                        </div>
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-800">
                          <AlertDescription className="text-green-800 dark:text-green-100">
                            Great job! These keywords from the job description
                            were found in your resume.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start pt-6 border-t">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            This tool is provided as a free, nonprofit service to help job
            seekers improve their application materials. Your resume data is not
            stored on our servers and is only used for analysis purposes.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResumeAnalyzer;
