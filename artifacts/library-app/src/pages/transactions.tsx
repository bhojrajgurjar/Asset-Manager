import React from "react";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">All Transactions</h1>
        <p className="text-muted-foreground">Comprehensive log of all library activity</p>
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
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No transactions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => (
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
                    {tx.fineAmount != null && tx.fineAmount > 0 ? (
                      <span className="text-destructive">${(tx.fineAmount as number).toFixed(2)}</span>
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