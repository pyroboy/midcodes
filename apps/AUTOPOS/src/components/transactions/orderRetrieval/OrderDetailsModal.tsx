
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Order } from "@/types/sales";
import { formatDate, getCustomerName, getStatusBadge } from "../utils/orderUtils";

interface OrderDetailsModalProps {
  selectedOrder: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateReceipt: (orderId: string) => void;
}

export const OrderDetailsModal = ({ 
  selectedOrder, 
  open, 
  onOpenChange,
  onGenerateReceipt
}: OrderDetailsModalProps) => {
  if (!selectedOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
              <p className="font-medium">{getCustomerName(selectedOrder.customerId)}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
              <p className="font-medium">{formatDate(selectedOrder.date)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
            <div>
              <Badge variant={getStatusBadge(selectedOrder.status) as any}>
                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h3>
            <div className="space-y-2">
              {selectedOrder.items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>${item.product.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>${selectedOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tax (8.25%):</span>
              <span>${(selectedOrder.total * 0.0825).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total:</span>
              <span>${(selectedOrder.total * 1.0825).toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => onGenerateReceipt(selectedOrder.id)}
          >
            Generate Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
