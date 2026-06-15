import React, { useMemo } from "react";
import { useSearch } from "wouter";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Transactions() {
  const search = useSearch();
  const filter = useMemo(() => new URLSearchParams(search).get("filter"), [search]);

  const { data: transactions, isLoading } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey() }
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === "active") {
      return transactions.filter((tx) => tx.status === "active");
    }
    if (filter === "overdue") {
      return transactions.filter((tx) => tx.status === "overdue");
    }
    return transactions;
  }, [transactions, filter]);

  const pageTitle =
    filter === "active"
      ? "Active Rentals"
      : filter === "overdue"
        ? "Overdue Transactions"
        : "All Transactions";

  const pageDescription =
    filter === "active"
      ? "Currently issued books not yet returned"
      : filter === "overdue"
        ? "Transactions past their due date"
        : "Comprehensive log of all library activity";

  const emptyMessage =
    filter === "active"
      ? "No active rentals right now."
      : filter === "overdue"
        ? "No overdue transactions right now."
        : "No transactions recorded yet.";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due/Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Fine</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Spinner className="w-6 h-6 text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{tx.book.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tx.book.isbn}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{tx.user.name}</div>
                    <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(tx.issueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tx.actualReturnDate ? (
                      <span className="text-muted-foreground">Returned: {format(new Date(tx.actualReturnDate), 'MMM d, yyyy')}</span>
                    ) : (
                      <span className={new Date(tx.returnDate) < new Date() ? 'text-destructive font-medium' : ''}>
                        Due: {format(new Date(tx.returnDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.status === 'active' && <Badge variant="secondary" className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 gap-1"><Clock className="w-3 h-3" /> Active</Badge>}
                    {tx.status === 'returned' && <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30 gap-1"><CheckCircle className="w-3 h-3" /> Returned</Badge>}
                    {tx.status === 'overdue' && <Badge variant="secondary" className="text-destructive bg-destructive/10 gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {tx.fineAmount != null && Number(tx.fineAmount) > 0 ? (
                      <span className="text-destructive">${Number(tx.fineAmount).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
