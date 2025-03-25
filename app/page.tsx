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
import defaultCV from '@/lib/defaultCV';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

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
            <h1 className="text-xl font-bold">CV Wonder Online</h1>
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
            <div className="p-3 border-b bg-muted/50 flex justify-between items-center">
              <h2 className="text-sm font-medium">YAML Editor</h2>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshPreview}
                disabled={isGenerating}
                className="flex items-center text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            <div className="flex-1 relative overflow-auto">
              {renderHtml ? (
                <iframe 
                  ref={previewFrameRef}
                  className="absolute inset-0 w-full h-full border-0"
                  title="CV Preview"
                  style={{ height: '100%', width: '100%' }}
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}