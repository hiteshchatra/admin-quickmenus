import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Categories } from "@/pages/Categories";
import { MenuItems } from "@/pages/MenuItems";
import { Profile } from "@/pages/Profile";
import { SuperAdminDashboard } from "@/pages/SuperAdminDashboard";
import { RestaurantManagement } from "@/pages/RestaurantManagement";
import { UserManagement } from "@/pages/UserManagement";
import { RestaurantDetails } from "@/pages/RestaurantDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RoleBasedRedirect><div /></RoleBasedRedirect>} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin" element={
              <SuperAdminRoute>
                <SuperAdminLayout />
              </SuperAdminRoute>
            }>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="restaurants" element={<RestaurantManagement />} />
              <Route path="restaurants/:userId" element={<RestaurantDetails />} />
              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Regular Admin Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
            
            <Route path="/categories" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Categories />} />
            </Route>
            
            <Route path="/menu-items" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MenuItems />} />
            </Route>
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Profile />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
