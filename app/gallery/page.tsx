"use client";

import { useEffect, useState } from "react";
import { Theme } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationLast,
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Plus, Search } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import defaultCV from "@/lib/defaultCV";
import { ThemeDetailsDialog } from "@/components/theme-details-dialog";

const GalleryPage = () => {
    const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThemes, setTotalThemes] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const themesPerPage = 6;
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          perPage: themesPerPage.toString(),
        });
        
        if (debouncedQuery) {
          queryParams.append('q', debouncedQuery);
        }
        
        const response = await fetch(`/api/themes/search?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des thèmes");
        }
        const data = await response.json();
        setThemes(data.items);
        setTotalPages(data.totalPages);
        setTotalThemes(data.totalItems);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, [currentPage, debouncedQuery]);


  const createNewSession = async (themeName: string) => {
    try {
    //   setIsCreatingSession(true);
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialContent: defaultCV,
          theme: themeName,
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
      logger.error('Error creating session:', err);
      toast({
        title: "Session Creation Failed",
        description: "Failed to create a new session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <Heading title={`CV Wonder Theme Gallery (${totalThemes})`} description="Explore and choose from our resume themes" />
        <Link href="/">
          <Button variant="outline">Back to Homepage</Button>
        </Link>
      </div>
      
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a theme..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <Separator className="my-4" />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground text-lg">Loading the themes...</p>
        </div>
      ) : themes.length === 0 ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground text-lg">
            {debouncedQuery 
              ? `Aucun thème ne correspond à votre recherche "${debouncedQuery}"`
              : "Aucun thème disponible pour le moment."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card key={theme.id} className="overflow-hidden">
                <div className="relative h-[300px] bg-gray-100">
                  {theme.previewUrl ? (
                    <Image
                      src={theme.previewUrl}
                      alt={theme.name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Aperçu non disponible</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-2">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {theme.description || "Aucune description disponible"}
                  </p>
                  <div className="flex gap-2">
                      {/* Button to "Create Your CV" */}
                      <Button
                        size="lg"
                        value={theme.name}
                        onClick={() => createNewSession(theme.slug)}
                        className="btn-modern bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isCreatingSession}
                      >
                        <span>{isCreatingSession ? 'Creating...' : 'Start my CV'}</span>
                        {!isCreatingSession && <ArrowRight className="h-5 w-5 ml-2" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTheme(theme);
                          setIsDialogOpen(true);
                        }}
                      >
                        More details
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                    <PaginationFirst 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }} 
                    />
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }} 
                      />
                      <PaginationLast 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Theme details dialog */}
          {selectedTheme && (
            <ThemeDetailsDialog
              theme={selectedTheme}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GalleryPage;