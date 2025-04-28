import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileUp,
  Download,
  CornerDownLeft,
  Lightbulb,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Save
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { 
  parseResumeFile, 
  generateSuggestions, 
  exportResume, 
  downloadBlob,
  Suggestion as SuggestionType
} from '@/services/resumeEditorService';

interface ResumeEditorProps {
  jobData?: any;
  aiSuggestions?: boolean;
}

// This component provides a WYSIWYG resume editor with AI suggestions
const ResumeEditor: React.FC<ResumeEditorProps> = ({ 
  jobData,
  aiSuggestions = true
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<SuggestionType[]>([]);
  const [currentSection, setCurrentSection] = useState('all');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialHtml, setInitialHtml] = useState<string>("");

  
  useEffect(() => {
    if (documentLoaded && initialHtml && editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [documentLoaded, initialHtml]);
  
  // Load job data from localStorage if not provided as prop
  useEffect(() => {
    if (!jobData) {
      try {
        const savedData = localStorage.getItem("analysisData");
        if (savedData) {
          // Use the saved job data for suggestions
          const parsedJobData = JSON.parse(savedData);
          if (parsedJobData) {
            jobData = parsedJobData;
          }
        }
      } catch (e) {
        console.error("Error loading saved job data:", e);
      }
    }
  }, [jobData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("looking at uploading file")
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Only allow DOCX files
    if (!file.name.endsWith('.docx')) {
      setError('Please upload a valid DOCX file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Call the backend API to parse the DOCX file

      console.log("parsing")
      const result = await parseResumeFile(file);
      console.log("the result", result.html)
      
    
      // Set the parsed HTML content to the editor

      setInitialHtml(result.html)      
    
      setDocumentLoaded(true)
      // Generate suggestions if AI suggestions are enabled
      if (aiSuggestions) {
        await fetchSuggestions();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const fetchSuggestions = async () => {
    if (!editorRef.current || !aiSuggestions) return;
    
    setIsGeneratingSuggestions(true);

    
    try {
      // Get the HTML content from the editor
      const resumeHtml = editorRef.current.innerHTML;
      
      // Call the backend API to generate suggestions
      const result = await generateSuggestions(resumeHtml, jobData);
      
      // Set the suggestions
      setActiveSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError(`Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };
  
  const triggerFileUpload = () => {
    console.log("Button clicked");
    console.log("fileInputRef exists:", !!fileInputRef.current);
    fileInputRef.current?.click();
    console.log("After click attempt");
  };
  
  const handleSuggestionAction = (id: number, accept: boolean) => {
    setActiveSuggestions(prevSuggestions => 
      prevSuggestions.map(suggestion => 
        suggestion.id === id 
          ? { ...suggestion, applied: accept, dismissed: !accept } 
          : suggestion
      )
    );
    
    // Apply the suggestion to the editor content if accepted
    if (accept && editorRef.current) {
      const suggestion = activeSuggestions.find(s => s.id === id);
      if (suggestion) {
        // In a real implementation, we would use more sophisticated logic
        // to locate and replace the text in the editor
        // This is a simplified example that uses basic search and replace
        const content = editorRef.current.innerHTML;
        // Simple search and replace - in a real implementation this would be more sophisticated
        if (content.includes(suggestion.original)) {
          editorRef.current.innerHTML = content.replace(
            suggestion.original,
            `<span style="background-color: rgba(34, 197, 94, 0.1); padding: 2px 0;">${suggestion.suggestion}</span>`
          );
        }
      }
    }
  };
  
  const handleExportResume = async (format: 'docx' | 'pdf') => {
    if (!editorRef.current) return;
    
    try {
      setError(null);
      const resumeHtml = editorRef.current.innerHTML;
      
      // Call the backend API to export the resume
      const blob = await exportResume(resumeHtml, format);
      
      // Download the file
      downloadBlob(blob, `resume.${format}`);
    } catch (error) {
      console.error(`Error exporting as ${format.toUpperCase()}:`, error);
      setError(`Failed to export as ${format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className={cn(
      "h-auto transition-all duration-200",
      fullScreenMode ? "fixed inset-0 z-50 bg-white dark:bg-slate-900 p-4" : ""
    )}>
      <Card className={cn(
        "border shadow-sm",
        fullScreenMode ? "h-full" : "h-[calc(100vh-220px)] min-h-[600px]"
      )}>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resume Editor</CardTitle>
              <CardDescription>
                Edit your resume with AI-powered suggestions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullScreenMode(!fullScreenMode)}
              >
                {fullScreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                console.log("Direct button click");
                fileInputRef.current?.click();
              }}>
                <FileUp className="w-4 h-4 mr-2" />
                Upload DOCX
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".docx"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-130px)]">
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <p className="mb-3 text-slate-600 dark:text-slate-300">
                Processing resume...
              </p>
              <Progress value={45} className="w-1/2 h-2 mb-4" />
            </div>
          ) : !documentLoaded ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <FileUp className="w-16 h-16 mb-4 text-slate-400" />
              <h3 className="mb-2 text-xl font-medium text-slate-700 dark:text-slate-200">
                Upload Your Resume
              </h3>
              <p className="max-w-md mb-6 text-center text-slate-600 dark:text-slate-300">
                Upload a DOCX file to get started. We'll preserve your formatting
                and allow you to edit with AI suggestions.
              </p>
              <Button onClick={triggerFileUpload}>
                <FileUp className="w-4 h-4 mr-2" />
                Upload DOCX
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full md:flex-row">
              {/* Editor Area */}
              <div className="flex-grow h-full overflow-hidden border-r">
                <div className="flex items-center justify-between p-2 border-b bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-slate-700">
                      Editing
                    </Badge>
                    {aiSuggestions && activeSuggestions.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                        {activeSuggestions.filter(s => !s.applied && !s.dismissed).length} Suggestions
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={fetchSuggestions} disabled={isGeneratingSuggestions}>
                      <Lightbulb className="w-4 h-4 mr-1" /> 
                      {isGeneratingSuggestions ? 'Generating...' : 'Get Suggestions'}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleExportResume('docx')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export as DOCX</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleExportResume('pdf')}
                          >
                            <span className="text-xs font-bold">PDF</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export as PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div 
                  ref={editorRef}
                  className="h-[calc(100%-40px)] overflow-auto p-6 focus:outline-none"
                  contentEditable
                  suppressContentEditableWarning={true}
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    backgroundColor: 'white',
                    color: '#333'
                  }}
                />
              </div>
              
              {/* Suggestions Panel */}
              {aiSuggestions && (
                <div className="w-full overflow-hidden border-t md:w-80 h-80 md:h-full md:border-t-0">
                  <div className="p-2 border-b bg-slate-50 dark:bg-slate-800">
                    <h3 className="flex items-center font-medium">
                      <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                      AI Suggestions
                    </h3>
                  </div>
                  <Tabs defaultValue="all" value={currentSection} onValueChange={setCurrentSection}>
                    <div className="px-2 pt-2">
                      <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                        <TabsTrigger value="experience" className="flex-1">Experience</TabsTrigger>
                        <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="all" className="m-0 h-[calc(100%-80px)] overflow-auto">
                      <div className="p-2 space-y-2">
                        {isGeneratingSuggestions ? (
                          <div className="p-4 text-center">
                            <p className="mb-3 text-slate-600 dark:text-slate-300">
                              Generating suggestions...
                            </p>
                            <Progress value={45} className="h-2 mb-4" />
                          </div>
                        ) : activeSuggestions.filter(s => !s.applied && !s.dismissed).length > 0 ? (
                          activeSuggestions
                            .filter(s => !s.applied && !s.dismissed)
                            .map(suggestion => (
                              <SuggestionCard 
                                key={suggestion.id} 
                                suggestion={suggestion} 
                                onAction={handleSuggestionAction} 
                              />
                            ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No active suggestions. Click "Get Suggestions" to analyze your resume.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="experience" className="m-0 h-[calc(100%-80px)] overflow-auto">
                      <div className="p-2 space-y-2">
                        {isGeneratingSuggestions ? (
                          <div className="p-4 text-center">
                            <p className="mb-3 text-slate-600 dark:text-slate-300">
                              Generating suggestions...
                            </p>
                            <Progress value={45} className="h-2 mb-4" />
                          </div>
                        ) : activeSuggestions.filter(s => s.section === 'experience' && !s.applied && !s.dismissed).length > 0 ? (
                          activeSuggestions
                            .filter(s => s.section === 'experience' && !s.applied && !s.dismissed)
                            .map(suggestion => (
                              <SuggestionCard 
                                key={suggestion.id} 
                                suggestion={suggestion} 
                                onAction={handleSuggestionAction} 
                              />
                            ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No experience suggestions available.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="skills" className="m-0 h-[calc(100%-80px)] overflow-auto">
                      <div className="p-2 space-y-2">
                        {isGeneratingSuggestions ? (
                          <div className="p-4 text-center">
                            <p className="mb-3 text-slate-600 dark:text-slate-300">
                              Generating suggestions...
                            </p>
                            <Progress value={45} className="h-2 mb-4" />
                          </div>
                        ) : activeSuggestions.filter(s => s.section === 'skills' && !s.applied && !s.dismissed).length > 0 ? (
                          activeSuggestions
                            .filter(s => s.section === 'skills' && !s.applied && !s.dismissed)
                            .map(suggestion => (
                              <SuggestionCard 
                                key={suggestion.id} 
                                suggestion={suggestion} 
                                onAction={handleSuggestionAction} 
                              />
                            ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No skills suggestions available.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between p-3 border-t bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {documentLoaded ? "Resume loaded successfully" : "No resume loaded"}
          </div>
          {documentLoaded && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDocumentLoaded(false)}>
                New Resume
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

// Suggestion Card Component
interface SuggestionCardProps {
  suggestion: SuggestionType;
  onAction: (id: number, accept: boolean) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onAction }) => {
  return (
    <div className="p-3 bg-white border rounded-md shadow-sm dark:bg-slate-800">
      <div className="flex items-start justify-between mb-2">
        <Badge 
          className={cn(
            suggestion.type === 'improvement' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' :
            suggestion.type === 'keyword' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' :
            'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
          )}
        >
          {suggestion.type === 'improvement' ? 'Improvement' :
           suggestion.type === 'keyword' ? 'Missing Keyword' : 'Achievement'}
        </Badge>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {suggestion.section}
        </span>
      </div>
      
      <div className="mb-2">
        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Original:</div>
        <p className="text-sm line-through text-slate-700 dark:text-slate-300">
          {suggestion.original}
        </p>
      </div>
      
      <div className="mb-3">
        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Suggestion:</div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {suggestion.suggestion}
        </p>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
          onClick={() => onAction(suggestion.id, false)}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800 hover:border-green-300"
          onClick={() => onAction(suggestion.id, true)}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept
        </Button>
      </div>
    </div>
  );
};

export default ResumeEditor; 