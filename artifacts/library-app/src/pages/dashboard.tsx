import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
  useGetStudentDashboard, getGetStudentDashboardQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, AlertTriangle, CheckCircle, Clock, Library, Bell, DollarSign } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function DashboardStatCard({
  href,
  title,
  value,
  icon: Icon,
  iconClassName,
  valueClassName,
  cardClassName,
}: {
  href: string;
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  valueClassName?: string;
  cardClassName?: string;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "bg-card transition-all hover:shadow-md hover:border-primary/40 cursor-pointer h-full",
          cardClassName,
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={cn("w-4 h-4 text-primary", iconClassName)} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

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
        <DashboardStatCard
          href="/books"
          title="Total Books"
          value={data.totalBooks}
          icon={BookOpen}
        />
        <DashboardStatCard
          href="/users"
          title="Active Users"
          value={data.totalUsers}
          icon={Users}
        />
        <DashboardStatCard
          href="/transactions?filter=active"
          title="Active Rentals"
          value={data.activeRentals}
          icon={Library}
        />
        <DashboardStatCard
          href="/transactions?filter=overdue"
          title="Overdue"
          value={data.overdueRentals}
          icon={AlertTriangle}
          iconClassName="text-destructive"
          valueClassName="text-destructive"
          cardClassName="border-destructive/20"
        />
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
        <DashboardStatCard
          href="/my-books"
          title="Currently Borrowed"
          value={data.currentlyBorrowed}
          icon={BookOpen}
        />
        <DashboardStatCard
          href="/my-books?filter=overdue"
          title="Overdue Books"
          value={data.overdueBooks}
          icon={AlertTriangle}
          iconClassName="text-destructive"
          valueClassName="text-destructive"
          cardClassName="border-destructive/20"
        />
        <DashboardStatCard
          href="/my-books?filter=fines"
          title="Outstanding Fines"
          value={`$${data.outstandingFines.toFixed(2)}`}
          icon={DollarSign}
        />
        <DashboardStatCard
          href="/notifications"
          title="Unread Notifications"
          value={data.unreadNotifications}
          icon={Bell}
        />
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