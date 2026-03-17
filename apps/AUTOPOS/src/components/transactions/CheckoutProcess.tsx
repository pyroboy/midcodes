import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  Banknote,
  Receipt,
  ShoppingCart,
  User,
  DollarSign,
  Check,
  Truck,
  ChevronRight,
  ChevronLeft,
  Clock,
  X
} from "lucide-react";
import { CartItem } from "@/types/sales";

const mockCartItems: CartItem[] = [
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
];

type CheckoutStep = "cart" | "customer" | "payment" | "confirmation";

interface CheckoutProcessProps {
  onOrderComplete?: (orderId: string) => void;
}

export const CheckoutProcess = ({ onOrderComplete }: CheckoutProcessProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("ORD-1025");
  
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0
  );
  const taxRate = 0.0825; // 8.25%
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity
    };
    
    setCartItems(updatedItems);
    toast(`Updated quantity for ${updatedItems[index].product.name}`);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...cartItems];
    const removedItem = updatedItems[index];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
    toast(`Removed ${removedItem.product.name} from cart`);
  };

  const handleContinue = () => {
    if (currentStep === "cart") {
      if (cartItems.length === 0) {
        toast("Cart is empty. Please add items to proceed.");
        return;
      }
      setCurrentStep("customer");
      toast("Proceed to customer selection");
    } else if (currentStep === "customer") {
      if (!selectedCustomer) {
        toast("Please select or create a customer to proceed.");
        return;
      }
      setCurrentStep("payment");
      toast("Proceed to payment method");
    } else if (currentStep === "payment") {
      if (!paymentMethod) {
        toast("Please select a payment method.");
        return;
      }
      if (paymentMethod === "cash" && (!cashAmount || parseFloat(cashAmount) < total)) {
        toast("Please enter a valid cash amount.");
        return;
      }
      setCurrentStep("confirmation");
      toast("Please review and confirm your order");
    } else if (currentStep === "confirmation") {
      completeOrder();
    }
  };

  const handleBack = () => {
    if (currentStep === "customer") {
      setCurrentStep("cart");
      toast("Back to cart");
    }
    else if (currentStep === "payment") {
      setCurrentStep("customer");
      toast("Back to customer selection");
    }
    else if (currentStep === "confirmation") {
      setCurrentStep("payment");
      toast("Back to payment method");
    }
  };

  const completeOrder = () => {
    setOrderPlaced(true);
    toast.success("Order completed successfully!");
    
    setTimeout(() => {
      if (onOrderComplete) {
        onOrderComplete(orderId);
      }
    }, 2000);
  };

  const resetCheckout = () => {
    setCartItems([]);
    setSelectedCustomer("");
    setPaymentMethod("");
    setCashAmount("");
    setCurrentStep("cart");
    setOrderPlaced(false);
    setOrderId(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
    toast("Ready for a new order");
  };

  return (
    <div className="md:grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Checkout Process</CardTitle>
                <CardDescription>Complete customer purchases</CardDescription>
              </div>
              {!orderPlaced && (
                <div className="flex items-center gap-1">
                  <Badge variant={currentStep === "cart" ? "default" : "outline"}>Cart</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={currentStep === "customer" ? "default" : "outline"}>Customer</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={currentStep === "payment" ? "default" : "outline"}>Payment</Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={currentStep === "confirmation" ? "default" : "outline"}>Confirm</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {orderPlaced ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Order Complete!</h2>
                <p className="text-muted-foreground">Order #{orderId} has been processed successfully.</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={resetCheckout}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>New Sale</span>
                  </Button>
                  <Button className="gap-2">
                    <Receipt className="h-4 w-4" />
                    <span>Print Receipt</span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {currentStep === "cart" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Shopping Cart</h3>
                    {cartItems.length > 0 ? (
                      <div className="space-y-3">
                        {cartItems.map((item, index) => (
                          <div key={item.product.id} className="flex justify-between items-center border-b pb-3">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-r-none"
                                  onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <Input 
                                  type="number" 
                                  value={item.quantity} 
                                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                  className="h-8 w-12 rounded-none text-center"
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-l-none"
                                  onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <div className="w-20 text-right">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <span className="sr-only">Remove</span>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                        <p className="text-muted-foreground">Add products to the cart to proceed with checkout.</p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === "customer" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Customer Information</h3>
                    
                    <Tabs defaultValue="existing">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                        <TabsTrigger value="new">New Customer</TabsTrigger>
                      </TabsList>
                      <TabsContent value="existing" className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer-search">Search Customers</Label>
                          <div className="relative">
                            <Input 
                              id="customer-search" 
                              placeholder="Enter name, phone or email"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div 
                            className="flex items-center justify-between border p-3 rounded-md bg-secondary/30 cursor-pointer"
                            onClick={() => setSelectedCustomer("CUST-001")}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">John Smith</p>
                                <p className="text-sm text-muted-foreground">john.smith@example.com</p>
                              </div>
                            </div>
                            <div>
                              {selectedCustomer === "CUST-001" && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                          
                          <div 
                            className="flex items-center justify-between border p-3 rounded-md hover:bg-secondary/30 cursor-pointer"
                            onClick={() => setSelectedCustomer("CUST-002")}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">Jane Doe</p>
                                <p className="text-sm text-muted-foreground">jane.doe@example.com</p>
                              </div>
                            </div>
                            <div>
                              {selectedCustomer === "CUST-002" && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="new" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input id="first-name" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input id="last-name" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" type="tel" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedCustomer("new-customer")}
                        >
                          Create Customer
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {currentStep === "payment" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Payment Method</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`border rounded-md p-4 cursor-pointer ${
                          paymentMethod === "credit" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setPaymentMethod("credit")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Credit Card</p>
                            <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={`border rounded-md p-4 cursor-pointer ${
                          paymentMethod === "cash" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Cash</p>
                            <p className="text-sm text-muted-foreground">Physical payment</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {paymentMethod === "credit" && (
                      <div className="space-y-4 mt-4 p-4 border rounded-md">
                        <div className="space-y-2">
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input id="card-number" placeholder="**** **** **** ****" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiration Date</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input id="cvv" placeholder="***" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-on-card">Name on Card</Label>
                          <Input id="name-on-card" />
                        </div>
                      </div>
                    )}
                    
                    {paymentMethod === "cash" && (
                      <div className="space-y-4 mt-4 p-4 border rounded-md">
                        <div className="space-y-2">
                          <Label htmlFor="cash-amount">Cash Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="cash-amount" 
                              className="pl-9" 
                              value={cashAmount}
                              onChange={(e) => setCashAmount(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {cashAmount && parseFloat(cashAmount) >= total && (
                          <div className="p-3 bg-muted rounded-md">
                            <div className="flex justify-between text-sm">
                              <span>Cash Amount:</span>
                              <span>${parseFloat(cashAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Due:</span>
                              <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium pt-2 border-t mt-2">
                              <span>Change Due:</span>
                              <span>${(parseFloat(cashAmount) - total).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === "confirmation" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Order Confirmation</h3>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h4>
                        <p className="font-medium">John Smith</p>
                        <p className="text-sm">john.smith@example.com</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h4>
                        <div className="flex items-center gap-2">
                          {paymentMethod === "credit" ? (
                            <>
                              <CreditCard className="h-4 w-4" />
                              <span>Credit Card (**** 1234)</span>
                            </>
                          ) : (
                            <>
                              <Banknote className="h-4 w-4" />
                              <span>Cash (${cashAmount})</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {cartItems.map((item) => (
                            <div key={item.product.id} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax (8.25%):</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t mt-2">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          {!orderPlaced && (
            <CardFooter className="flex justify-between">
              {currentStep !== "cart" ? (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              <Button onClick={handleContinue} className="animate-pulse">
                {currentStep === "confirmation" ? "Complete Order" : "Continue"}
                {currentStep !== "confirmation" && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items in cart</p>
            ) : (
              <>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (8.25%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t mt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">In-Store Pickup</SelectItem>
                <SelectItem value="standard">Standard Shipping (3-5 days)</SelectItem>
                <SelectItem value="express">Express Shipping (1-2 days)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
              <Clock className="h-4 w-4" />
              <span>Estimated pickup time: 30 minutes</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
