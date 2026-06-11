import React from "react";
import { useLocation } from "wouter";
import { useCreateBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookForm, BookFormValues } from "./book-form";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewBook() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBook = useCreateBook();

  const handleSubmit = (values: BookFormValues) => {
    createBook.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Book added successfully" });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        setLocation("/books");
      },
      onError: (err) => {
        toast({ title: "Failed to add book", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/books">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Add New Book</h1>
          <p className="text-muted-foreground">Register a new title into the library system</p>
        </div>
      </div>
      
      <BookForm onSubmit={handleSubmit} isPending={createBook.isPending} />
    </div>
  );
}