import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CatalogExplorer } from "@/components/sales/CatalogExplorer";
import { OrderBuilder } from "@/components/sales/OrderBuilder";
import { CustomerManagement } from "@/components/sales/CustomerManagement";
import { ReturnsInitiation } from "@/components/sales/ReturnsInitiation";
import { Users, RotateCcw, Package, Search, Clock } from "lucide-react";
import { toast } from "sonner";
import { Product, Customer, CartItem } from "@/types/sales";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SalesDashboardHeader } from "@/components/sales/SalesDashboardHeader";
import { SalesMetrics } from "@/components/sales/SalesMetrics";
import { formatCurrency } from "@/lib/formatters";

const SalesInterface = () => {
  const [userRole, setUserRole] = useState<string | null>("sales");
  const [activeOrder, setActiveOrder] = useState<CartItem[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const location = useLocation();
  
  const currentSection = location.pathname.split('/').pop() || 'products';

  useEffect(() => {
    const event = new CustomEvent('cart-updated', { detail: activeOrder });
    window.dispatchEvent(event);
  }, [activeOrder]);

  useEffect(() => {
    const handleOpenOrderBuilder = () => {
      setOrderSheetOpen(true);
    };
    window.addEventListener('open-order-builder', handleOpenOrderBuilder);
    return () => {
      window.removeEventListener('open-order-builder', handleOpenOrderBuilder);
    };
  }, []);

  useEffect(() => {
    const handleHeaderCartClick = () => {
      if (activeOrder.length > 0) {
        setOrderSheetOpen(true);
      } else {
        toast("Cart empty", {
          description: "Add items to your cart first"
        });
      }
    };
    
    window.addEventListener('open-cart', handleHeaderCartClick);
    return () => {
      window.removeEventListener('open-cart', handleHeaderCartClick);
    };
  }, [activeOrder]);

  useEffect(() => {
    if (activeCustomer) {
      const event = new CustomEvent('customer-selected', { detail: activeCustomer });
      window.dispatchEvent(event);
    }
  }, [activeCustomer]);

  const handleAddToCart = (product: Product) => {
    const existingItemIndex = activeOrder.findIndex(item => item.product.id === product.id);
    if (existingItemIndex >= 0) {
      const updatedOrder = [...activeOrder];
      updatedOrder[existingItemIndex].quantity += 1;
      setActiveOrder(updatedOrder);
    } else {
      setActiveOrder([...activeOrder, {
        product,
        quantity: 1
      }]);
    }
    toast("Item added", {
      description: `${product.name} added to cart (${formatCurrency(product.price)})`
    });
  };

  const handleCustomerSelect = (customer: Customer) => {
    setActiveCustomer(customer);
    toast("Customer selected", {
      description: `${customer.name} selected`
    });
  };

  return (
    <AppLayout userRole={userRole} onLogin={setUserRole} onLogout={() => setUserRole(null)}>
      <div className="space-y-6">
        <div className="space-y-8">
          {(currentSection === "products" || currentSection === "sales") && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Catalog Explorer</h2>
              <CatalogExplorer onAddToCart={handleAddToCart} />
            </div>
          )}
          {currentSection === "customers" && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Customer Management</h2>
              <CustomerManagement onCustomerSelect={handleCustomerSelect} activeCustomer={activeCustomer} />
            </div>
          )}
          {currentSection === "returns" && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Returns</h2>
              <ReturnsInitiation customer={activeCustomer} />
            </div>
          )}
        </div>
      </div>

      <Sheet open={orderSheetOpen} onOpenChange={setOrderSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Order Builder</SheetTitle>
            <SheetDescription>Build and manage your customer order</SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-90px)] overflow-y-auto px-6 pb-6">
            <OrderBuilder 
              items={activeOrder} 
              setItems={setActiveOrder} 
              customer={activeCustomer} 
              onSelectCustomer={() => {
                setOrderSheetOpen(false);
                window.location.href = '/sales/customers';
                document.getElementById("customer-modal-trigger")?.click();
              }} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default SalesInterface;
