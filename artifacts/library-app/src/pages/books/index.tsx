import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useListBooks, getListBooksQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useDeleteBook, useIssueBook,
  getGetStudentDashboardQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Library, BookDown } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-mobile";

// Custom useDebounce implementation since we don't have one in hooks folder
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Books() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  const [category, setCategory] = useState<string>("all");

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category !== "all" ? { category } : {}),
  };

  const { data: books, isLoading } = useListBooks(queryParams, {
    query: { queryKey: getListBooksQueryKey(queryParams) }
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const deleteBook = useDeleteBook();
  const issueBook = useIssueBook();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    deleteBook.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Book deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to delete book", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleIssue = (bookId: number) => {
    issueBook.mutate({ data: { bookId } }, {
      onSuccess: () => {
        toast({ title: "Book issued successfully" });
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to issue book", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Library Catalog</h1>
          <p className="text-muted-foreground">Browse and manage the institution's collection</p>
        </div>
        {isAdmin && (
          <Link href="/books/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Book
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, author, or ISBN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Title & Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Spinner className="w-6 h-6 text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : books?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Library className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No books found in the catalog.
                </TableCell>
              </TableRow>
            ) : (
              books?.map((book) => (
                <TableRow key={book.id} className="group">
                  <TableCell>
                    <div className="font-medium text-foreground">{book.title}</div>
                    <div className="text-sm text-muted-foreground">{book.author}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{book.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">{book.isbn}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${book.availableQuantity > 0 ? 'bg-green-500' : 'bg-destructive'}`} />
                      <span className="text-sm">
                        {book.availableQuantity} / {book.quantity} available
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/books/${book.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(book.id)}
                          disabled={deleteBook.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant={book.availableQuantity > 0 ? "default" : "secondary"}
                        disabled={book.availableQuantity === 0 || issueBook.isPending}
                        onClick={() => handleIssue(book.id)}
                        className="gap-2"
                      >
                        <BookDown className="w-4 h-4" />
                        {book.availableQuantity > 0 ? "Issue Book" : "Unavailable"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}