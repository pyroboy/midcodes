
import { Order } from "@/types/sales";
import { OrderListItem } from "./OrderListItem";
import { EmptyOrdersList } from "./EmptyOrdersList";

interface OrdersTableProps {
  filteredOrders: Order[];
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
}

export const OrdersTable = ({ filteredOrders, onViewDetails, onEditOrder }: OrdersTableProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 flex items-center font-medium text-sm">
        <div className="flex-1">Order Details</div>
        <div className="flex-1 text-center">Customer</div>
        <div className="flex-1 text-center">Date</div>
        <div className="w-20 text-center">Status</div>
        <div className="w-48"></div>
      </div>
      
      <div className="divide-y">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderListItem 
              key={order.id} 
              order={order} 
              onViewDetails={onViewDetails}
              onEditOrder={onEditOrder}
            />
          ))
        ) : (
          <EmptyOrdersList />
        )}
      </div>
    </div>
  );
};
