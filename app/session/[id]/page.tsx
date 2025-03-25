'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import * as yaml from 'js-yaml';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Session } from '@/lib/types';
import defaultCV from '@/lib/defaultCV';
import { AlertCircle, FileDown, RefreshCw, Share2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const themes = [
  { id: 'default', name: 'Default Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-default' },
  { id: 'basic', name: 'Basic Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-basic' }
];

export default function SessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [cv, setCV] = useState(defaultCV);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [renderHtml, setRenderHtml] = useState<string | null>(null);
  const [yamlValid, setYamlValid] = useState(true);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentYamlRef = useRef(defaultCV);

  // Load session data when component mounts
  useEffect(() => {
    if (!id) return;
    
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Session Not Found",
              description: "This session no longer exists or was never created.",
              variant: "destructive",
            });
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch session');
        }
        
        const sessionData = await response.json();
        setSession(sessionData);
        setCV(sessionData.cvContent);
        currentYamlRef.current = sessionData.cvContent;
        setSelectedTheme(sessionData.selectedTheme);
        setIsLoading(false);
        
        // Generate preview for the initial load
        const isValid = validateYaml(sessionData.cvContent);
        if (isValid) {
          generatePreview(sessionData.cvContent, sessionData.selectedTheme);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchSession();
  }, [id, router, toast]);

  // Update session when YAML or theme changes
  const updateSessionData = async (updates: { cvContent?: string; selectedTheme?: string }) => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update session');
      }
      
      const updatedSession = await response.json();
      setSession(updatedSession);
      
      // Show toast notification
      toast({
        title: "Session Updated",
        description: "Your CV changes have been saved.",
      });
    } catch (err) {
      console.error('Error updating session:', err);
      toast({
        title: "Update Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate the CV preview using the API
  const generatePreview = async (yamlContent: string, theme: string) => {
    if (!yamlValid) {
      setApiError("Cannot generate preview with invalid YAML");
      return;
    }
    
    try {
      setIsGenerating(true);
      setApiError(null);
      
      // Check if yamlContent is valid before sending
      if (!yamlContent || yamlContent.trim() === '') {
        throw new Error("Cannot generate preview with empty YAML content");
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv: yamlContent,
          theme,
          format: 'html',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.message || 'Failed to generate preview';
        throw new Error(errorMsg);
      }

      const htmlContent = await response.text();
      setRenderHtml(htmlContent);
    } catch (err) {
      console.error('Error generating preview:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to generate preview');
      // Keep the previous render if there was an error
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual refresh function for the preview
  const handleRefreshPreview = () => {
    // Check YAML validity before refreshing
    const isValid = validateYaml(currentYamlRef.current);
    if (!isValid) {
      setApiError("Cannot refresh with invalid YAML");
      return;
    }
    
    // Clear any previous errors
    setApiError(null);
    
    // Generate preview with current YAML and selected theme
    generatePreview(currentYamlRef.current, selectedTheme);
  };

  // Effect to update the iframe content when renderHtml changes
  useEffect(() => {
    if (renderHtml && previewFrameRef.current) {
      const iframe = previewFrameRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(renderHtml);
        iframeDoc.close();
      }
    }
  }, [renderHtml]);

  // When theme changes, regenerate the preview and update the session
  useEffect(() => {
    if (isLoading) return;
    
    // Validate YAML before regenerating preview on theme change
    const isValid = validateYaml(currentYamlRef.current);
    if (isValid) {
      generatePreview(currentYamlRef.current, selectedTheme);
      
      // Update the session with the new theme
      updateSessionData({ selectedTheme });
    } else {
      // If not valid, set an appropriate error without attempting generation
      setApiError("Cannot generate preview with invalid YAML");
    }
  }, [selectedTheme, isLoading]);

  const validateYaml = (value: string): boolean => {
    try {
      if (!value || value.trim() === '') {
        return false;
      }
      yaml.load(value);
      return true;
    } catch (e) {
      console.error('YAML validation error:', e);
      return false;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    // Update the editor content immediately
    setCV(value);
    currentYamlRef.current = value;
    
    // Check if the YAML is valid
    const isValid = validateYaml(value);
    setYamlValid(isValid);
    
    if (isValid) {
      setError(null);
      
      // Clear any previous timeout
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new timeout to update after user stops typing
      debounceTimerRef.current = setTimeout(() => {
        generatePreview(value, selectedTheme);
        updateSessionData({ cvContent: value });
      }, 1000);
    } else {
      setError('Invalid YAML format');
    }
  };

  // Function to share the session URL
  const handleShareSession = () => {
    if (!id) return;
    
    const url = `${window.location.origin}/session/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "URL Copied",
        description: "The session URL has been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL. Please try again.",
        variant: "destructive",
      });
    });
  };

  // Function to download the CV as PDF
  const handleDownloadPDF = async () => {
    if (!yamlValid) {
      setApiError("Cannot download with invalid YAML");
      return;
    }
    
    try {
      setIsGenerating(true);
      setApiError(null);
      
      // Generate and download the PDF
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv: currentYamlRef.current,
          theme: selectedTheme,
          format: 'pdf',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.message || 'Failed to generate PDF';
        throw new Error(errorMsg);
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Your CV has been downloaded as a PDF.",
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to generate PDF');
      
      toast({
        title: "PDF Generation Failed",
        description: err instanceof Error ? err.message : 'Failed to generate PDF',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Session...</h1>
          <p>Please wait while we load your CV session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4 bg-background">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">CV Editor Session</h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleShareSession}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>
      
      {apiError && (
        <Alert variant="destructive" className="mx-4 my-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="p-2 border-b bg-muted/50 flex justify-between items-center">
            <h2 className="text-sm font-medium">CV Content (YAML)</h2>
            {error && (
              <div className="text-red-500 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              value={cv}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
        
        <div className="flex flex-col h-full border-l">
          <div className="p-2 border-b bg-muted/50 flex justify-between items-center">
            <h2 className="text-sm font-medium">
              Preview ({themes.find(t => t.id === selectedTheme)?.name})
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshPreview}
              disabled={isGenerating || !yamlValid}
              className="flex items-center text-xs gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex-1 relative overflow-auto">
            <iframe
              ref={previewFrameRef}
              title="CV Preview"
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}