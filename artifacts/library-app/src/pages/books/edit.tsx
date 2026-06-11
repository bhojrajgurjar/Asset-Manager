import React from "react";
import { useLocation, useParams, Link } from "wouter";
import { useGetBook, getGetBookQueryKey, useUpdateBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookForm, BookFormValues } from "./book-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function EditBook() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useGetBook(id, {
    query: { queryKey: getGetBookQueryKey(id) }
  });

  const updateBook = useUpdateBook();

  const handleSubmit = (values: BookFormValues) => {
    updateBook.mutate({ id, data: values }, {
      onSuccess: () => {
        toast({ title: "Book updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(id) });
        setLocation("/books");
      },
      onError: (err) => {
        toast({ title: "Failed to update book", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="w-8 h-8 text-primary" /></div>;
  if (!book) return <div className="text-center py-12">Book not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/books">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Edit Book</h1>
          <p className="text-muted-foreground">Update details for "{book.title}"</p>
        </div>
      </div>
      
      <BookForm initialValues={book} onSubmit={handleSubmit} isPending={updateBook.isPending} />
    </div>
  );
}