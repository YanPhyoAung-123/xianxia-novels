import React, { useState } from "react";
import { Link } from "wouter";
import { useListGlossaries, getListGlossariesQueryKey, useCreateGlossary, useDeleteGlossary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Library, Plus, Trash2, BookOpen, Clock, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const glossarySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  novelTitle: z.string().optional(),
});

export default function GlossariesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: glossaries, isLoading } = useListGlossaries({
    query: { queryKey: getListGlossariesQueryKey() }
  });

  const createMutation = useCreateGlossary();
  const deleteMutation = useDeleteGlossary();

  const form = useForm<z.infer<typeof glossarySchema>>({
    resolver: zodResolver(glossarySchema),
    defaultValues: {
      name: "",
      description: "",
      novelTitle: "",
    },
  });

  function onSubmit(values: z.infer<typeof glossarySchema>) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGlossariesQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Glossary created" });
      },
      onError: () => {
        toast({ title: "Failed to create glossary", variant: "destructive" });
      }
    });
  }

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this glossary?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGlossariesQueryKey() });
        toast({ title: "Glossary deleted" });
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Glossaries</h1>
          <p className="text-muted-foreground mt-1">Manage specialized terminology for your translations.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Glossary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Glossary</DialogTitle>
              <DialogDescription>
                Define a new dictionary for terms, character names, and lore.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Cultivation Terms" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="novelTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novel Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Shadow Slave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/20" />
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : glossaries?.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/20">
          <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No glossaries yet</h3>
          <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Create a glossary to enforce consistent translation of specialized terms.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create your first glossary</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {glossaries?.map((glossary) => (
            <Card key={glossary.id} className="group flex flex-col hover:border-primary/30 transition-colors bg-card hover:bg-card/80">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">
                      <Link href={`/glossaries/${glossary.id}`} className="hover:underline">
                        {glossary.name}
                      </Link>
                    </CardTitle>
                    {glossary.novelTitle && (
                      <CardDescription className="flex items-center gap-1 mt-1.5 font-medium text-xs text-primary/80">
                        <BookOpen className="w-3 h-3" />
                        {glossary.novelTitle}
                      </CardDescription>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                    onClick={() => handleDelete(glossary.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                {glossary.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{glossary.description}</p>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between border-t border-border/30 px-6 py-3 bg-muted/10 mt-auto">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                    {glossary.termCount || 0} terms
                  </span>
                </div>
                <Link href={`/glossaries/${glossary.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold hover:text-primary hover:bg-transparent -mr-2">
                    Open <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
