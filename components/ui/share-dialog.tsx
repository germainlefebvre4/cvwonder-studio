'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (retentionDays: number) => Promise<void>;
  sessionUrl: string;
}

const retentionOptions = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
];

export function ShareDialog({ isOpen, onClose, onShare, sessionUrl }: ShareDialogProps) {
  const [retentionDays, setRetentionDays] = useState('7');
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(Number(retentionDays));
      await navigator.clipboard.writeText(sessionUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to share session:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share CV Session</DialogTitle>
          <DialogDescription>
            Choose how long this session should be accessible. After the retention period, the session will be automatically deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Retention Period</label>
            <Select
              value={retentionDays}
              onValueChange={setRetentionDays}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                {retentionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-4">
            <input
              type="text"
              readOnly
              className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={sessionUrl}
            />
            <Button 
              type="button" 
              variant="ghost" 
              className="shrink-0"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy URL</span>
            </Button>
          </div>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isSharing}>
            <Share2 className="mr-2 h-4 w-4" />
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}