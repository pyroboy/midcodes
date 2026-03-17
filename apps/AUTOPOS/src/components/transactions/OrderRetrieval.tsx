
import { useState } from "react";
import { Order } from "@/types/sales";
import { mockOrdersHistory, getCustomerName } from "./utils/orderUtils";
import { OrderSearchFilters } from "./orderRetrieval/OrderSearchFilters";
import { OrdersTable } from "./orderRetrieval/OrdersTable";
import { OrderDetailsModal } from "./orderRetrieval/OrderDetailsModal";
import { OrderEditorModal } from "./orderRetrieval/OrderEditorModal";
import { toast } from "sonner";

interface OrderRetrievalProps {
  onOrderSelect?: (orderId: string) => void;
}

export const OrderRetrieval = ({ onOrderSelect }: OrderRetrievalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderEditorOpen, setOrderEditorOpen] = useState(false);
  
  const filteredOrders = mockOrdersHistory.filter(order => {
    const customerName = getCustomerName(order.customerId).toLowerCase();
    const orderId = order.id.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const searchMatch = 
      searchTerm === "" || 
      orderId.includes(searchLower) || 
      customerName.includes(searchLower);
    
    const statusMatch = 
      statusFilter === "all" || 
      order.status === statusFilter;
    
    let dateMatch = true;
    const orderDate = new Date(order.date);
    const now = new Date();
    
    switch(dateFilter) {
      case "today":
        dateMatch = orderDate.toDateString() === now.toDateString();
        break;
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateMatch = orderDate >= weekAgo;
        break;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateMatch = orderDate >= monthAgo;
        break;
    }
    
    return searchMatch && statusMatch && dateMatch;
  });

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderEditorOpen(true);
  };

  const handleOrderSaved = (orderId: string) => {
    toast.success(`Order #${orderId} has been updated`);
    if (onOrderSelect) {
      onOrderSelect(orderId);
    }
  };

  return (
    <div className="space-y-6">
      <OrderSearchFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />
      
      <OrdersTable 
        filteredOrders={filteredOrders}
        onViewDetails={viewOrderDetails}
        onEditOrder={handleEditOrder}
      />
      
      <OrderDetailsModal
        selectedOrder={selectedOrder}
        open={orderDetailsOpen}
        onOpenChange={setOrderDetailsOpen}
        onGenerateReceipt={onOrderSelect}
      />

      <OrderEditorModal
        order={selectedOrder}
        open={orderEditorOpen}
        onOpenChange={setOrderEditorOpen}
        onSave={handleOrderSaved}
      />
    </div>
  );
};
