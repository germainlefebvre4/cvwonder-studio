'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, FileJson, Plus, Github, FileText, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import defaultCV from '@/lib/defaultCV';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const themes = [
  { id: 'default', name: 'Default Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-default' },
  // { id: 'basic', name: 'Basic Theme', url: 'https://github.com/germainlefebvre4/cvwonder-theme-basic' }
];

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  const createNewSession = async () => {
    try {
      setIsCreatingSession(true);
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
    <div className="min-h-screen flex flex-col gradient-mesh scroll-enabled">
      {/* Modern Navbar */}
      <header className="border-b bg-white/70 backdrop-blur-md supports-backdrop-blur:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <FileJson className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CV Wonder Studio
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="https://cvwonder.readthedocs.io/" target="_blank" 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition">
              <FileText className="h-5 w-5" />
              <span>Docs</span>
            </Link>
            <Link href="https://github.com/germainlefebvre4/cvwonder" target="_blank"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition">
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 main-landing">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-8 animate-fade-in">
              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600">
                <Sparkles className="h-4 w-4 mr-1" />
                Create professional CVs in minutes
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Transform Your <span className="hero-text-gradient">Career Story</span> into a Masterpiece
              </h1>
              <p className="text-xl text-gray-600">
                CV Wonder transforms your YAML data into beautifully formatted resumes that capture attention and showcase your professional journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={selectedTheme} 
                  onValueChange={(value) => {
                    setSelectedTheme(value);
                  }}
                  defaultValue="default"
                >
                  <SelectTrigger className="w-full sm:w-[180px] z-50">
                    <SelectValue>
                      {themes.find(theme => theme.id === selectedTheme)?.name || "Select theme"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-50 bg-white">
                    {themes.map(theme => (
                      <SelectItem
                        key={theme.id}
                        value={theme.id}
                        className="cursor-pointer hover:bg-blue-50"
                      >
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="lg"
                  onClick={createNewSession}
                  className="btn-modern bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isCreatingSession}
                >
                  {isCreatingSession ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-5 w-5 mr-2" />
                  )}
                  <span>{isCreatingSession ? 'Creating...' : 'Create Your CV'}</span>
                  {!isCreatingSession && <ArrowRight className="h-5 w-5 ml-2" />}
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 animate-float">
              <div className="code-window transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="code-window-header">
                  <div className="code-dot bg-red-500"></div>
                  <div className="code-dot bg-yellow-500"></div>
                  <div className="code-dot bg-green-500"></div>
                  <span className="ml-2 text-gray-400 text-sm">cv.yml</span>
                </div>
                <div className="code-content">
                  <pre className="whitespace-pre-wrap">
{`person:
  name: Germain
  profession: Bâtisseur de Plateformes et de Nuages
  citizenship: FR
  location: Lille
  site: http://germainlefebvre.fr

career:
  - companyName: Zatsit
    companyLogo: images/zatsit-logo.webp
    duration: 10 mois
    missions:
      - position: Platform Engineer
        company: Adeo
        location: Ronchin, France
        dates: 2024, mars - 2024, décembre
        summary: Construire une IDP managée.

technicalSkills:
  domains:
    - name: Cloud
      competencies:
        - name: AWS
          level: 80
        - name: GCP
          level: 70`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="hero-text-gradient">CV Wonder</span>?
              </h2>
              <p className="text-xl text-gray-600">
                Create, customize, and export your professional CV with ease
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="feature-card p-6 animate-slide-in" style={{ animationDelay: '0ms' }}>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Simple YAML Format</h3>
                <p className="text-gray-600">
                  Write your CV in a clean, structured YAML format that's easy to maintain and version control.
                </p>
              </div>
              
              <div className="feature-card p-6 animate-slide-in" style={{ animationDelay: '150ms' }}>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Beautiful Themes</h3>
                <p className="text-gray-600">
                  Choose from multiple professionally designed themes to make your CV stand out from the crowd.
                </p>
              </div>
              
              <div className="feature-card p-6 animate-slide-in" style={{ animationDelay: '300ms' }}>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Export Options</h3>
                <p className="text-gray-600">
                  Generate your CV in PDF format ready to share with potential employers or download in YAML format.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Three Simple <span className="hero-text-gradient">Steps</span>
              </h2>
              <p className="text-xl text-gray-600">
                Get your professional CV ready in minutes
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Create Session',
                  description: 'Start a new CV session with our simple editor interface.',
                  delay: '0ms'
                },
                {
                  step: '2',
                  title: 'Edit Your CV',
                  description: 'Add your details in YAML format with our intuitive editor.',
                  delay: '150ms'
                },
                {
                  step: '3',
                  title: 'Export & Share',
                  description: 'Generate a professional PDF ready to share with employers.',
                  delay: '300ms'
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="feature-card p-8 text-center animate-slide-in"
                  style={{ animationDelay: item.delay }}
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <Button
                size="lg"
                onClick={createNewSession}
                className="btn-modern bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                disabled={isCreatingSession}
              >
                {isCreatingSession ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Plus className="h-5 w-5 mr-2" />
                )}
                <span>{isCreatingSession ? 'Creating...' : 'Start Building Your CV'}</span>
                {!isCreatingSession && <ArrowRight className="h-5 w-5 ml-2" />}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-8 md:mb-0">
              <div className="rounded-lg bg-white/10 p-2">
                <FileJson className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">CV Wonder</h2>
            </div>
            <div className="flex space-x-8">
              <Link href="https://github.com/germainlefebvre4/cvwonder" target="_blank" 
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </Link>
              <Link href="https://cvwonder.readthedocs.io/" target="_blank"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
                <FileText className="h-5 w-5" />
                <span>Documentation</span>
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} CV Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}