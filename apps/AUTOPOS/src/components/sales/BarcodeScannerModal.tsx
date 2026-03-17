
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/sales";
import { Barcode, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ManualBarcodeEntry } from "./barcode/ManualBarcodeEntry";
import { BarcodeScanner } from "./barcode/BarcodeScanner";
import { findProductByBarcode } from "./barcode/barcodeScannerUtils";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (product: Product) => void;
  products: Product[];
}

export const BarcodeScannerModal = ({
  open,
  onOpenChange,
  onProductFound,
  products
}: BarcodeScannerModalProps) => {
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // Set isFirstRender to false after first render
  useEffect(() => {
    setIsFirstRender(false);
  }, []);
  
  // Reset barcode detected state when barcode detection times out
  useEffect(() => {
    let timer: number | undefined;
    if (barcodeDetected) {
      timer = window.setTimeout(() => {
        setBarcodeDetected(false);
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [barcodeDetected]);
  
  // Only clean up scanner when modal is closed
  useEffect(() => {
    if (!open && !isFirstRender) {
      console.log("Modal closed, cleaning up scanner");
      setScannerInitialized(false);
    }
  }, [open, isFirstRender]);
  
  // Cleanup everything when component unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up scanner");
      setScannerInitialized(false);
    };
  }, []);
  
  const handleBarcodeResult = (barcode: string) => {
    setBarcodeDetected(true);
    const foundProduct = findProductByBarcode(barcode, products);
    
    if (foundProduct) {
      onProductFound(foundProduct);
      handleClose();
    } else {
      setErrorMessage(`No product found with barcode: ${barcode}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw]" onInteractOutside={handleClose}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Barcode Scanner
            </DialogTitle>
            <DialogDescription>
              Scan a barcode or enter it manually to find a product
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4">
            {open && (
              <BarcodeScanner 
                onBarcodeDetected={handleBarcodeResult}
                scannerInitialized={scannerInitialized}
                setScannerInitialized={setScannerInitialized}
                barcodeDetected={barcodeDetected}
              />
            )}
            
            <ManualBarcodeEntry onSearch={handleBarcodeResult} />
            
            <div className="text-xs text-muted-foreground">
              Scan any product barcode or QR code or enter the code manually.
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Product Not Found
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setErrorMessage(null)}>
              OK
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
