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
  FileSpreadsheet,
  Download,
  Save,
  HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// AI Models configuration - matches backend AI_MODELS
interface AIModel {
  id: string;
  name: string;
  inputPrice: string;
  outputPrice: string;
  description: string;
}

const aiModels: AIModel[] = [
  {
    id: "mistralai/mixtral-8x7b-instruct",
    name: "Mixtral 8x7B (Free)",
    inputPrice: "$0.00/M tokens",
    outputPrice: "$0.00/M tokens", 
    description: "Free, powerful open-source model"
  },
  {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini Flash Lite",
    inputPrice: "$0.075/M tokens",
    outputPrice: "$0.30/M tokens",
    description: "Fast processing with good accuracy"
  },
  {
    id: "google/gemini-2.0-pro-001",
    name: "Gemini Pro",
    inputPrice: "$0.25/M tokens",
    outputPrice: "$0.75/M tokens", 
    description: "High accuracy with detailed analysis"
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    inputPrice: "$3.00/M tokens",
    outputPrice: "$15.00/M tokens",
    description: "Advanced analysis with excellent detail"
  }
];

interface JobPostingAnalyzerProps {
  onAnalysisComplete?: (analysisData: JobAnalysisData) => void;
  initialJobDescription?: string;
  onSaveDescription?: (description: string) => void;
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
  onAnalysisComplete = () => {}, // functions are passed in as props
  initialJobDescription = "",
  onSaveDescription = () => {},
}: JobPostingAnalyzerProps) => {
  const [inputMethod, setInputMethod] = useState<"text" | "url">("text");
  const [jobDescription, setJobDescription] = useState(
    initialJobDescription || "",
  );
  const [jobUrl, setJobUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStreaming, setShowStreaming] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");
  const streamRef = useRef<EventSource | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(aiModels[0].id);
  const [analysisData, setAnalysisData] = useState<JobAnalysisData>({
    title: "",
    company: "",
    requirements: [],
    responsibilities: [],
    keywords: [],
    location: "",
    salary: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [jobSaved, setJobSaved] = useState(false);

  // Initialize from props if available
  useEffect(() => {
    if (initialJobDescription) {
      setJobDescription(initialJobDescription);
    }
  }, [initialJobDescription]);

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

    // Save the description when submitting
    if (inputMethod === "text") {
      onSaveDescription(jobDescription);
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

        // Set up server-sent events for streaming with model parameter
        const eventSource = new EventSource(
          `http://localhost:5317/analyze_job_posting?description=${encodeURIComponent(jobDescription)}&model=${encodeURIComponent(selectedModel)}`,
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
        // Call the web scraping API with selected model
        console.log("URL to be scraped:", jobUrl);

        try {
          setStreamingOutput("Starting scraping process...\n");

          const response = await fetch("http://localhost:5317/scrape_job_url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              url: jobUrl,
              model: selectedModel 
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to scrape job posting");
          }

          setStreamingOutput(
            (prev) =>
              prev +
              "Job posting scraped successfully!\nAnalyzing content...\n",
          );

          const data = await response.json();
          console.log("Scraped job data:", data);

          // Create analysis data from scraped data
          const scrapedData = {
            title: data.title || "Job Title",
            company: data.company || "Company Name",
            requirements: Array.isArray(data.requirements)
              ? data.requirements
              : [],
            responsibilities: Array.isArray(data.responsibilities)
              ? data.responsibilities
              : [],
            keywords: Array.isArray(data.keywords) ? data.keywords : [],
            location: data.location || "Location",
            salary: data.salary || "Salary Range",
          };

          // Save the scraped job description
          if (data.description) {
            setJobDescription(data.description);
            onSaveDescription(data.description);
          }

          console.log("Final scraped analysis data:", scrapedData);

          localStorage.setItem("analysisData", JSON.stringify(scrapedData));

          setAnalysisData(scrapedData);
          setAnalysisComplete(true);
          setIsAnalyzing(false);
          onAnalysisComplete(scrapedData);
        } catch (err) {
          console.error("Error scraping URL:", err);
          setError(`Failed to scrape job URL: ${err}`);
          setIsAnalyzing(false);
        }
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

  const handleSaveJob = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("http://localhost:5317/save_job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...analysisData,
          description: jobDescription,
          url: jobUrl || "Manually entered",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save job data");
      }

      const result = await response.json();
      setJobSaved(true);
      toast({
        title: "Success!",
        description: "Job saved successfully and is available for export.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error!",
        description: "Failed to save job data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // First, ensure the job is saved
      if (!jobSaved) {
        await handleSaveJob();
      }

      // Open the export URL in a new tab or trigger download
      window.open("http://localhost:5317/export_excel", "_blank");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Failed",
        description: "Could not export to Excel. Please try again.",
        variant: "destructive",
      });
    }
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
              {/* AI Model Selection Dropdown */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Select AI Model</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md p-4">
                        <p className="font-semibold mb-2">AI Model Selection</p>
                        <p className="mb-2">Choose which AI model will analyze your job description.</p>
                        <ul className="text-xs space-y-1">
                          <li><span className="font-medium">Mixtral 8x7B:</span> Free model, powerful open-source</li>
                          <li><span className="font-medium">Gemini Flash Lite:</span> $0.075/M input + $0.30/M output</li>
                          <li><span className="font-medium">Gemini Pro:</span> Premium model for detailed analysis</li>
                          <li><span className="font-medium">Claude 3.5:</span> Most expensive but highest quality</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Models</SelectLabel>
                      {aiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {aiModels.map((model) => (
                    model.id === selectedModel && (
                      <div key={model.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{model.name}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{model.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-md text-center dark:bg-blue-900 dark:text-blue-100">
                            Input: {model.inputPrice}
                          </div>
                          <div className="p-1.5 bg-green-100 text-green-800 rounded-md text-center dark:bg-green-900 dark:text-green-100">
                            Output: {model.outputPrice}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  <div className="col-span-1 md:col-span-2 text-xs text-muted-foreground italic mt-1">
                    Typical job analysis costs: $0.00 with free model or $0.01-$0.10 with paid models.
                  </div>
                </div>
              </div>

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
                    <p className="mb-2 text-sm text-muted-foreground">
                      Enter the URL of the job posting. Our system will scrape
                      and analyze the content.
                    </p>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/job-posting"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        disabled={isAnalyzing}
                        className="flex-1"
                      />
                    </div>
                    {inputMethod === "url" && (
                      <Alert className="mt-4 text-black border-blue-200 bg-blue-50">
                        <AlertCircle className="w-4 h-4 text-blue-500 dark:text-black" />
                        <AlertTitle>Web Scraping Available</AlertTitle>
                        <AlertDescription>
                          Enter a job posting URL from LinkedIn, Indeed, or
                          other major job sites. Our system will attempt to
                          scrape and analyze the content automatically.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* AI Thinking Stream Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-slate-500" />
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
                <div className="p-3 mt-4 border rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">AI Processing</span>
                    {isAnalyzing && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                  </div>
                  <div className="font-mono text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
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
                  <Badge variant="outline" className="text-black bg-blue-50">
                    {analysisData.location}
                  </Badge>
                  <Badge variant="outline" className="text-black bg-green-50">
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
                            <ul className="pl-5 space-y-2 list-disc">
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
                            <ul className="pl-5 space-y-2 list-disc">
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
                      <h3 className="mb-4 text-lg font-medium">
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

              <Alert className="border-blue-200 bg-blue-50 dark:bg-slate-700 dark:border-slate-600">
                <CheckCircle className="w-4 h-4 text-black dark:text-white" />
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveJob}
                  disabled={isSaving || jobSaved}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : jobSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Job
                    </>
                  )}
                </Button>
                <Button onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default JobPostingAnalyzer;
