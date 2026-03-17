
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Upload, Calendar as CalendarIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InvoiceSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockSuppliers = [
  "Premium Poultry Co.",
  "Fresh Dairy Farms",
  "Artisan Bakery Inc.",
  "Gourmet Coffee Imports",
  "EcoPackaging Co."
];

const mockPurchaseOrders = [
  { id: "PO-2023-2456", supplier: "Artisan Bakery Inc." },
  { id: "PO-2023-2457", supplier: "Fresh Dairy Farms" },
  { id: "PO-2023-2458", supplier: "Premium Poultry Co." },
  { id: "PO-2023-2459", supplier: "Gourmet Coffee Imports" },
  { id: "PO-2023-2460", supplier: "EcoPackaging Co." }
];

export function InvoiceSubmissionModal({ isOpen, onClose }: InvoiceSubmissionModalProps) {
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [amount, setAmount] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [notes, setNotes] = useState("");

  // Filter purchase orders based on selected supplier
  const filteredPOs = supplier 
    ? mockPurchaseOrders.filter(po => po.supplier === supplier)
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(true);
      toast.info(`File "${e.target.files[0].name}" selected`);
    }
  };

  const handleSubmit = () => {
    if (!supplier || !invoiceNumber || !invoiceDate || !amount || !purchaseOrder || !fileUploaded) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Invoice submitted successfully");
    
    // Reset form
    setSupplier("");
    setInvoiceNumber("");
    setInvoiceDate(undefined);
    setAmount("");
    setPurchaseOrder("");
    setFileUploaded(false);
    setNotes("");
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Submit Invoice
          </DialogTitle>
          <DialogDescription>
            Submit a supplier invoice for payment processing
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {mockSuppliers.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchaseOrder">Purchase Order</Label>
            <Select 
              value={purchaseOrder} 
              onValueChange={setPurchaseOrder}
              disabled={!supplier}
            >
              <SelectTrigger id="purchaseOrder">
                <SelectValue placeholder={supplier ? "Select a purchase order" : "Select a supplier first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredPOs.map((po) => (
                  <SelectItem key={po.id} value={po.id}>{po.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-12345"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Invoice Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !invoiceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={setInvoiceDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fileUpload">Upload Invoice PDF</Label>
            <div className="grid gap-2">
              <Input
                id="fileUpload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start",
                  fileUploaded && "border-green-500 text-green-600"
                )}
                onClick={() => document.getElementById("fileUpload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {fileUploaded ? "File selected" : "Select invoice file"}
              </Button>
              {fileUploaded && (
                <p className="text-xs text-muted-foreground">
                  Click again to change file
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional information about this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <FileText className="h-4 w-4" />
            Submit Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
