
import { Html5QrcodeScanner } from "html5-qrcode";
import { Product } from "@/types/sales";

export const initBarcodeScanner = (
  scannerContainerId: string,
  onScanSuccess: (decodedText: string) => void,
  onScanFailure: (error: unknown) => void
): Html5QrcodeScanner => {
  const scanner = new Html5QrcodeScanner(
    scannerContainerId,
    {
      fps: 10,
      qrbox: { width: 250, height: 150 }, // Smaller scan area for better focus on barcodes
      rememberLastUsedCamera: true,
      aspectRatio: 1.33, // More rectangular aspect ratio for barcode scanning (4:3)
      supportedScanTypes: [], // Only use the formatsToSupport list
      formatsToSupport: [
        5, // EAN_13 - Prioritizing EAN-13 by listing it first
        6, // EAN_8
        8, // UPC_A
        9, // UPC_E
        3, // CODE_128
        1, // CODE_39
        2, // CODE_93
        4, // ITF
        0, // QR Code
        7, // PDF_417
      ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true // Use the built-in BarcodeDetector API if available
      },
      showTorchButtonIfSupported: true, // Show torch button if device supports it
      showZoomSliderIfSupported: true, // Show zoom slider if device supports it
      defaultZoomValueIfSupported: 2.0 // Default zoom level for better barcode reading
    },
    false // separate verbose mode parameter
  );
  
  try {
    // Use the built-in render method to attach the scanner to the DOM
    scanner.render(
      (decodedText) => {
        console.log("Scanner success callback:", decodedText);
        onScanSuccess(decodedText);
      }, 
      (errorMessage) => {
        console.debug("Scanner error callback:", errorMessage);
        onScanFailure(errorMessage);
      }
    );
    
    // Wait a bit for the scanner UI to render, then apply styling fixes
    setTimeout(() => {
      console.log(`Applying styling to scanner elements with ID prefix ${scannerContainerId}`);
      
      // Hide unneeded UI elements that cause issues
      const headerElement = document.getElementById(`${scannerContainerId}__header`);
      if (headerElement) {
        headerElement.style.display = 'none';
        console.log("Scanner header hidden");
      } else {
        console.log(`Header element with ID ${scannerContainerId}__header not found`);
      }
      
      // Improve the camera selection dropdown styling
      const cameraSelectorContainer = document.getElementById(`${scannerContainerId}__camera_selection_container`);
      if (cameraSelectorContainer) {
        cameraSelectorContainer.style.marginBottom = '10px';
        console.log("Camera selector styling applied");
      }
      
      // Adjust camera permission section
      const permissionContainer = document.getElementById(`${scannerContainerId}__camera_permission_button_container`);
      if (permissionContainer) {
        const buttons = permissionContainer.querySelectorAll('button');
        buttons.forEach(button => {
          button.classList.add('px-4', 'py-2', 'rounded', 'bg-primary', 'text-white');
        });
        console.log("Permission buttons styled");
      }

      // Add custom scan region styling
      const scanRegion = document.getElementById(`${scannerContainerId}__scan_region`);
      if (scanRegion) {
        scanRegion.style.maxWidth = "100%";
        scanRegion.style.maxHeight = "200px";
        console.log("Scan region size adjusted");
      }
      
      // Video element logging
      const videoElement = document.getElementById(`${scannerContainerId}__dashboard_section_csr`) as HTMLDivElement;
      if (videoElement) {
        console.log("Video container found");
        const video = videoElement.querySelector('video');
        if (video) {
          console.log("Video element found, adding custom styling");
          video.style.maxWidth = "100%";
          video.style.maxHeight = "200px";
          video.style.objectFit = "cover";
        } else {
          console.log("Video element not found in container");
        }
      } else {
        console.log("Video container not found");
      }
    }, 500);
  } catch (error) {
    console.error("Error rendering scanner:", error);
    throw error;
  }
  
  return scanner;
};

export const findProductByBarcode = (
  barcode: string, 
  products: Product[]
): Product | undefined => {
  return products.find(
    product => product.sku === barcode || 
               product.barcode === barcode || 
               product.id === barcode
  );
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(device => device.kind === 'videoinput');
    
    // If no video inputs found, we can't use camera
    if (videoInputs.length === 0) {
      console.log("No video input devices found");
      return false;
    }
    
    console.log("Attempting to access camera with constraints:", { video: true, audio: false });
    
    // Try to access camera to check permission
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // If we get here, permission is granted
    console.log("Camera permission granted, got stream");
    
    // Clean up the stream immediately
    stream.getTracks().forEach(track => {
      console.log(`Stopping track: ${track.kind}`);
      track.stop();
    });
    
    return true;
  } catch (error) {
    // Permission denied or error accessing camera
    console.error("Camera permission check failed:", error);
    return false;
  }
};
