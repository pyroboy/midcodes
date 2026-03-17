
import { useState } from "react";
import { Package, Search, RotateCcw, AlertCircle, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Customer, Order, CartItem, Return } from "@/types/sales";
import { MOCK_ORDERS } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

interface ReturnsInitiationProps {
  customer: Customer | null;
}

export const ReturnsInitiation = ({ customer }: ReturnsInitiationProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: {selected: boolean, reason: string}}>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [returnCompleted, setReturnCompleted] = useState(false);

  const filteredOrders = customer 
    ? MOCK_ORDERS.filter(order => order.customerId === customer.id)
    : MOCK_ORDERS;

  const searchedOrders = searchQuery 
    ? filteredOrders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredOrders;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    
    // Initialize selected items state
    const initialSelectedItems: {[key: string]: {selected: boolean, reason: string}} = {};
    order.items.forEach(item => {
      // Convert product.id to string to ensure it's used as a valid object key
      const productIdKey = String(item.product.id);
      initialSelectedItems[productIdKey] = { selected: false, reason: "" };
    });
    
    setSelectedItems(initialSelectedItems);
    setStep(2);
  };

  const handleItemSelection = (productId: string | number, selected: boolean) => {
    // Convert productId to string to ensure it's used as a valid object key
    const productIdKey = String(productId);
    setSelectedItems({
      ...selectedItems,
      [productIdKey]: { ...selectedItems[productIdKey], selected }
    });
  };

  const handleReasonChange = (productId: string | number, reason: string) => {
    // Convert productId to string to ensure it's used as a valid object key
    const productIdKey = String(productId);
    setSelectedItems({
      ...selectedItems,
      [productIdKey]: { ...selectedItems[productIdKey], reason }
    });
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedItems).filter(item => item.selected).length;
  };

  const handleInitiateReturn = () => {
    // Validation
    const hasSelectedItems = getSelectedItemsCount() > 0;
    const allSelectedItemsHaveReason = Object.entries(selectedItems)
      .filter(([_, item]) => item.selected)
      .every(([_, item]) => item.reason.trim().length > 0);
    
    if (!hasSelectedItems) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to return",
        variant: "destructive",
      });
      return;
    }
    
    if (!allSelectedItemsHaveReason) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for all selected items",
        variant: "destructive",
      });
      return;
    }
    
    setStep(3);
  };

  const handleConfirmReturn = () => {
    // Create return record (in a real app, this would be sent to the backend)
    const newReturn: Return = {
      id: `ret-${Date.now()}`,
      orderId: selectedOrder?.id || "",
      customerId: customer?.id || "",
      items: selectedOrder?.items
        .filter(item => {
          // Convert product.id to string for object key lookup
          const productIdKey = String(item.product.id);
          return selectedItems[productIdKey]?.selected;
        })
        .map(item => {
          // Convert product.id to string for object key lookup
          const productIdKey = String(item.product.id);
          return {
            product: item.product,
            quantity: item.quantity,
            reason: selectedItems[productIdKey].reason
          };
        }) || [],
      status: "pending",
      date: new Date().toISOString()
    };
    
    toast({
      title: "Return initiated",
      description: `Return #${newReturn.id} has been created and is pending approval`,
    });
    
    setReturnCompleted(true);
  };

  const resetReturn = () => {
    setSelectedOrder(null);
    setSelectedItems({});
    setStep(1);
    setReturnCompleted(false);
    setSearchQuery("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Returns Initiation</CardTitle>
              <CardDescription>Process customer returns in a few easy steps</CardDescription>
            </div>
            {step > 1 && !returnCompleted && (
              <Button variant="ghost" size="sm" onClick={resetReturn}>
                Start Over
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!customer && step === 1 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Customer Selected</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Please select a customer from the Customers tab before initiating a return.
              </p>
            </div>
          )}
          
          {customer && step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Select Order to Return</h3>
                  <p className="text-sm text-muted-foreground">
                    Find the order that contains the items to be returned
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or product name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                {searchedOrders.length > 0 ? (
                  searchedOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectOrder(order)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Order #{order.id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.total.toFixed(2)}</div>
                          <div className="text-xs px-2 py-0.5 bg-primary/10 rounded-full">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <div className="text-muted-foreground mb-1">Items:</div>
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.product.id} className="flex justify-between">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>${(item.quantity * item.product.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium">No Orders Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {customer?.purchaseHistory?.length === 0
                        ? "This customer has no previous orders"
                        : "Try a different search term"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {step === 2 && selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Select Items to Return</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which items to return and provide a reason
                  </p>
                </div>
              </div>
              
              <div className="border-b pb-2 mb-2">
                <div className="font-medium text-sm">Order #{selectedOrder.id}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selectedOrder.date).toLocaleDateString()} • ${selectedOrder.total.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedOrder.items.map(item => (
                  <div key={item.product.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`item-${item.product.id}`}
                        className="mt-1"
                        checked={selectedItems[item.product.id]?.selected || false}
                        onChange={(e) => handleItemSelection(item.product.id, e.target.checked)}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`item-${item.product.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {item.quantity}x {item.product.name}
                        </label>
                        <div className="text-sm text-muted-foreground">
                          ${item.product.price.toFixed(2)} each • Total: ${(item.quantity * item.product.price).toFixed(2)}
                        </div>
                        
                        {selectedItems[item.product.id]?.selected && (
                          <div className="mt-3">
                            <label className="text-sm font-medium mb-1 block">
                              Reason for Return <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                              placeholder="Please explain why you're returning this item..."
                              value={selectedItems[item.product.id]?.reason || ""}
                              onChange={(e) => handleReasonChange(item.product.id, e.target.value)}
                              className="h-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && !returnCompleted && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Confirm Return</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and confirm the items to be returned
                  </p>
                </div>
              </div>
              
              <div className="border rounded-lg divide-y">
                <div className="p-4">
                  <h4 className="font-medium mb-2">Return Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{customer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number:</span>
                      <span className="font-medium">#{selectedOrder?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Return Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items to Return:</span>
                      <span className="font-medium">{getSelectedItemsCount()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium mb-2">Return Items</h4>
                  <div className="space-y-3">
                    {selectedOrder?.items
                      .filter(item => selectedItems[item.product.id]?.selected)
                      .map(item => (
                        <div key={item.product.id} className="flex justify-between">
                          <div>
                            <div>{item.quantity}x {item.product.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Reason: {selectedItems[item.product.id]?.reason}
                            </div>
                          </div>
                          <div className="font-medium">
                            ${(item.quantity * item.product.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Refund Amount</div>
                  <div className="text-lg font-bold">
                    ${selectedOrder?.items
                      .filter(item => selectedItems[item.product.id]?.selected)
                      .reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  All returns are subject to inspection. Refunds will be processed within 5-7 business days after approval.
                </p>
              </div>
            </div>
          )}
          
          {returnCompleted && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-medium">Return Successfully Initiated</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Your return request has been submitted and is pending approval. You will receive a confirmation email with further instructions.
              </p>
              <Button
                className="mt-6"
                onClick={resetReturn}
              >
                Initiate Another Return
              </Button>
            </div>
          )}
        </CardContent>
        
        {!returnCompleted && (
          <CardFooter className="flex justify-end gap-2">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step === 3 ? 2 : 1 as any)}
              >
                Back
              </Button>
            )}
            
            {step === 2 && (
              <Button 
                onClick={handleInitiateReturn}
                disabled={getSelectedItemsCount() === 0}
              >
                Continue
              </Button>
            )}
            
            {step === 3 && (
              <Button onClick={handleConfirmReturn}>
                Confirm Return
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

