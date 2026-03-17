import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Printer, FileText, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReceiptGeneratorProps {
  onReceiptGenerated?: (orderId: string) => void;
}

export const ReceiptGenerator = ({ onReceiptGenerated }: ReceiptGeneratorProps) => {
  const [selectedOrder, setSelectedOrder] = useState<string>("ORD-1001");
  const [receiptOptions, setReceiptOptions] = useState({
    includeTaxDetails: true,
    includeCompanyLogo: true,
    includeItemizedList: true,
    includeCustomerInfo: true,
    includeMerchantCopy: false,
  });

  const handleOptionChange = (option: keyof typeof receiptOptions) => {
    setReceiptOptions({
      ...receiptOptions,
      [option]: !receiptOptions[option],
    });
  };

  const handlePrint = () => {
    toast.success("Receipt sent to printer");
    if (onReceiptGenerated) {
      onReceiptGenerated(selectedOrder);
    }
  };

  const handleEmail = () => {
    toast.success("Receipt sent via email");
    if (onReceiptGenerated) {
      onReceiptGenerated(selectedOrder);
    }
  };

  const handleDownload = () => {
    toast.success("Receipt downloaded as PDF");
    if (onReceiptGenerated) {
      onReceiptGenerated(selectedOrder);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Select an order to generate a receipt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/30 cursor-pointer">
                <div>
                  <p className="font-medium">Order #ORD-1001</p>
                  <p className="text-sm text-muted-foreground">John Smith • $63.97</p>
                </div>
                <Button size="sm" variant="outline">Select</Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/30 cursor-pointer">
                <div>
                  <p className="font-medium">Order #ORD-1002</p>
                  <p className="text-sm text-muted-foreground">Jane Doe • $22.99</p>
                </div>
                <Button size="sm" variant="outline">Select</Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/30 cursor-pointer">
                <div>
                  <p className="font-medium">Order #ORD-1003</p>
                  <p className="text-sm text-muted-foreground">Alex Johnson • $76.97</p>
                </div>
                <Button size="sm" variant="outline">Select</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <Label htmlFor="order-search">Search Orders</Label>
              <Input id="order-search" placeholder="Enter order number or customer name" />
            </div>
          </CardFooter>
        </Card>
        
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Receipt Options</CardTitle>
            <CardDescription>Customize the receipt output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tax-details" 
                  checked={receiptOptions.includeTaxDetails}
                  onCheckedChange={() => handleOptionChange('includeTaxDetails')}
                />
                <Label htmlFor="tax-details">Include tax details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="company-logo" 
                  checked={receiptOptions.includeCompanyLogo}
                  onCheckedChange={() => handleOptionChange('includeCompanyLogo')}
                />
                <Label htmlFor="company-logo">Include company logo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="itemized-list" 
                  checked={receiptOptions.includeItemizedList}
                  onCheckedChange={() => handleOptionChange('includeItemizedList')}
                />
                <Label htmlFor="itemized-list">Include itemized list</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="customer-info" 
                  checked={receiptOptions.includeCustomerInfo}
                  onCheckedChange={() => handleOptionChange('includeCustomerInfo')}
                />
                <Label htmlFor="customer-info">Include customer information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="merchant-copy" 
                  checked={receiptOptions.includeMerchantCopy}
                  onCheckedChange={() => handleOptionChange('includeMerchantCopy')}
                />
                <Label htmlFor="merchant-copy">Include merchant copy</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Receipt Preview</CardTitle>
          <CardDescription>Preview before printing or sending</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="border rounded-md p-4 w-80 bg-white text-black">
            <div className="text-center mb-4">
              {receiptOptions.includeCompanyLogo && (
                <div className="mx-auto h-8 w-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-xs text-gray-500">Company Logo</div>
              )}
              <h3 className="font-bold">AUTO PARTS STORE</h3>
              <p className="text-xs">123 Main Street, Anytown, USA</p>
              <p className="text-xs">Tel: (555) 123-4567</p>
            </div>
            
            <div className="text-xs mb-4">
              <div className="flex justify-between">
                <span>Order #:</span>
                <span>{selectedOrder}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              {receiptOptions.includeCustomerInfo && (
                <div className="mt-2">
                  <div className="font-bold">Customer:</div>
                  <div>John Smith</div>
                  <div>john.smith@example.com</div>
                </div>
              )}
            </div>
            
            {receiptOptions.includeItemizedList && (
              <div className="mb-4">
                <div className="text-center font-bold text-xs mb-1">ITEMS</div>
                <div className="text-xs border-t border-b py-1">
                  <div className="flex justify-between">
                    <span>1x Brake Pad Set</span>
                    <span>$45.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2x Oil Filter</span>
                    <span>$17.98</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs">
              <div className="flex justify-between font-bold">
                <span>Subtotal:</span>
                <span>$63.97</span>
              </div>
              {receiptOptions.includeTaxDetails && (
                <div className="flex justify-between">
                  <span>Tax (8.25%):</span>
                  <span>$5.28</span>
                </div>
              )}
              <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                <span>Total:</span>
                <span>$69.25</span>
              </div>
            </div>
            
            <div className="mt-4 pt-2 border-t text-center text-xs">
              <p>Thank you for your business!</p>
              <p>www.autopartsstore.com</p>
            </div>
            
            {receiptOptions.includeMerchantCopy && (
              <div className="mt-4 pt-2 border-t text-xs">
                <div className="text-center font-bold mb-1">MERCHANT COPY</div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>Credit Card</span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>VISA **** 1234</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Print Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="printer">Select Printer</Label>
                  <select id="printer" className="w-full p-2 border rounded-md">
                    <option>Main Cashier Printer</option>
                    <option>Office Printer</option>
                    <option>Backup Printer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copies">Number of Copies</Label>
                  <Input id="copies" type="number" defaultValue="1" min="1" max="5" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handlePrint}>Print Now</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="gap-2" onClick={handleEmail}>
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Button>
          
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <FileText className="h-4 w-4" />
            <span>Download</span>
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
