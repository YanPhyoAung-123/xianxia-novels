import React, { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetGlossary, getGetGlossaryQueryKey, 
  useListTerms, getListTermsQueryKey,
  useCreateTerm, useUpdateTerm, useDeleteTerm,
  useExportGlossary, useImportGlossary
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Plus, Trash2, Loader2, ArrowLeft, MoreHorizontal, Edit2, Search, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const termSchema = z.object({
  english: z.string().min(1, "English term required"),
  burmese: z.string().min(1, "Burmese translation required"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const CATEGORIES = ["character", "place", "technique", "rank", "other"];

export default function GlossaryDetailPage() {
  const { id } = useParams();
  const glossaryId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isTermOpen, setIsTermOpen] = useState(false);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);

  const { data: glossary } = useGetGlossary(glossaryId, {
    query: { enabled: !!glossaryId, queryKey: getGetGlossaryQueryKey(glossaryId) }
  });

  const { data: terms, isLoading: isTermsLoading } = useListTerms(glossaryId, {
    query: { enabled: !!glossaryId, queryKey: getListTermsQueryKey(glossaryId) }
  });

  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();
  const deleteTerm = useDeleteTerm();
  const exportGlossary = useExportGlossary();
  // const importGlossary = useImportGlossary();

  const form = useForm<z.infer<typeof termSchema>>({
    resolver: zodResolver(termSchema),
    defaultValues: { english: "", burmese: "", category: "other", notes: "" },
  });

  const openNewTerm = () => {
    setEditingTermId(null);
    form.reset({ english: "", burmese: "", category: "other", notes: "" });
    setIsTermOpen(true);
  };

  const openEditTerm = (term: any) => {
    setEditingTermId(term.id);
    form.reset({
      english: term.english,
      burmese: term.burmese,
      category: term.category || "other",
      notes: term.notes || "",
    });
    setIsTermOpen(true);
  };

  const onSubmit = (values: z.infer<typeof termSchema>) => {
    if (editingTermId) {
      updateTerm.mutate({ id: glossaryId, termId: editingTermId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTermsQueryKey(glossaryId) });
          setIsTermOpen(false);
          toast({ title: "Term updated" });
        }
      });
    } else {
      createTerm.mutate({ id: glossaryId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTermsQueryKey(glossaryId) });
          setIsTermOpen(false);
          toast({ title: "Term added" });
        }
      });
    }
  };

  const handleDelete = (termId: number) => {
    if (!confirm("Delete this term?")) return;
    deleteTerm.mutate({ id: glossaryId, termId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTermsQueryKey(glossaryId) });
        toast({ title: "Term deleted" });
      }
    });
  };

  const handleExport = async () => {
    exportGlossary.mutate({ id: glossaryId }, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${glossary?.name || 'glossary'}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const filteredTerms = terms?.filter(t => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search && !t.english.toLowerCase().includes(search.toLowerCase()) && !t.burmese.includes(search)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/glossaries" className="hover:text-foreground hover:underline transition-colors flex items-center">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to Glossaries
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">{glossary?.name || "..."}</h1>
              {glossary?.novelTitle && <p className="text-primary mt-1 font-medium">{glossary.novelTitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport} disabled={exportGlossary.isPending}>
                {exportGlossary.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export JSON
              </Button>
              <Button onClick={openNewTerm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Term
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search terms..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex-1">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[30%]">English</TableHead>
                  <TableHead className="w-[30%]">Burmese</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTermsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTerms?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <BookOpen className="h-10 w-10 opacity-20 mb-3" />
                        <p>No terms found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerms?.map((term) => (
                    <TableRow key={term.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium text-foreground">{term.english}</TableCell>
                      <TableCell className="text-primary font-serif">{term.burmese}</TableCell>
                      <TableCell>
                        {term.category && (
                          <Badge variant="outline" className="capitalize text-[10px] font-mono tracking-wider bg-background">
                            {term.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                        {term.notes}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditTerm(term)}>
                              <Edit2 className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(term.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Term Dialog */}
      <Dialog open={isTermOpen} onOpenChange={setIsTermOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTermId ? "Edit Term" : "Add Term"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="english"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>English</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Heavenly Tribulation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="burmese"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Burmese</FormLabel>
                    <FormControl>
                      <Input placeholder="Translate in Burmese" className="font-serif" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Context or usage details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createTerm.isPending || updateTerm.isPending}>
                  {createTerm.isPending || updateTerm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Term"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
