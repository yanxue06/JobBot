import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Brain,
  EyeIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface JobPostingAnalyzerProps {
  onAnalysisComplete?: (analysisData: JobAnalysisData) => void;
}

interface JobAnalysisData {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
  location: string;
  salary: string;
}

const JobPostingAnalyzer = ({
  onAnalysisComplete = () => {},
}: JobPostingAnalyzerProps) => {
  const [inputMethod, setInputMethod] = useState<"text" | "url">("text");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStreaming, setShowStreaming] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");
  const streamRef = useRef<EventSource | null>(null);
  const [analysisData, setAnalysisData] = useState<JobAnalysisData>({
    title: "",
    company: "",
    requirements: [],
    responsibilities: [],
    keywords: [],
    location: "",
    salary: "",
  });

  // Clean up the EventSource on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (inputMethod === "text" && !jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    } else if (inputMethod === "url" && !jobUrl.trim()) {
      setError("Please enter a job posting URL");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setStreamingOutput("");

    try {
      if (inputMethod === "text") {
        console.log("Analyzing job posting");

        // Close any existing stream
        if (streamRef.current) {
          streamRef.current.close();
        }

        // Set up server-sent events for streaming --> opening a connection from the server to the client
        const eventSource = new EventSource(
          `http://localhost:5317/analyze_job_posting?description=${encodeURIComponent(jobDescription)}`,
        );
        streamRef.current = eventSource;

        // Handle incoming messages
        eventSource.addEventListener("message", (event) => {
          try {
            console.log("Received event:", event.data);
            const data = JSON.parse(event.data);

            if (data.error) {
              setError(`Error: ${data.error}`);
              eventSource.close();
              setIsAnalyzing(false);
              return;
            }

            // Update streaming output
            if (data.text) {
              setStreamingOutput((prev) => prev + data.text);
            }

            // Check if streaming is complete
            if (data.complete) {
              console.log("Stream complete:", data);
              eventSource.close();
              setIsAnalyzing(false);
              setAnalysisComplete(true);

              // Create data based on summary with fallbacks for missing fields
              if (data.summary) {
                try {
                  // Parse the summary if it's a string
                  let parsedSummary: JobAnalysisData;
                  if (typeof data.summary === "string") {
                    try {
                      parsedSummary = JSON.parse(data.summary);
                    } catch (parseError) {
                      console.error("Error parsing summary JSON:", parseError);
                      // If it's not valid JSON but contains data, try to extract it
                      if (
                        data.summary.includes("{") &&
                        data.summary.includes("}")
                      ) {
                        const jsonStr = data.summary.substring(
                          data.summary.indexOf("{"),
                          data.summary.lastIndexOf("}") + 1,
                        );
                        parsedSummary = JSON.parse(jsonStr);
                      } else {
                        throw parseError;
                      }
                    }
                  } else {
                    parsedSummary = data.summary;
                  }

                  console.log("Parsed summary data:", parsedSummary);

                  // Create analysis data with proper fallbacks
                  const analysisData = {
                    title: parsedSummary.title || "Job Title",
                    company: parsedSummary.company || "Company Name",
                    requirements: Array.isArray(parsedSummary.requirements)
                      ? parsedSummary.requirements
                      : [],
                    responsibilities: Array.isArray(
                      parsedSummary.responsibilities,
                    )
                      ? parsedSummary.responsibilities
                      : [],
                    keywords: Array.isArray(parsedSummary.keywords)
                      ? parsedSummary.keywords
                      : [],
                    location: parsedSummary.location || "Location",
                    salary: parsedSummary.salary || "Salary Range",
                  };

                  console.log("Final analysis data:", analysisData);

                  localStorage.setItem(
                    "analysisData",
                    JSON.stringify(analysisData),
                  ); // reference this in resume critique

                  setAnalysisData(analysisData);
                  onAnalysisComplete(analysisData);
                } catch (e) {
                  console.error("Error processing summary data:", e);
                  // Log the raw data that caused the error
                  console.log("Raw summary data:", data.summary);

                  // Fallback to default values if parsing fails
                  const defaultData = {
                    title: "Job Title",
                    company: "Company Name",
                    requirements: [],
                    responsibilities: [],
                    keywords: [],
                    location: "Location",
                    salary: "Salary Range",
                  };
                  setAnalysisData(defaultData);
                  onAnalysisComplete(defaultData);
                }
              }
            }
          } catch (e) {
            console.error("Error parsing stream data:", e);
          }
        });

        // Handle errors
        eventSource.onerror = (err) => {
          console.error("EventSource error:", err);
          setError("Error connecting to server. Please try again.");
          eventSource.close();
          setIsAnalyzing(false);
        };
      } else if (inputMethod === "url") {
        // In a real implementation, this would call a backend API to scrape and analyze the URL
        // For now, we'll just use the mock data and show a message about future implementation
        console.log("URL to be scraped:", jobUrl);
      }
    } catch (err) {
      setError(
        `An error occurred while analyzing the job posting. Please try again. ${err}`,
      );
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    // Close any existing stream
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }

    setJobDescription("");
    setJobUrl("");
    setAnalysisComplete(false);
    setError(null);
    setStreamingOutput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-background">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Job Posting Analyzer
          </CardTitle>
          <CardDescription>
            Paste a job description below to extract key information and
            requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysisComplete ? (
            <div className="space-y-4">
              <Tabs
                defaultValue="text"
                className="w-full"
                onValueChange={(value) =>
                  setInputMethod(value as "text" | "url")
                }
                value={inputMethod}
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text">Paste Job Description</TabsTrigger>
                  <TabsTrigger value="url">Job Posting URL</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Paste the full job description here..."
                    className="min-h-[200px] p-4"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Enter the URL of the job posting. Our system will scrape
                      and analyze the content.
                    </p>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/job-posting"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        disabled={isAnalyzing}
                        className="flex-1"
                      />
                    </div>
                    {inputMethod === "url" && (
                      <Alert className="mt-4 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <AlertTitle>Web Scraping Feature</AlertTitle>
                        <AlertDescription>
                          The web scraping functionality will be implemented
                          soon. For now, you can test the interface.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* AI Thinking Stream Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">Show AI Thinking</span>
                </div>
                <Switch
                  checked={showStreaming}
                  onCheckedChange={setShowStreaming}
                  disabled={!isAnalyzing && streamingOutput === ""}
                />
              </div>

              {/* Streaming output */}
              {showStreaming && (isAnalyzing || streamingOutput) && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">AI Processing</span>
                    {isAnalyzing && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                    {streamingOutput || "Waiting for first response..."}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-semibold">{analysisData.title}</h3>
                <p className="text-muted-foreground">{analysisData.company}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-black">
                    {analysisData.location}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-black">
                    {analysisData.salary}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="requirements" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="responsibilities">
                    Responsibilities
                  </TabsTrigger>
                  <TabsTrigger value="keywords">Key Skills</TabsTrigger>
                </TabsList>

                <TabsContent value="requirements" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="requirements">
                          <AccordionTrigger>Job Requirements</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 space-y-2">
                              {(analysisData.requirements || []).map(
                                (req, index) => (
                                  <li key={index}>{req}</li>
                                ),
                              )}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="responsibilities" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="responsibilities">
                          <AccordionTrigger>
                            Job Responsibilities
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 space-y-2">
                              {(analysisData.responsibilities || []).map(
                                (resp, index) => (
                                  <li key={index}>{resp}</li>
                                ),
                              )}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="keywords" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Key Skills & Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.keywords || []).map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-slate-700 dark:border-slate-600">
                <CheckCircle className="h-4 w-4 text-black dark:text-white" />
                <AlertTitle className="text-slate-700 dark:text-white">
                  Analysis Complete
                </AlertTitle>
                <AlertDescription className="text-slate-700 dark:text-slate-300">
                  We've extracted the key information from this job posting. You
                  can now use this to tailor your resume.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!analysisComplete ? (
            <>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isAnalyzing || !jobDescription}
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isAnalyzing ||
                  (inputMethod === "text" ? !jobDescription : !jobUrl)
                }
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Job Posting"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClear}>
                Analyze Another Job
              </Button>
              <Button>Save Analysis</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default JobPostingAnalyzer;
