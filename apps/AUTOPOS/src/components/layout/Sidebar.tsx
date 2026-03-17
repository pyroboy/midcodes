import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Menu,
  FileText,
  RotateCcw,
  Boxes,
  ClipboardList,
  TruckIcon,
  BarChart4,
  Pencil,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserProfileModal } from "../auth/UserProfileModal";
import { StockStatusSidebar, StockFilters } from "@/components/inventory/StockStatusSidebar";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";

type NavItemType = {
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  submenu?: Array<{
    title: string;
    href: string;
    icon?: React.ReactNode;
  }>;
  roles?: string[];
  isSubItem?: boolean;
};

const SIDEBAR_ITEMS: NavItemType[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/",
    roles: ["admin", "manager", "staff", "owner", "sales"]
  },
  {
    title: "Orders",
    icon: <FileText className="h-5 w-5" />,
    href: "/orders",
    roles: ["admin", "cashier", "manager", "owner"]
  },
  {
    title: "Products",
    icon: <Package className="h-5 w-5" />,
    href: "/sales/products",
    roles: ["admin", "sales", "manager", "owner"]
  },
  {
    title: "Customers",
    icon: <Users className="h-5 w-5" />,
    href: "/sales/customers",
    roles: ["admin", "sales", "manager", "owner"]
  },
  {
    title: "Returns",
    icon: <RotateCcw className="h-5 w-5" />,
    href: "/sales/returns",
    roles: ["admin", "sales", "manager", "owner"]
  },
  {
    title: "Inventory",
    icon: <Boxes className="h-5 w-5" />,
    href: "/inventory",
    roles: ["admin", "manager", "inventory", "owner"],
    submenu: [
      { 
        title: "Stock Status", 
        href: "/inventory/stock",
        icon: <BarChart4 className="h-4 w-4" />
      },
      { 
        title: "Product Entry", 
        href: "/inventory/products",
        icon: <Pencil className="h-4 w-4" />
      },
      { 
        title: "Returns Processing", 
        href: "/inventory/returns",
        icon: <RotateCcw className="h-4 w-4" />
      },
      { 
        title: "Receiving", 
        href: "/inventory/receiving",
        icon: <TruckIcon className="h-4 w-4" />
      },
      { 
        title: "Adjustments", 
        href: "/inventory/adjustments",
        icon: <ClipboardList className="h-4 w-4" />
      }
    ]
  },
  {
    title: "Transactions",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/transactions",
    badge: "New",
    roles: ["admin", "manager", "staff", "owner", "cashier"]
  },
  {
    title: "Cashier Dashboard",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/cashier",
    badge: "Active",
    roles: ["admin", "cashier", "manager", "owner"]
  },
  {
    title: "Administration",
    icon: <Users className="h-5 w-5" />,
    href: "/admin",
    submenu: [
      { title: "Users", href: "/admin/users" },
      { title: "Pricing", href: "/admin/pricing" },
      { title: "Suppliers", href: "/admin/suppliers" },
      { title: "Purchase Orders", href: "/admin/purchase-orders" },
      { title: "Reports", href: "/admin/reports" }
    ],
    roles: ["admin", "owner"]
  },
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/settings",
    roles: ["admin", "owner"]
  }
];

type NavItemProps = {
  item: NavItemType;
  collapsed: boolean;
  userRole?: string | null;
};

const NavItem = ({ item, collapsed, userRole }: NavItemProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const hasAccess = item.roles ? item.roles.includes(userRole || '') : true;
  
  if (!hasAccess) return null;

  const handleClick = () => {
    if (hasSubmenu) {
      setOpen(!open);
    } else {
      navigate(item.href);
    }
  };

  return (
    <div className={cn("mb-1", !hasAccess && "hidden")}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 rounded-md p-2.5 font-medium hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium",
          collapsed && "px-3 justify-center"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 flex-1">
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && item.badge !== "Section" && (
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                  {item.badge}
                </span>
              )}
              {hasSubmenu && (
                <div className="text-muted-foreground">
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Button>

      {hasSubmenu && open && !collapsed && (
        <div className="pl-6 my-1 space-y-1">
          {item.submenu.map((subitem) => (
            <Button
              key={subitem.href}
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-md p-2.5 text-sm font-normal hover:bg-sidebar-accent",
                location.pathname === subitem.href && "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium"
              )}
              onClick={() => navigate(subitem.href)}
            >
              <div className="flex items-center gap-2">
                {subitem.icon}
                <span>{subitem.title}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  userRole: string;
  onLogout?: () => void;
  stockFilters?: StockFilters;
  onStockFiltersChange?: (filters: StockFilters) => void;
}

export const Sidebar = ({ userRole, onLogout, stockFilters, onStockFiltersChange }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const location = useLocation();
  const previousFiltersRef = useRef<string>("");
  
  const [localStockFilters, setLocalStockFilters] = useState<StockFilters>({
    categories: [],
    manufacturers: [],
    priceRange: [0, 10000],
    stockStatus: [],
    locations: [],
    search: '',
    suppliers: [],
    partTypes: [],
    isAutoParts: false
  });
  
  const currentStockFilters = stockFilters || localStockFilters;

  const isInventoryPage = location.pathname.startsWith("/inventory");
  const isStockStatusPage = location.pathname === "/inventory/stock" || location.pathname === "/inventory";
  
  const handleStockFiltersChange = (newFilters: StockFilters) => {
    console.log("Sidebar received filter change:", newFilters);
    
    const currentFiltersString = JSON.stringify(currentStockFilters);
    const newFiltersString = JSON.stringify(newFilters);
    
    if (currentFiltersString !== newFiltersString && previousFiltersRef.current !== newFiltersString) {
      console.log("Filters are different, updating state");
      previousFiltersRef.current = newFiltersString;
      
      if (onStockFiltersChange) {
        onStockFiltersChange(newFilters);
      } else {
        setLocalStockFilters(newFilters);
      }
    } else {
      console.log("Filters are the same, not updating state");
    }
  };
  
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };
  
  const SidebarContent = ({ collapsed = false, handleDrawerClose = () => {} }) => (
    <div className={cn(
      "h-full flex flex-col bg-sidebar-background border-r border-sidebar-border p-3 overflow-y-auto scrollbar-none",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center py-2 mb-3">
        {collapsed ? (
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mx-auto">
            <Package className="h-6 w-6 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">AutoParts Pro</h2>
              <p className="text-xs text-muted-foreground">Hardware System</p>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 mt-2">
        {SIDEBAR_ITEMS.map((item, index) => {
          const isInventoryItem = item.href === "/inventory";
          
          return (
            <div key={item.href}>
              <NavItem 
                item={item} 
                collapsed={collapsed} 
                userRole={userRole}
              />
              
              {isInventoryItem && isStockStatusPage && !collapsed && (
                <div className="pl-6 mt-1 mb-4 border-l-2 border-sidebar-border">
                  <div className="py-2 text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Stock Filters
                  </div>
                  <div 
                    className="relative" 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      <StockStatusSidebar 
                        products={MOCK_PRODUCTS} 
                        onFilterChange={handleStockFiltersChange}
                        initialFilters={currentStockFilters}
                        compact 
                      />
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>

      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <Button
            variant="ghost" 
            className="w-full flex items-center gap-3 p-2 justify-start rounded-md"
            onClick={() => setProfileModalOpen(true)}
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium truncate">
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Guest"}
              </p>
              <p className="text-xs text-muted-foreground truncate">Role-based access</p>
            </div>
          </Button>
        </div>
      )}
      
      <UserProfileModal 
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        userRole={userRole}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-30"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 backdrop-blur-lg max-w-[280px]">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return <div className="h-screen fixed left-0 top-0 z-30 w-64">
    <SidebarContent />
  </div>;
};
