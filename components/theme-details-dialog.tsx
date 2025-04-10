"use client";

import { useState, useRef } from "react";
import { Theme } from "@prisma/client";
import Image from "next/image";
import { Tag, User, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { SiGithub } from '@icons-pack/react-simple-icons';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface ThemeDetailsDialogProps {
  theme: Theme;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeDetailsDialog = ({
  theme,
  open,
  onOpenChange,
}: ThemeDetailsDialogProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3)); // Max zoom 3x
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1)); // Min zoom 1x
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Metadata column (1/3 width) */}
          <div className="p-6 overflow-y-auto md:border-r">
            <DialogHeader>
              <DialogTitle>{theme.name}</DialogTitle>
              <DialogDescription>
                Details of the theme
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {theme.description || "Aucune description disponible."}
                </p>
              </div>

              {/* <div className="space-y-2">
                {theme.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">Category: {theme.category}</div>
                  </div>
                )}
                
                {theme.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">Author: {theme.author}</div>
                  </div>
                )}
              </div> */}

              {/* Caractéristiques du thème */}
              {/* {theme.features && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {theme.features.split(',').map((feature, index) => (
                      <div 
                        key={index} 
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                      >
                        {feature.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
              
              {/* Additional informations */}
              {/* {theme.additionalInfo && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Additional informations</h4>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      {theme.additionalInfo}
                    </div>
                  </div>
                </div>
              )} */}
              
              {/* Compatibility */}
              {theme.compatibleWith && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Compatibility</h4>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      {theme.compatibleWith}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Links */}
              {theme.githubRepoUrl && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Source Repository</h4>
                  <Link
                    href={theme.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <SiGithub className="h-8 w-8 ml-1" />
                  </Link>
                </div>
              )}
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Link href={`/editor?theme=${theme.id}`}>
                  <Button>Use this theme</Button>
                </Link>
              </DialogFooter>
            </div>
          </div>

          {/* Image column (2/3 width) */}
          <div className="md:col-span-2 relative">
            {theme.previewUrl ? (
              <div 
                ref={imageContainerRef} 
                className="h-[80vh] overflow-auto p-6 relative bg-gray-50"
              >
                <div 
                  className="relative w-full transition-all duration-200"
                  style={{ 
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <Image
                    src={theme.previewUrl}
                    alt={theme.name}
                    width={1000}
                    height={1500}
                    className="w-full h-auto object-contain rounded-md"
                    unoptimized={zoomLevel > 1}
                  />
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={zoomOut}
                    disabled={zoomLevel <= 1}
                    className="opacity-80 hover:opacity-100"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary"
                    size="sm" 
                    onClick={resetZoom}
                    className="opacity-80 hover:opacity-100"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={zoomIn}
                    disabled={zoomLevel >= 3}
                    className="opacity-80 hover:opacity-100"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};