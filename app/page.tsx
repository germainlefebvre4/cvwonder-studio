'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, FileJson, Plus, Github, FileText, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import defaultCV from '@/lib/defaultCV';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import yaml from 'js-yaml';

const themes = [
  { id: 'default', name: 'Default Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-default' },
  { id: 'basic', name: 'Basic Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-basic' }
];

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  // Function to create a new session
  const createNewSession = async () => {
    try {
      setIsCreatingSession(true);
      
      // Call the API to create a new session with defaultCV
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialContent: defaultCV,
          theme: selectedTheme,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const session = await response.json();
      
      // Navigate to the new session page
      router.push(`/session/${session.id}`);
      
      toast({
        title: "Session Created",
        description: "Your CV editing session has been created.",
      });
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        title: "Session Creation Failed",
        description: "Failed to create a new session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJson className="h-8 w-8" />
            <h1 className="text-2xl font-bold">CV Wonder Online</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="https://cvwonder.readthedocs.io/" target="_blank" className="text-white hover:text-blue-200 transition">
              <FileText className="h-5 w-5 inline mr-1" />
              <span>Docs</span>
            </Link>
            <Link href="https://github.com/germainlefebvre4/cvwonder" target="_blank" className="text-white hover:text-blue-200 transition">
              <Github className="h-5 w-5 inline mr-1" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Create Professional CVs <span className="text-blue-600">Effortlessly</span>
              </h1>
              <p className="text-xl text-gray-600">
                CV Wonder transforms your YAML data into beautifully formatted resumes ready to impress employers.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <div>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
                </div>
                <Button
                  size="lg"
                  onClick={createNewSession}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isCreatingSession}
                >
                  {isCreatingSession ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>{isCreatingSession ? 'Creating...' : 'Create Your CV Now'}</span>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white rounded-lg shadow-2xl p-2 transform rotate-2">
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="ml-2 text-sm text-gray-600">CV Wonder Editor</div>
                    </div>
                  </div>
                  <div className="p-4 text-sm font-mono text-gray-800 bg-gray-50">
                    <pre className="whitespace-pre-wrap">
{`name: John Doe
title: Senior Software Engineer
contact:
  email: john.doe@example.com
  phone: +1 (123) 456-7890
summary: >
  Experienced developer with a passion 
  for building elegant solutions.`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose CV Wonder?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Simple YAML Format</h3>
                <p className="text-gray-600">
                  Write your CV in a clean, structured YAML format that's easy to maintain and version control.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Beautiful Themes</h3>
                <p className="text-gray-600">
                  Choose from multiple professionally designed themes to make your CV stand out from the crowd.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Export Options</h3>
                <p className="text-gray-600">
                  Generate your CV in PDF format ready to share with potential employers or download in YAML format.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Create a Session</h3>
                <p className="text-gray-600">
                  Start a new CV session with our simple editor interface.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Edit Your CV</h3>
                <p className="text-gray-600">
                  Add your personal details, work experience, education, and skills in YAML format.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Generate & Share</h3>
                <p className="text-gray-600">
                  Export your CV as a styled PDF ready to send to employers.
                </p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Button
                size="lg"
                onClick={createNewSession}
                className="flex items-center space-x-2 mx-auto bg-blue-600 hover:bg-blue-700"
                disabled={isCreatingSession}
              >
                {isCreatingSession ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>{isCreatingSession ? 'Creating...' : 'Start Building Your CV'}</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FileJson className="h-6 w-6" />
              <h2 className="text-xl font-bold">CV Wonder</h2>
            </div>
            <div className="flex space-x-6">
              <Link href="https://github.com/germainlefebvre4/cvwonder" target="_blank" className="text-gray-300 hover:text-white transition">
                <Github className="h-5 w-5 inline mr-1" />
                <span>GitHub</span>
              </Link>
              <Link href="https://cvwonder.readthedocs.io/" target="_blank" className="text-gray-300 hover:text-white transition">
                <FileText className="h-5 w-5 inline mr-1" />
                <span>Documentation</span>
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} CV Wonder. All rights reserved.
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}