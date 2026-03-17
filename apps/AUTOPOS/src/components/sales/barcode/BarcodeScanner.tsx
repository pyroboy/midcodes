
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { initBarcodeScanner, checkCameraPermission } from "./barcodeScannerUtils";

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  scannerInitialized: boolean;
  setScannerInitialized: (initialized: boolean) => void;
  barcodeDetected: boolean;
}

export const BarcodeScanner = ({ 
  onBarcodeDetected, 
  scannerInitialized, 
  setScannerInitialized,
  barcodeDetected 
}: BarcodeScannerProps) => {
  const scannerContainerId = "qr-reader";
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [attemptingInit, setAttemptingInit] = useState(false);
  
  // Initialize scanner on mount - only once
  useEffect(() => {
    let isMounted = true;
    let initTimeout: number | undefined;
    
    async function checkPermission() {
      const hasPermission = await checkCameraPermission();
      if (!isMounted) return;
      
      setHasCameraPermission(hasPermission);
      console.log("Camera permission:", hasPermission);
      
      // If permission is granted, initialize scanner
      if (hasPermission && !scannerInitialized && !attemptingInit) {
        setAttemptingInit(true);
        
        // Delay initialization to ensure DOM is ready
        initTimeout = window.setTimeout(() => {
          if (!isMounted) return;
          console.log("Starting scanner initialization");
          initializeScanner();
        }, 1000);
      }
    }
    
    checkPermission();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      if (initTimeout) window.clearTimeout(initTimeout);
      cleanupScanner();
    };
  }, []); // Only run on mount
  
  // Cleanup scanner when scannerInitialized changes to false
  useEffect(() => {
    if (!scannerInitialized && qrScannerRef.current) {
      cleanupScanner();
    }
  }, [scannerInitialized]);
  
  const cleanupScanner = () => {
    if (qrScannerRef.current) {
      try {
        console.log("Cleaning up scanner");
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      } catch (error) {
        console.error("Failed to clear scanner:", error);
      }
    }
  };
  
  const initializeScanner = () => {
    console.log("In initializeScanner function");
    
    // Ensure the scanner element exists and is empty
    const scannerElement = document.getElementById(scannerContainerId);
    if (!scannerElement) {
      console.error("Scanner element not found");
      setAttemptingInit(false);
      return;
    }
    
    // Clear previous content
    while (scannerElement.firstChild) {
      scannerElement.removeChild(scannerElement.firstChild);
    }
    
    try {
      console.log("Initializing scanner with focus on EAN-13");
      
      const scanner = initBarcodeScanner(
        scannerContainerId,
        (decodedText) => {
          console.log("Barcode detected:", decodedText);
          onBarcodeDetected(decodedText);
        },
        (error) => console.debug("Scan error:", error)
      );
      
      qrScannerRef.current = scanner;
      setScannerInitialized(true);
      setAttemptingInit(false);
    } catch (error) {
      console.error("Error initializing scanner:", error);
      setAttemptingInit(false);
    }
  };
  
  return (
    <div 
      id={scannerContainerId} 
      className={`w-full h-64 flex justify-center items-center border rounded transition-colors duration-300 ${
        barcodeDetected ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950/20' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {(!scannerInitialized && !attemptingInit) && (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Camera className="h-10 w-10" />
          <p>
            {hasCameraPermission === null 
              ? "Checking camera access..." 
              : hasCameraPermission 
                ? "Initializing camera..." 
                : "Camera access required"
            }
          </p>
        </div>
      )}
    </div>
  );
};
