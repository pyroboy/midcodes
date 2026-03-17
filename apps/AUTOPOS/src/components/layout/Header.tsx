
import { useState, useEffect } from "react";
import { 
  ShoppingBag, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CartItem, Customer } from "@/types/sales";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { Card } from "@/components/ui/card";

interface HeaderProps {
  userRole?: string | null;
  onLogout?: () => void;
}

export const Header = ({ userRole, onLogout = () => {} }: HeaderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const isMobile = useIsMobile();

  // Initialize theme on first render
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail)) {
        const totalItems = event.detail.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        setCartItemCount(totalItems);
      }
    };

    window.addEventListener('cart-updated' as any, handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener('cart-updated' as any, handleCartUpdate as EventListener);
    };
  }, []);

  // Listen for customer selection events
  useEffect(() => {
    const handleCustomerSelect = (event: CustomEvent) => {
      if (event.detail) {
        setActiveCustomer(event.detail);
      }
    };

    window.addEventListener('customer-selected' as any, handleCustomerSelect as EventListener);
    return () => {
      window.removeEventListener('customer-selected' as any, handleCustomerSelect as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  // Handle cart click
  const handleCartClick = () => {
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-col items-center border-b bg-background">
        <div className="flex h-16 w-full items-center px-4 sm:px-6">
          <div className="flex-1">
            {userRole === "sales" && activeCustomer && (
              <Card className="bg-primary/10 px-3 py-2 inline-flex items-center gap-2 border-primary/20">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {activeCustomer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{activeCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{activeCustomer.email}</p>
                </div>
              </Card>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NotificationSystem />
            {userRole === "sales" && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={handleCartClick}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
