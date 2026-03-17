import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { LoginModal } from "../auth/LoginModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { FadeIn } from "../ui/motion/Transitions";
import { StockFilters } from "@/components/inventory/StockStatusSidebar";

interface AppLayoutProps {
  children: ReactNode;
  userRole?: string | null;
  onLogin: (role: string) => void;
  onLogout?: () => void;
  customSidebar?: ReactNode;
  stockFilters?: StockFilters;
  onStockFiltersChange?: (filters: StockFilters) => void;
}

export const AppLayout = ({ 
  children, 
  userRole, 
  onLogin, 
  onLogout, 
  customSidebar,
  stockFilters,
  onStockFiltersChange
}: AppLayoutProps) => {
  const isMobile = useIsMobile();

  // Add event listener for cart opening
  useEffect(() => {
    const handleOpenCart = () => {
      // We want to dispatch a custom event that the SalesInterface component can listen for
      const event = new CustomEvent('open-order-builder');
      window.dispatchEvent(event);
    };

    window.addEventListener('open-cart', handleOpenCart);
    
    return () => {
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, []);

  if (!userRole) {
    return <LoginModal onLogin={onLogin} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {customSidebar ? (
        <div className={cn(
          "h-full border-r border-sidebar-border bg-sidebar-background",
          isMobile ? "hidden" : "w-64"
        )}>
          {customSidebar}
        </div>
      ) : (
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          stockFilters={stockFilters}
          onStockFiltersChange={onStockFiltersChange}
        />
      )}
      <div 
        className={cn(
          "flex flex-col flex-1 h-full transition-all duration-300",
          isMobile ? "ml-0" : "ml-64"
        )}
      >
        <Header userRole={userRole} />
        <FadeIn className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
