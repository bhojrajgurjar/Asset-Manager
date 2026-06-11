import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
  useGetStudentDashboard, getGetStudentDashboardQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, AlertTriangle, CheckCircle, Clock, Library, Bell } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

function AdminDashboardView() {
  const { data, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="w-8 h-8 text-primary" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">Library Overview</h1>
        <p className="text-muted-foreground">Institution metrics and active operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBooks}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rentals</CardTitle>
            <Library className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeRentals}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.overdueRentals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Books by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.booksByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--color-muted)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
              ) : (
                data.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0">
                    <div>
                      <div className="font-medium">{tx.book.title}</div>
                      <div className="text-sm text-muted-foreground">{tx.user.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {tx.status === 'active' && <span className="text-blue-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Issued</span>}
                        {tx.status === 'returned' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Returned</span>}
                        {tx.status === 'overdue' && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{format(new Date(tx.issueDate), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboardView() {
  const { data, isLoading } = useGetStudentDashboard({
    query: { queryKey: getGetStudentDashboardQueryKey() }
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="w-8 h-8 text-primary" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground">Your reading activity and status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently Borrowed</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentlyBorrowed}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Books</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.overdueBooks}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Fines</CardTitle>
            <span className="text-muted-foreground text-sm font-bold">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.outstandingFines.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread Notifications</CardTitle>
            <Bell className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unreadNotifications}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Active Borrows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.activeTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active books borrowed right now. Time to explore the catalog!</div>
            ) : (
              data.activeTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0">
                  <div>
                    <div className="font-medium text-lg">{tx.book.title}</div>
                    <div className="text-sm text-muted-foreground">{tx.book.author}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Due Date</div>
                    <div className={`font-medium ${new Date(tx.returnDate) < new Date() ? 'text-destructive' : ''}`}>
                      {format(new Date(tx.returnDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  
  return isAdmin ? <AdminDashboardView /> : <StudentDashboardView />;
}