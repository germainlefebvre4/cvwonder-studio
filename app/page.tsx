'use client';

import { useState, useEffect, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileJson, Download, FileDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import yaml from 'js-yaml';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

const defaultCV = `# CV Wonder YAML Format
basics:
  name: "John Smith"
  title: "Senior Software Engineer"
  email: "john.smith@email.com"
  phone: "+1 234 567 890"
  summary: "Experienced software engineer with a strong background in cloud technologies and distributed systems."
  location:
    address: "123 Tech Street"
    postalCode: "12345"
    city: "San Francisco"
    countryCode: "US"
    region: "California"
  profiles:
    - network: "LinkedIn"
      url: "https://linkedin.com/in/johnsmith"
    - network: "GitHub"
      url: "https://github.com/johnsmith"

work:
  - company: "Tech Corp"
    position: "Senior Software Engineer"
    startDate: "2020-01"
    endDate: "Present"
    summary: "Lead developer for cloud-native applications"
    highlights:
      - "Architected and implemented microservices architecture"
      - "Reduced system latency by 40%"
      - "Mentored junior developers"

education:
  - institution: "University of Technology"
    area: "Computer Science"
    studyType: "Bachelor"
    startDate: "2012-09"
    endDate: "2016-06"
    gpa: "3.8"

skills:
  - name: "Programming Languages"
    level: "Advanced"
    keywords:
      - "Python"
      - "JavaScript"
      - "Go"
  - name: "Cloud Technologies"
    level: "Expert"
    keywords:
      - "AWS"
      - "Docker"
      - "Kubernetes"

languages:
  - language: "English"
    fluency: "Native"
  - language: "Spanish"
    fluency: "Professional"

interests:
  - name: "Open Source"
    keywords:
      - "Contributing to community projects"
      - "Building developer tools"
`;

const themes = [
  { id: 'default', name: 'Default Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-default' },
  { id: 'basic', name: 'Basic Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-basic' }
];

export default function Home() {
  const [cv, setCV] = useState(defaultCV);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderHtml, setRenderHtml] = useState<string | null>(null);
  const [yamlValid, setYamlValid] = useState(true);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentYamlRef = useRef(defaultCV);

  // Generate the CV preview using the API
  const generatePreview = async (yamlContent: string, theme: string) => {
    if (!yamlValid) {
      setApiError("Cannot generate preview with invalid YAML");
      return;
    }
    
    try {
      setIsGenerating(true);
      setApiError(null);
      
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

  // Generate preview when component mounts
  useEffect(() => {
    generatePreview(cv, selectedTheme);
  }, []);

  // When theme changes, regenerate the preview
  useEffect(() => {
    generatePreview(currentYamlRef.current, selectedTheme);
  }, [selectedTheme]);

  const validateYaml = (value: string): boolean => {
    try {
      yaml.load(value);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    // Store current YAML in the ref for immediate access
    currentYamlRef.current = value;
    
    // Validate YAML
    const isValid = validateYaml(value);
    setYamlValid(isValid);
    
    if (isValid) {
      setCV(value);
      setError(null);
      
      // Debounce the preview generation to avoid too many requests
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        generatePreview(value, selectedTheme);
      }, 1000); // 1 second debounce
    } else {
      setError('Invalid YAML format');
    }
  };

  const handleDownload = async (format: 'yaml' | 'pdf') => {
    if (format === 'yaml') {
      const blob = new Blob([cv], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.yml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      try {
        setIsGenerating(true);
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv,
            theme: selectedTheme,
            format: 'pdf',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cv.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error generating PDF:', err);
        setError('Failed to generate PDF');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJson className="h-6 w-6" />
            <h1 className="text-xl font-bold">CV Wonder</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('yaml')}
                className="flex items-center space-x-1"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4" />
                <span>Download YAML</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDownload('pdf')}
                className="flex items-center space-x-1"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate PDF'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {apiError && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-muted/50">
              <h2 className="text-sm font-medium">YAML Editor</h2>
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                defaultLanguage="yaml"
                value={cv}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderValidationDecorations: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-muted/50 flex justify-between items-center">
              <h2 className="text-sm font-medium">
                Preview ({themes.find(t => t.id === selectedTheme)?.name})
              </h2>
              {isGenerating && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Rendering...
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 h-full">
                {renderHtml ? (
                  <iframe 
                    ref={previewFrameRef}
                    className="w-full h-full min-h-[800px] border-0"
                    title="CV Preview"
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}