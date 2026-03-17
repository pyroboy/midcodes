
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types/sales";
import { formatDate, getCustomerName, getStatusBadge } from "../utils/orderUtils";

interface OrderListItemProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
}

export const OrderListItem = ({ order, onViewDetails, onEditOrder }: OrderListItemProps) => {
  return (
    <div className="px-4 py-3 flex items-center text-sm hover:bg-muted/30">
      <div className="flex-1">
        <div className="font-medium">{order.id}</div>
        <div className="text-xs text-muted-foreground">
          {order.items.length} item{order.items.length !== 1 ? "s" : ""} • ${order.total.toFixed(2)}
        </div>
      </div>
      <div className="flex-1 text-center">
        <div>{getCustomerName(order.customerId)}</div>
        <div className="text-xs text-muted-foreground">{order.customerId}</div>
      </div>
      <div className="flex-1 text-center">
        <div>{formatDate(order.date)}</div>
      </div>
      <div className="w-20 flex justify-center">
        <Badge variant={getStatusBadge(order.status) as any}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>
      <div className="w-48 flex justify-end gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onViewDetails(order)}
        >
          View
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEditOrder(order)}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
