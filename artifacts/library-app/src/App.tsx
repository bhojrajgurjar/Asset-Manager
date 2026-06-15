import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/ui/spinner";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import RegisterAdmin from "@/pages/register-admin";
import Dashboard from "@/pages/dashboard";
import Books from "@/pages/books/index";
import NewBook from "@/pages/books/new";
import EditBook from "@/pages/books/edit";
import Transactions from "@/pages/transactions";
import MyBooks from "@/pages/my-books";
import Notifications from "@/pages/notifications";
import Users from "@/pages/users";

const queryClient = new QueryClient();

function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }
  if (user) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login/:role" component={Login} />
      <Route path="/register/admin" component={RegisterAdmin} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/books">
        <ProtectedRoute>
          <AppLayout>
            <Books />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/books/new">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <NewBook />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/books/:id/edit">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <EditBook />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/transactions">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <Transactions />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <Users />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/my-books">
        <ProtectedRoute>
          <AppLayout>
            <MyBooks />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/notifications">
        <ProtectedRoute>
          <AppLayout>
            <Notifications />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <HomeRoute />
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;