
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product } from "@/types/sales";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Search, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categorizeProducts } from "@/utils/geminiVisionService";
import { ProductDetailModal } from "./ProductDetailModal";

interface AlternativeMatchesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  analysisResult: any;
  onAddToCart: (product: Product) => void;
}

export const AlternativeMatchesModal = ({
  open,
  onOpenChange,
  products,
  analysisResult,
  onAddToCart,
}: AlternativeMatchesModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Safely categorize products only if analysis result is available
  const { directMatches, relatedMatches } = analysisResult ? 
    categorizeProducts(products, analysisResult) : 
    { directMatches: [], relatedMatches: [] };
  
  const filteredProducts = searchTerm
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.manufacturer && product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : products;

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Generate the product list with appropriate headers
  const renderProductList = (productList: Product[], isRelated: boolean = false) => {
    if (productList.length === 0) return null;
    
    return (
      <div>
        {isRelated && (
          <div className="flex items-center gap-2 mt-4 mb-2 text-sm font-medium text-muted-foreground">
            <Link2 className="h-4 w-4" />
            Related Products
          </div>
        )}
        <div className="space-y-3">
          {productList.map((product) => (
            <div
              key={product.id}
              className={`flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                isRelated ? "border-dashed" : ""
              }`}
              onClick={() => handleProductClick(product)}
            >
              <div className="w-16 h-16 bg-background border rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2">
                  <h5 className="font-medium">{product.name}</h5>
                  {product.manufacturer && (
                    <Badge variant="outline" className="text-xs">
                      {product.manufacturer}
                    </Badge>
                  )}
                  {isRelated && (
                    <Badge variant="secondary" className="text-xs">
                      Related
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="truncate">{product.sku}</span>
                  <span className="mx-1">•</span>
                  <span>{product.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-medium">₱{product.price.toFixed(2)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Add to Order
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Alternative Product Matches</DialogTitle>
            <DialogDescription>
              Showing all possible matches for the scanned item
              {analysisResult?.productType && (
                <span> - <strong>{analysisResult.productType}</strong></span>
              )}
              {analysisResult?.brand && (
                <span> by <strong>{analysisResult.brand}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2 mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredProducts.length > 0 ? (
              searchTerm ? (
                renderProductList(filteredProducts)
              ) : (
                <div className="space-y-6">
                  {renderProductList(directMatches)}
                  {renderProductList(relatedMatches, true)}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products found matching your search criteria</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onAddToCart={onAddToCart}
      />
    </>
  );
};
