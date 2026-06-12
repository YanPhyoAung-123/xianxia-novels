import React, { useState } from "react";
import { useTranslateText, useListGlossaries, getListGlossariesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Copy, Loader2, Sparkles, AlertCircle, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TranslatorPage() {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState("");
  const [glossaryId, setGlossaryId] = useState<string>("none");
  const [novelTitle, setNovelTitle] = useState("");

  const { data: glossaries, isLoading: isGlossariesLoading } = useListGlossaries({
    query: { queryKey: getListGlossariesQueryKey() }
  });

  const translateMutation = useTranslateText();

  const handleTranslate = () => {
    if (!sourceText.trim()) return;

    translateMutation.mutate({
      data: {
        text: sourceText,
        glossaryId: glossaryId !== "none" ? parseInt(glossaryId, 10) : undefined,
        novelTitle: novelTitle.trim() || undefined,
      }
    }, {
      onError: (err) => {
        toast({
          title: "Translation failed",
          description: "An error occurred while translating. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const copyToClipboard = async () => {
    if (translateMutation.data?.translatedText) {
      await navigator.clipboard.writeText(translateMutation.data.translatedText);
      toast({
        title: "Copied",
        description: "Translation copied to clipboard.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Header Controls */}
      <div className="flex-none p-4 md:p-6 border-b border-border/50 bg-card/30 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap flex-1 w-full md:max-w-2xl">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Glossary</Label>
            <Select value={glossaryId} onValueChange={setGlossaryId}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select glossary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Glossary</SelectItem>
                {glossaries?.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Context (Novel Title)</Label>
            <Input 
              placeholder="e.g. Shadow Slave" 
              value={novelTitle} 
              onChange={(e) => setNovelTitle(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <Button 
          onClick={handleTranslate} 
          disabled={!sourceText.trim() || translateMutation.isPending}
          className="w-full md:w-auto h-12 px-8 shadow-md"
          data-testid="button-translate"
        >
          {translateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Translate
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 h-full">
          
          {/* Source Panel */}
          <div className="flex flex-col h-full border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">English Source</span>
            </div>
            <Textarea 
              className="flex-1 resize-none border-0 focus-visible:ring-0 p-4 rounded-none text-base leading-relaxed bg-transparent"
              placeholder="Paste English text here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              data-testid="input-source-text"
            />
          </div>

          {/* Target Panel */}
          <div className="flex flex-col h-full border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden relative group">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Burmese Translation</span>
              {translateMutation.data?.translatedText && (
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only text-xs">Copy</span>
                </Button>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto text-base leading-relaxed">
              {translateMutation.isPending ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <p className="text-sm animate-pulse">Translating contextually...</p>
                </div>
              ) : translateMutation.data ? (
                <div className="whitespace-pre-wrap font-serif" data-testid="text-translated">
                  {translateMutation.data.translatedText}
                </div>
              ) : translateMutation.isError ? (
                <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">Translation failed</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground/50">
                  <p className="text-sm">Translation will appear here.</p>
                </div>
              )}
            </div>
            
            {/* Applied Terms Display */}
            {translateMutation.data?.appliedTerms && translateMutation.data.appliedTerms.length > 0 && (
              <div className="border-t border-border/50 bg-muted/10 p-3 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Library className="w-3.5 h-3.5" /> 
                  Applied Glossary Terms
                </div>
                <div className="flex flex-wrap gap-2">
                  {translateMutation.data.appliedTerms.map((term, i) => (
                    <Badge key={i} variant="secondary" className="bg-background/50 border border-border/50 text-xs font-normal">
                      <span className="text-muted-foreground">{term.english}</span>
                      <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground/50" />
                      <span className="text-primary">{term.burmese}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
