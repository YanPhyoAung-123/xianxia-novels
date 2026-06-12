import React, { useState } from "react";
import { useTranslateText, useListGlossaries, getListGlossariesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Copy, Loader2, Sparkles, AlertCircle, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TranslatorPage() {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState("");
  const [glossaryId, setGlossaryId] = useState<string>("none");
  const [novelTitle, setNovelTitle] = useState("");

  const { data: glossaries } = useListGlossaries({
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
      onError: () => {
        toast({
          title: "Translation failed",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const copyToClipboard = async () => {
    if (translateMutation.data?.translatedText) {
      await navigator.clipboard.writeText(translateMutation.data.translatedText);
      toast({ title: "Copied", description: "Translation copied to clipboard." });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Controls */}
      <div className="flex-none px-4 py-3 md:px-6 md:py-4 border-b border-border/50 bg-card/30">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">Glossary</Label>
              <Select value={glossaryId} onValueChange={setGlossaryId}>
                <SelectTrigger className="w-full bg-background h-9 text-sm" data-testid="select-glossary">
                  <SelectValue placeholder="No Glossary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Glossary</SelectItem>
                  {glossaries?.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">Novel Title</Label>
              <Input
                placeholder="e.g. Shadow Slave"
                value={novelTitle}
                onChange={(e) => setNovelTitle(e.target.value)}
                className="bg-background h-9 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || translateMutation.isPending}
            className="w-full h-10 font-semibold"
            data-testid="button-translate"
          >
            {translateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {translateMutation.isPending ? "Translating..." : "Translate"}
          </Button>
        </div>
      </div>

      {/* Editor Area — stacks on mobile, side-by-side on desktop */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col md:grid md:grid-cols-2 h-full">

          {/* Source Panel */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-border/50 overflow-hidden" style={{ height: "50%" }}>
            <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">English</span>
              {sourceText && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {sourceText.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <Textarea
              className="flex-1 resize-none border-0 focus-visible:ring-0 p-4 rounded-none text-sm md:text-base leading-relaxed bg-transparent"
              placeholder="Paste English text here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              data-testid="input-source-text"
            />
          </div>

          {/* Target Panel */}
          <div className="flex flex-col overflow-hidden" style={{ height: "50%" }}>
            <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">မြန်မာဘာသာ</span>
              {translateMutation.data?.translatedText && (
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={copyToClipboard}>
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-sm md:text-base leading-relaxed">
              {translateMutation.isPending ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
                  <p className="text-sm animate-pulse">Translating...</p>
                </div>
              ) : translateMutation.data ? (
                <div className="whitespace-pre-wrap font-serif" data-testid="text-translated">
                  {translateMutation.data.translatedText}
                </div>
              ) : translateMutation.isError ? (
                <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2">
                  <AlertCircle className="h-7 w-7" />
                  <p className="text-sm">Translation failed. Try again.</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground/50">Translation will appear here.</p>
                </div>
              )}
            </div>

            {/* Applied Terms */}
            {translateMutation.data?.appliedTerms && translateMutation.data.appliedTerms.length > 0 && (
              <div className="border-t border-border/50 bg-muted/10 px-4 py-3 shrink-0">
                <div className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Library className="w-3 h-3" />
                  Applied Terms
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {translateMutation.data.appliedTerms.map((term, i) => (
                    <Badge key={i} variant="secondary" className="bg-background/50 border border-border/50 text-xs font-normal py-0.5">
                      <span className="text-muted-foreground">{term.english}</span>
                      <ArrowRight className="w-2.5 h-2.5 mx-1 text-muted-foreground/50" />
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
