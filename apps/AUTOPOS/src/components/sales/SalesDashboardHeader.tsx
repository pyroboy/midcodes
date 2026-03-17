
import React from "react";
import { ShoppingBag, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Customer } from "@/types/sales";

interface SalesDashboardHeaderProps {
  activeCustomer: Customer | null;
  cartItemCount: number;
  onOpenCart: () => void;
}

export const SalesDashboardHeader: React.FC<SalesDashboardHeaderProps> = ({
  activeCustomer,
  cartItemCount,
  onOpenCart,
}) => {
  // Get current date in a readable format
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Sales Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeCustomer && (
            <Card className="bg-primary/10 px-3 py-2 flex items-center gap-2 border-primary/20">
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

          <Button
            onClick={onOpenCart}
            variant="outline"
            className="relative"
            disabled={cartItemCount === 0}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
