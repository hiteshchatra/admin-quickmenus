import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FolderOpen,
  UtensilsCrossed,
  User,
  LogOut,
  Menu,
  X,
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Categories',
    href: '/categories',
    icon: FolderOpen,
  },
  {
    name: 'Menu Items',
    href: '/menu-items',
    icon: UtensilsCrossed,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-slide-in-up"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 admin-sidebar transform transition-[var(--transition-spring)] shadow-[var(--shadow-strong)]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex lg:flex-col lg:shrink-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/50 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center space-x-3 relative z-10 animate-slide-in-right">
            <div className="w-10 h-10 admin-gradient rounded-xl flex items-center justify-center shadow-[var(--shadow-soft)] animate-float">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Quick Menu
              </h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden admin-button relative z-10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`admin-nav-item group ${isActive ? 'active' : ''} animate-slide-in-right`}
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-[var(--shadow-soft)]">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center animate-glow">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Restaurant Admin</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start admin-button hover:border-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-card/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 shadow-[var(--shadow-soft)] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
          <div className="relative z-10 flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden admin-button"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="hidden sm:block">
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {navigationItems.find(item => isActiveRoute(item.href))?.name || 'Admin Panel'}
              </h2>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full animate-glow"></div>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 relative">
          <div className="animate-slide-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};