import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, ChefHat, BarChart2, Package, ShoppingBag, Settings, LogOut, Menu, X, Bell, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/context/useAuth';
import { useAppSettings } from "@/context/useAppSettings";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/context/authTypes";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  title: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, title, isActive, onClick }: NavItemProps) => (
  <Link
    to={href}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
    onClick={onClick}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{title}</span>
  </Link>
);

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  useEffect(() => {
    if (!user && location.pathname !== "/") {
      navigate("/");
    }
  }, [user, location.pathname, navigate]);

  if (location.pathname === "/") {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", icon: <Home size={20} />, title: "Dashboard", roles: ['admin', 'franchiseOwner', 'storeManager', 'kitchenStaff', 'staff'] },
    { href: "/inventory", icon: <Package size={20} />, title: "Inventory", roles: ['admin', 'franchiseOwner', 'storeManager'] },
    { href: "/recipes", icon: <ChefHat size={20} />, title: "Recipes", roles: ['admin', 'franchiseOwner', 'storeManager', 'kitchenStaff'] },
    { href: "/analytics", icon: <BarChart2 size={20} />, title: "Analytics", roles: ['admin', 'franchiseOwner', 'storeManager'] },
    { href: "/pos", icon: <ShoppingBag size={20} />, title: "POS Integration", roles: ['admin', 'franchiseOwner'] },
    { href: "/locations", icon: <MapPin size={20} />, title: "Locations", roles: ['admin', 'franchiseOwner'] },
    { href: "/settings", icon: <Settings size={20} />, title: "Settings", roles: ['admin', 'franchiseOwner'] },
  ];

  const closeSidebarIfMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getLogoInitials = () => {
    const parts = settings.appName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return settings.appName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 py-4">
          <Link 
            to="/dashboard" 
            className={cn(
              "flex items-center gap-2 font-semibold transition-opacity", 
              !sidebarOpen && "lg:opacity-0"
            )}
          >
            {settings.logoUrl ? (
              <div className="h-8 w-8 rounded-md overflow-hidden">
                <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-white",
                settings.themeColor === 'chrome' ? 'bg-chrome-600' : 'bg-brand-600'
              )}>
                {getLogoInitials()}
              </div>
            )}
            <span className={cn(
              "text-xl text-foreground font-semibold transition-opacity",
              !sidebarOpen && "lg:opacity-0"
            )}>{settings.appName}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {navItems
            .filter(item => user?.role && item.roles.includes(user.role as UserRole))
            .map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                isActive={location.pathname === item.href}
                onClick={closeSidebarIfMobile}
              />
            ))}
        </nav>

        <div className={cn(
          "p-3 mt-auto border-t", 
          !sidebarOpen && "lg:flex lg:flex-col lg:items-center"
        )}>
          {user?.role && ['admin', 'franchiseOwner'].includes(user.role as UserRole) && (
            <NavItem
              href="/settings"
              icon={<Settings size={20} />}
              title="Settings"
              isActive={location.pathname === "/settings"}
              onClick={closeSidebarIfMobile}
            />
          )}
          <button
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 mt-1"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className={cn("truncate", !sidebarOpen && "lg:hidden")}>Logout</span>
          </button>
          
          <div className={cn(
            "flex items-center gap-3 px-3 py-3 mt-3", 
            !sidebarOpen && "lg:hidden"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell size={20} />
            </Button>
            <div className="hidden lg:flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
