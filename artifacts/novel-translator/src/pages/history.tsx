import React from "react";
import { useListTranslationHistory, getListTranslationHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Loader2, History as HistoryIcon, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { data: history, isLoading } = useListTranslationHistory({
    query: { queryKey: getListTranslationHistoryQueryKey() }
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Translation History</h1>
        <p className="text-muted-foreground mt-1">Review your recent translations and their applied contexts.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : history?.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/20">
          <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No history yet</h3>
          <p className="text-muted-foreground mt-1">
            Start translating to see your past work here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {history?.map((entry) => (
            <Card key={entry.id} className="bg-card hover:border-primary/20 transition-colors overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </span>
                  {entry.novelTitle && (
                    <Badge variant="outline" className="bg-background/50 text-[10px] uppercase font-bold tracking-wider">
                      {entry.novelTitle}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                  <div className="p-5 relative">
                    <div className="absolute top-5 right-5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/40">English</div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap mt-4 pr-10">
                      {entry.originalText}
                    </p>
                  </div>
                  <div className="p-5 relative bg-primary/5">
                    <div className="absolute top-5 right-5 text-[10px] uppercase tracking-widest font-semibold text-primary/40">Burmese</div>
                    <p className="text-base leading-relaxed font-serif text-foreground whitespace-pre-wrap mt-4 pr-10">
                      {entry.translatedText}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
