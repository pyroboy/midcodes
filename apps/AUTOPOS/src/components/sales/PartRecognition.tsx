import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Search, Check, Save, AlertTriangle, Info, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product, PartRecognitionResult } from "@/types/sales";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { analyzeImageWithGemini, findMatchingProducts, CONFIDENCE_THRESHOLD } from "@/utils/geminiVisionService";
import { usePartRecognition } from "@/contexts/PartRecognitionContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlternativeMatchesModal } from "./AlternativeMatchesModal";
import { Badge } from "@/components/ui/badge";
import { ProductDetailModal } from "./ProductDetailModal";

interface PartRecognitionProps {
  onAddToCart: (product: Product) => void;
}

export const PartRecognition = ({ onAddToCart }: PartRecognitionProps) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState<PartRecognitionResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { settings, saveImage } = usePartRecognition();
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [allPossibleMatches, setAllPossibleMatches] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [cameraReady, setCameraReady] = useState(false);
  
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        const backCamera = videoDevices.find(
          device => device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear')
        );
        setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting camera devices:", err);
      setCameraError("Couldn't find camera devices. Please make sure you've granted camera permissions.");
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      if (cameras.length === 0) {
        await getAvailableCameras();
      }
      
      const constraints: MediaStreamConstraints = {
        video: selectedCamera 
          ? { deviceId: { exact: selectedCamera } } 
          : true,
        audio: false
      };
      
      console.log("Attempting to access camera with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      setCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Video element found, attempting to set stream");
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded, attempting to play");
            videoRef.current?.play()
              .then(() => {
                console.log("Camera stream active and playing");
                setCameraReady(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
                setCameraError("Could not play video stream: " + err.message);
              });
          };
        } else {
          console.error("Video reference is null after timeout");
          setCameraError("Video element not found. Please try again.");
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setCameraActive(false);
        }
      }, 300);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(typeof err === 'object' && err !== null && 'message' in err 
        ? String(err.message) 
        : "Couldn't access the camera. Please check permissions or try again.");
      
      toast.error("Camera error", {
        description: "Could not access the camera. Please check permissions or try a different browser.",
        duration: 5000
      });
      
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId);
    if (cameraActive) {
      stopCamera();
      setTimeout(startCamera, 300);
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setImagePreview(imageData);
      stopCamera();
      
      processImage(imageData);
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (cameraStream && videoRef.current && cameraActive) {
      console.log("Setting video srcObject from useEffect");
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraActive]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImagePreview(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    setRecognitionResults(null);
    
    try {
      const result = await analyzeImageWithGemini(imageData);
      setAnalysisResult(result);

      const allMatches = findMatchingProducts(result);
      setAllPossibleMatches(allMatches);

      if (result.isProduct && result.confidence >= CONFIDENCE_THRESHOLD) {
        if (allMatches.length > 0) {
          const productNameMatch = allMatches[0].name.toLowerCase().includes(result.productType?.toLowerCase() || "");
          const categoryMatch = allMatches[0].category.toLowerCase() === result.productType?.toLowerCase();
          
          if (!productNameMatch && !categoryMatch && result.confidence > 0.8) {
            result.confidence = Math.max(0.65, result.confidence * 0.85);
            console.log("Confidence adjusted due to product name/type mismatch:", result.confidence);
          }
          
          const recognitionResult: PartRecognitionResult = {
            confidence: result.confidence,
            product: allMatches[0],
            alternates: allMatches.slice(1, 3)
          };
          
          setRecognitionResults(recognitionResult);
          
          if (result.isAutoPart && (!result.brand || result.brand === "unknown")) {
            toast.info("Brand identification uncertain", {
              description: "Confidence reduced because brand wasn't clearly identified in the image",
              duration: 5000
            });
          }
          
          if (settings.autoSaveEnabled && 
              (!settings.saveOnlyAutoParts || result.isAutoPart) && 
              result.confidence >= settings.confidenceThreshold) {
            saveImage(imageData, result.confidence, result);
            
            toast.success("Image auto-saved", {
              description: `Recognized as: ${result.productType || 'Unknown'} ${result.isAutoPart ? '(Auto Part)' : ''}`,
              duration: 5000
            });
          }
        } else {
          const brandInfo = result.brand ? ` (${result.brand})` : '';
          toast.info(`No matching products found for ${result.productType || 'this item'}${brandInfo}`, {
            description: result.isAutoPart ? 
              "We identified an auto part but couldn't find it in our inventory" : 
              "This doesn't appear to be an auto part in our inventory",
            duration: 4000
          });
        }
      } else if (result.isProduct) {
        toast("Low confidence recognition", {
          description: `This appears to be ${result.isAutoPart ? 'an auto part' : 'a product'} (${result.productType || 'unknown type'}), but we're not confident. Image saved for analysis.`,
          icon: <AlertTriangle className="h-4 w-4" />,
          duration: 5000
        });
        
        saveImage(imageData, result.confidence, result);
      } else {
        const toastDescription = result.productType 
          ? `Perceived as: ${result.productType}, but confidence is too low` 
          : "Please try with a different image";
          
        toast.error("Not recognized as a product", {
          description: toastDescription,
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Error processing image", {
        description: errorMessage.includes("404") 
          ? "API model not available. Please check your API configuration." 
          : `Please try again or use a different image. (${errorMessage})`,
        duration: 7000
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetRecognition = () => {
    setImagePreview(null);
    setRecognitionResults(null);
    setAnalysisResult(null);
  };

  const handleSaveImage = () => {
    if (imagePreview && analysisResult) {
      saveImage(imagePreview, analysisResult.confidence || 0, analysisResult);
      toast.success("Image saved", {
        description: analysisResult.productType ? 
          `Saved as: ${analysisResult.productType} ${analysisResult.isAutoPart ? '(Auto Part)' : ''}` : 
          "The image has been saved for further analysis",
        duration: 5000
      });
    }
  };

  const openAlternativesModal = () => {
    setShowAlternativesModal(true);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const isHighConfidence = recognitionResults?.confidence >= 0.9;
  
  const doesProductMatchAnalysis = () => {
    if (!recognitionResults || !analysisResult?.productType) return true;
    
    const productName = recognitionResults.product.name.toLowerCase();
    const detectedType = analysisResult.productType.toLowerCase();
    
    return productName.includes(detectedType) || 
           recognitionResults.product.category.toLowerCase() === detectedType;
  };
  
  const showMismatchWarning = !doesProductMatchAnalysis() && recognitionResults;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>AI Part Recognition</CardTitle>
          <CardDescription>Take a photo or upload an image of the part</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Part preview" 
                className={cn(
                  "w-full h-64 object-contain border rounded-lg",
                  isScanning && "opacity-50"
                )}
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2"
                onClick={resetRecognition}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 animate-pulse text-primary" />
                    <p className="text-sm font-medium mt-2">Scanning part...</p>
                  </div>
                </div>
              )}
            </div>
          ) : cameraActive ? (
            <div className="relative h-64 bg-black rounded-lg overflow-hidden">
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 text-white">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                autoPlay 
                playsInline
                muted
              ></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white text-black hover:bg-gray-200"
                  onClick={takePicture}
                  disabled={!cameraReady}
                >
                  <div className="rounded-full h-10 w-10 border-2 border-black flex items-center justify-center">
                    <div className="rounded-full h-8 w-8 bg-black"></div>
                  </div>
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2 bg-white/70"
                onClick={stopCamera}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {cameras.length > 1 && (
                <div className="absolute top-2 left-2">
                  <Select value={selectedCamera} onValueChange={handleCameraChange}>
                    <SelectTrigger className="w-auto bg-white/70">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map(camera => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="h-32 flex flex-col gap-2"
                  onClick={startCamera}
                >
                  <Camera className="h-6 w-6" />
                  <span>Take Photo</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-32 flex flex-col gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-6 w-6" />
                  <span>Upload Image</span>
                </Button>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
              
              {cameraError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>
                    {cameraError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recognition Results</CardTitle>
          <CardDescription>
            {recognitionResults 
              ? `Part identified with ${Math.round(recognitionResults.confidence * 100)}% confidence` 
              : analysisResult && !isScanning 
                ? `Analysis completed (${Math.round(analysisResult.confidence * 100)}% confidence)` 
                : "Upload or take a photo to identify parts"}
            
            {analysisResult && analysisResult.isAutoPart && (!analysisResult.brand || analysisResult.brand === "unknown") && (
              <span className="text-xs text-amber-600 block mt-1">
                Note: Confidence reduced due to unknown brand
              </span>
            )}
            
            {showMismatchWarning && (
              <span className="text-xs text-amber-600 block mt-1">
                Note: Product name doesn't match detected type ({analysisResult.productType})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recognitionResults ? (
            <div className="space-y-6">
              {isHighConfidence && doesProductMatchAnalysis() ? (
                <div className="border rounded-lg p-4 bg-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-background border rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img 
                        src={recognitionResults.product.imageUrl || "/placeholder.svg"} 
                        alt={recognitionResults.product.name}
                        className="w-full h-full object-contain"
                        onClick={() => handleProductClick(recognitionResults.product)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-semibold text-lg hover:underline" 
                          onClick={() => handleProductClick(recognitionResults.product)}
                          style={{ cursor: 'pointer' }}
                        >
                          {recognitionResults.product.name}
                        </h3>
                        <div className="text-xs px-2 py-0.5 bg-primary/20 rounded-full font-medium">
                          Best Match
                        </div>
                      </div>
                      {recognitionResults.product.manufacturer && (
                        <p className="text-xs text-primary">
                          {recognitionResults.product.manufacturer}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{recognitionResults.product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="font-medium">₱{recognitionResults.product.price.toFixed(2)}</div>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => onAddToCart(recognitionResults.product)}
                        >
                          Add to Order
                        </Button>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" />
                          <span>
                            High confidence match based on {analysisResult?.productType || "product type"}
                            {analysisResult?.brand && ` and ${analysisResult.brand} branding`}
                            {analysisResult?.model && ` with model ${analysisResult.model}`}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md p-4 mb-4 text-sm">
                  <div className="font-medium flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    Image Analysis Details
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="text-muted-foreground">Product Type:</div>
                    <div>{analysisResult?.productType || "Unknown"}</div>
                    
                    {analysisResult?.brand && (
                      <>
                        <div className="text-muted-foreground">Brand:</div>
                        <div>{analysisResult.brand}</div>
                      </>
                    )}
                    
                    {analysisResult?.model && (
                      <>
                        <div className="text-muted-foreground">Model:</div>
                        <div>{analysisResult.model}</div>
                      </>
                    )}
                    
                    <div className="text-muted-foreground">Confidence:</div>
                    <div className="flex items-center">
                      {Math.round((analysisResult?.confidence || 0) * 100)}%
                      {(!analysisResult?.brand || analysisResult?.brand === "unknown") && analysisResult?.isAutoPart && (
                        <div className="ml-2 text-xs text-amber-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Reduced (brand unknown)
                        </div>
                      )}
                      {showMismatchWarning && (
                        <div className="ml-2 text-xs text-amber-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Product name mismatch
                        </div>
                      )}
                    </div>
                    
                    {analysisResult?.description && (
                      <>
                        <div className="text-muted-foreground col-span-2 mt-1">Description:</div>
                        <div className="col-span-2 bg-background p-2 rounded text-xs">
                          {analysisResult.description}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4 border-t pt-2">
                    <p className="text-xs text-amber-600 mb-2 flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      {showMismatchWarning 
                        ? `This looks like ${analysisResult.productType} but matched with ${recognitionResults.product.name}` 
                        : "Medium confidence match - review options before adding to order"}
                    </p>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleSaveImage}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Image for Analytics
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Alternative Matches</h4>
                </div>
                
                {recognitionResults.alternates?.length ? (
                  recognitionResults.alternates.map(product => (
                    <div 
                      key={product.id} 
                      className="flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="w-12 h-12 bg-background border rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{product.name}</h5>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.manufacturer ? `${product.manufacturer} • ` : ''}
                          {product.sku}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm font-medium">₱{product.price.toFixed(2)}</div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No alternative matches found</p>
                )}
                
                {allPossibleMatches.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="default"
                    className="w-full gap-2 mt-4"
                    onClick={openAlternativesModal}
                  >
                    <Search className="h-4 w-4" />
                    View All Matches ({allPossibleMatches.length})
                  </Button>
                )}
              </div>
            </div>
          ) : imagePreview && analysisResult && !isScanning ? (
            <div className="space-y-4">
              <Alert className={analysisResult.isAutoPart ? "border-amber-500" : ""}>
                <Info className={`h-4 w-4 ${analysisResult.isAutoPart ? "text-amber-500" : ""}`} />
                <AlertTitle className="flex items-center gap-2">
                  {analysisResult.isAutoPart 
                    ? "Auto Part Not Found in Inventory" 
                    : analysisResult.isProduct 
                      ? "Product Not Found"
                      : "Not Recognized as a Product"}
                  
                  {analysisResult.isAutoPart && (!analysisResult.brand || analysisResult.brand === "unknown") && (
                    <Badge variant="outline" className="text-xs bg-amber-100">
                      Brand Unknown
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  {analysisResult.isAutoPart ? (
                    <div className="space-y-2">
                      <p>
                        We identified this as an automotive part 
                        (<span className="font-medium">{analysisResult.productType}</span>) 
                        {analysisResult.brand && (
                          <span> by <span className="font-medium">{analysisResult.brand}</span></span>
                        )}
                        but couldn't find matching items in our inventory.
                      </p>
                      {analysisResult.description && (
                        <div className="mt-1 text-xs">
                          <span className="font-medium">Description:</span> {analysisResult.description}
                        </div>
                      )}
                    </div>
                  ) : analysisResult.isProduct ? (
                    <p>
                      This appears to be a 
                      <span className="font-medium"> {analysisResult.productType}</span> 
                      {analysisResult.brand && (
                        <span> by <span className="font-medium">{analysisResult.brand}</span></span>
                      )}
                      but we don't have matching products in our inventory.
                    </p>
                  ) : (
                    <p>
                      This image could not be confidently identified as a product. 
                      {analysisResult.productType && ` It might be a ${analysisResult.productType}.`}
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              <div className="mt-4 border rounded-lg p-4 bg-muted/30 space-y-3">
                <h4 className="text-sm font-medium">Analysis Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Product Type:</div>
                  <div className="font-medium">{analysisResult.productType || "Unknown"}</div>
                  
                  {analysisResult.brand && (
                    <>
                      <div className="text-muted-foreground">Brand:</div>
                      <div className="font-medium">
                        {analysisResult.brand}
                        {(analysisResult.brand === "unknown" || analysisResult.brand.toLowerCase() === "unknown") && (
                          <span className="text-xs text-amber-600 ml-2">(Could not identify)</span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {analysisResult.model && (
                    <>
                      <div className="text-muted-foreground">Model:</div>
                      <div className="font-medium">{analysisResult.model}</div>
                    </>
                  )}
                  
                  <div className="text-muted-foreground">Auto Part:</div>
                  <div className="font-medium">{analysisResult.isAutoPart ? "Yes" : "No"}</div>
                  
                  <div className="text-muted-foreground">Confidence:</div>
                  <div className="font-medium flex items-center">
                    {Math.round(analysisResult.confidence * 100)}%
                    {analysisResult.isAutoPart && (!analysisResult.brand || analysisResult.brand === "unknown") && (
                      <span className="text-xs text-amber-600 ml-2">(Reduced due to unknown brand)</span>
                    )}
                  </div>
                  
                  {analysisResult.description && (
                    <>
                      <div className="text-muted-foreground">Description:</div>
                      <div className="col-span-2 text-xs mt-1 bg-background p-2 rounded">
                        {analysisResult.description}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={handleSaveImage}
                  >
                    <Save className="h-4 w-4" />
                    Save Image for Analysis
                  </Button>
                </div>
              </div>
              
              {allPossibleMatches.length > 0 && (
                <div className="pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={openAlternativesModal}
                  >
                    <Search className="h-4 w-4" />
                    View All Potential Matches ({allPossibleMatches.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Recognition Results</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Take a photo or upload an image of the part to get AI-powered recognition results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlternativeMatchesModal
        open={showAlternativesModal}
        onOpenChange={setShowAlternativesModal}
        products={allPossibleMatches}
        analysisResult={analysisResult}
        onAddToCart={onAddToCart}
      />
      
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};
