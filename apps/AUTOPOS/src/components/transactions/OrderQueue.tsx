import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Clock, 
  Package, 
  Check, 
  X, 
  ChevronRight, 
  Search,
  CreditCard 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Order } from "@/types/sales";

export interface OrderQueueProps {
  onProcessOrder?: (orderId: string) => void;
}

const mockOrders: Order[] = [
  {
    id: "ORD-1001",
    customerId: "CUST-001",
    items: [
      {
        product: {
          id: "PROD-001",
          name: "Brake Pad Set",
          description: "High-performance brake pads for sedans",
          price: 45.99,
          category: "Brakes",
          sku: "BP-S-001",
          imageUrl: "/placeholder.svg",
          stock: 28,
          manufacturer: "StopTech",
          location: "A1-B2"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-002",
          name: "Oil Filter",
          description: "Premium oil filter for most vehicles",
          price: 8.99,
          category: "Filters",
          sku: "OF-P-002",
          imageUrl: "/placeholder.svg",
          stock: 45,
          manufacturer: "Fram",
          location: "A3-B4"
        },
        quantity: 2
      }
    ],
    total: 63.97,
    status: "pending",
    date: "2023-08-15T14:30:00Z"
  },
  {
    id: "ORD-1002",
    customerId: "CUST-002",
    items: [
      {
        product: {
          id: "PROD-003",
          name: "Spark Plug Set",
          description: "Set of 4 high-performance spark plugs",
          price: 22.99,
          category: "Ignition",
          sku: "SP-HP-003",
          imageUrl: "/placeholder.svg",
          stock: 30,
          manufacturer: "NGK",
          location: "C1-D2"
        },
        quantity: 1
      }
    ],
    total: 22.99,
    status: "pending",
    date: "2023-08-15T15:45:00Z"
  },
  {
    id: "ORD-1003",
    customerId: "CUST-003",
    items: [
      {
        product: {
          id: "PROD-004",
          name: "Windshield Wiper Blades",
          description: "All-season windshield wiper blades (pair)",
          price: 34.99,
          category: "Exterior",
          sku: "WW-AS-004",
          imageUrl: "/placeholder.svg",
          stock: 22,
          manufacturer: "Rain-X",
          location: "E1-F2"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-005",
          name: "Air Filter",
          description: "Engine air filter for improved performance",
          price: 12.99,
          category: "Filters",
          sku: "AF-EP-005",
          imageUrl: "/placeholder.svg",
          stock: 38,
          manufacturer: "K&N",
          location: "A5-B6"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-006",
          name: "Synthetic Oil (5qt)",
          description: "Full synthetic motor oil 5W-30",
          price: 28.99,
          category: "Fluids",
          sku: "SO-5W30-006",
          imageUrl: "/placeholder.svg",
          stock: 42,
          manufacturer: "Mobil 1",
          location: "G1-H2"
        },
        quantity: 1
      }
    ],
    total: 76.97,
    status: "pending",
    date: "2023-08-15T16:20:00Z"
  }
];

export const OrderQueue = ({ onProcessOrder }: OrderQueueProps) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const handleStatusChange = (orderId: string, status: "completed" | "cancelled" | "pending") => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    
    toast(`Order ${orderId} ${status}`);
    
    if (status === "completed" && onProcessOrder) {
      onProcessOrder(orderId);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setViewDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-500 text-white">Pending</Badge>;
    }
  };

  const getTimeElapsed = (dateString: string) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    }
  };

  const getCustomerName = (customerId: string) => {
    const customerMap: {[key: string]: string} = {
      "CUST-001": "John Smith",
      "CUST-002": "Jane Doe",
      "CUST-003": "Alex Johnson"
    };
    
    return customerMap[customerId] || "Unknown Customer";
  };

  const proceedToCheckout = (orderId: string) => {
    if (onProcessOrder) {
      onProcessOrder(orderId);
    } else {
      toast.success(`Order ${orderId} ready for checkout`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm">Refresh</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:border-primary/50 transition-colors hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{order.id}</CardTitle>
                {getStatusBadge(order.status)}
              </div>
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{getTimeElapsed(order.date)}</span>
                <span className="mx-1">•</span>
                <span>{getCustomerName(order.customerId)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium">Items: {order.items.length}</div>
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.product.id} className="flex items-center gap-1.5 bg-secondary rounded-full py-1 px-3 text-xs">
                      <span>{item.quantity}x</span>
                      <span className="font-medium truncate max-w-[100px]">{item.product.name}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="bg-secondary rounded-full py-1 px-3 text-xs">
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center font-medium pt-2">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2 pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => viewOrderDetails(order)}
              >
                <Package className="mr-1 h-4 w-4" />
                View Details
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 gap-1"
                onClick={() => proceedToCheckout(order.id)}
              >
                <CreditCard className="h-4 w-4" />
                <span>Checkout</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details: {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h3>
                <p className="font-medium">{getCustomerName(selectedOrder.customerId)}</p>
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
              
              <div className="flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => {
                    setViewDetailsOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span>Close</span>
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => {
                    proceedToCheckout(selectedOrder.id);
                    setViewDetailsOpen(false);
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Checkout</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
