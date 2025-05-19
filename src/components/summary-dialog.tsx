'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy } from 'lucide-react';

interface SummaryDialogProps {
  title: string;
  summary: string;
  sourceType?: string;
  date?: string;
  children?: React.ReactNode;
}

export function SummaryDialog({ 
  title, 
  summary, 
  sourceType,
  date,
  children 
}: SummaryDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="outline" size="sm">View Summary</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" /> 
              <span className="truncate max-w-[300px]">{title}</span>
            </div>
            {sourceType && (
              <Badge variant="outline" className="ml-auto">{sourceType}</Badge>
            )}
          </DialogTitle>
          {date && <div className="text-sm text-muted-foreground">{date}</div>}
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg my-2">
          <div className="prose dark:prose-invert max-w-none">
            <h3>Summary</h3>
            <p>{summary}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={copyToClipboard}
            className="flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
