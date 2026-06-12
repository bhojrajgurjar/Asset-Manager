import React from "react";
import { useListMyTransactions, getListMyTransactionsQueryKey, useReturnBook, getGetStudentDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { Clock, AlertTriangle, LibraryBig, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MyBooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useListMyTransactions({
    query: { queryKey: getListMyTransactionsQueryKey() }
  });

  const returnBook = useReturnBook();

  const handleReturn = (id: number) => {
    returnBook.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Book returned successfully" });
        queryClient.invalidateQueries({ queryKey: getListMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to return book", description: err.message, variant: "destructive" });
      }
    });
  };

  const activeTransactions = transactions?.filter(tx => tx.status !== 'returned') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">My Books</h1>
        <p className="text-muted-foreground">Manage your currently borrowed titles</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Book Details</TableHead>
              <TableHead>Borrowed On</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
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
            ) : activeTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <LibraryBig className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  You don't have any active borrowed books.
                </TableCell>
              </TableRow>
            ) : (
              activeTransactions.map((tx) => {
                const isOverdue = new Date(tx.returnDate) < new Date();
                return (
                  <TableRow key={tx.id} className="group">
                    <TableCell>
                      <div className="font-medium text-foreground text-lg">{tx.book.title}</div>
                      <div className="text-sm text-muted-foreground">{tx.book.author}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(tx.issueDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={isOverdue ? 'text-destructive font-bold' : 'font-medium'}>
                        {format(new Date(tx.returnDate), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isOverdue ? (
                        <Badge variant="secondary" className="text-destructive bg-destructive/10 gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 gap-1">
                          <Clock className="w-3 h-3" /> Active
                        </Badge>
                      )}
                      {tx.fineAmount != null && tx.fineAmount > 0 && (
                        <div className="text-xs text-destructive mt-1 font-medium">Fine: ${(tx.fineAmount as number).toFixed(2)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        disabled={returnBook.isPending}
                        onClick={() => handleReturn(tx.id)}
                      >
                        <Check className="w-4 h-4" />
                        Return Book
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}