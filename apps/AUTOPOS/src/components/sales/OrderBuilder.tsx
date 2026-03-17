
import { useState } from "react";
import { Trash2, Plus, Minus, User, CreditCard, Receipt, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer, CartItem } from "@/types/sales";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface OrderBuilderProps {
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  customer: Customer | null;
  onSelectCustomer: () => void;
}

export const OrderBuilder = ({ items, setItems, customer, onSelectCustomer }: OrderBuilderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState<number | null>(null);
  const handleQuantityChange = (index: number, change: number) => {
    const updatedItems = [...items];
    const newQuantity = updatedItems[index].quantity + change;
    
    if (newQuantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].quantity = newQuantity;
    }
    
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (!customer) {
      toast({
        title: "Customer required",
        description: "Please select a customer before checkout",
        variant: "destructive",
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Empty order",
        description: "Please add items to the order before checkout",
        variant: "destructive",
      });
      return;
    }
    
    setCheckoutStep(1);
  };

  const completeOrder = () => {
    toast({
      title: "Order completed",
      description: `Order placed for ${customer?.name} with ${items.length} items`,
    });
    setItems([]);
    setCheckoutStep(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Card className="border-0 shadow-none mb-4">
          <CardHeader className="px-0 pt-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItems([]);
                    toast({
                      title: "Cart cleared",
                      description: "All items have been removed from cart",
                    });
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={item.product.id} 
                    className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-background border rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img 
                        src={item.product.imageUrl || "/placeholder.svg"} 
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-sm">{item.product.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>SKU: {item.product.sku}</span>
                        <span className="text-[10px] mx-1">•</span>
                        <span>${item.product.price.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleQuantityChange(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleQuantityChange(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive ml-1"
                          onClick={() => {
                            const updatedItems = items.filter((_, i) => i !== index);
                            setItems(updatedItems);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-medium text-sm">
                        ${(item.quantity * item.product.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Add items from the Catalog to build your order.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-auto">
        <Card className="border-0 shadow-none">
          <CardContent className="px-0 pt-0 pb-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(calculateTotal() * 0.0825).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${(calculateTotal() * 1.0825).toFixed(2)}</span>
                </div>
              </div>
              
              <div>
                <div 
                  className={`flex items-center gap-3 p-3 rounded-md mb-4 cursor-pointer ${
                    customer ? "bg-primary/10 hover:bg-primary/20" : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={onSelectCustomer}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    customer ? "bg-primary/20" : "bg-muted-foreground/20"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  {customer ? (
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="font-medium">No customer selected</div>
                      <div className="text-xs text-muted-foreground">Click to select a customer</div>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Checkout Overlay (simplified) */}
      {checkoutStep !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>
                {checkoutStep === 1 && "Payment Method"}
                {checkoutStep === 2 && "Order Confirmation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutStep === 1 && (
                <div className="space-y-4">
                  <div 
                    className="bg-muted/50 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setCheckoutStep(null);
                      navigate("/transactions/checkout");
                    }}
                  >
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-medium">Credit Card</div>
                      <div className="text-xs text-muted-foreground">Pay with credit or debit card</div>
                    </div>
                  </div>
                  <div 
                    className="bg-muted/50 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setCheckoutStep(null);
                      navigate("/transactions/checkout");
                    }}
                  >
                    <Receipt className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-medium">Invoice</div>
                      <div className="text-xs text-muted-foreground">Bill to customer account</div>
                    </div>
                  </div>
                </div>
              )}
              
              {checkoutStep === 2 && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Order Summary</div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Customer</div>
                      <div className="font-medium">{customer?.name}</div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-1">Items</div>
                      <div className="text-sm space-y-1">
                        {items.map(item => (
                          <div key={item.product.id} className="flex justify-between">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span>PHP {(item.quantity * item.product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${(calculateTotal() * 1.0825).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">Email Receipt</div>
                      <div className="text-sm text-muted-foreground">A copy will be sent to {customer?.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (checkoutStep > 1) {
                    setCheckoutStep(checkoutStep - 1);
                  } else {
                    setCheckoutStep(null);
                  }
                }}
              >
                {checkoutStep > 1 ? "Back" : "Cancel"}
              </Button>
              <Button
                onClick={() => {
                  if (checkoutStep < 2) {
                    setCheckoutStep(checkoutStep + 1);
                  } else {
                    completeOrder();
                  }
                }}
              >
                {checkoutStep < 2 ? "Continue" : "Complete Order"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
