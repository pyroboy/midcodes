
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Scan, SearchIcon, CheckCircle2, X, Plus } from "lucide-react";

export interface ReceivableItem {
  id: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unit: string;
  supplier: string;
  purchaseOrderId: string;
  expectedDeliveryDate: string;
  status: "pending" | "partial" | "complete";
}

interface SimplifiedReceivingProps {
  items?: ReceivableItem[];
  isLoading?: boolean;
  className?: string;
  onReceiveItem?: (itemId: string, quantity: number) => void;
}

const SimplifiedReceiving = ({
  items = [],
  isLoading = false,
  className,
  onReceiveItem,
}: SimplifiedReceivingProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState<number>(0);

  const handleStartReceiving = (item: ReceivableItem) => {
    setEditingItem(item.id);
    setReceiveQuantity(0);
  };

  const handleCancelReceiving = () => {
    setEditingItem(null);
    setReceiveQuantity(0);
  };

  const handleConfirmReceiving = (itemId: string) => {
    if (onReceiveItem && receiveQuantity > 0) {
      onReceiveItem(itemId, receiveQuantity);
    }
    setEditingItem(null);
    setReceiveQuantity(0);
  };

  const filteredItems = searchTerm
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purchaseOrderId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Simplified Receiving</CardTitle>
        <CardDescription>
          Scan barcode or search to receive items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item name or PO number..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="sm:w-auto">
            <Scan className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="flex flex-col divide-y">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span>PO: {item.purchaseOrderId}</span>
                        <span>Supplier: {item.supplier}</span>
                      </div>
                      <div className="mt-2 text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">Expected:</span>
                        <span>{item.expectedQuantity} {item.unit}</span>
                        <span className="text-muted-foreground ml-2">Received:</span>
                        <span
                          className={cn(
                            item.status === "complete" 
                              ? "text-alert-success"
                              : item.status === "partial"
                              ? "text-alert-warning"
                              : ""
                          )}
                        >
                          {item.receivedQuantity} {item.unit}
                        </span>
                      </div>
                    </div>
                    
                    {editingItem === item.id ? (
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="w-20"
                            value={receiveQuantity}
                            onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                          />
                          <span className="text-sm">{item.unit}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelReceiving()}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirmReceiving(item.id)}
                          disabled={receiveQuantity <= 0}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Confirm
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-end sm:self-center"
                        onClick={() => handleStartReceiving(item)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Receive
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No items found to receive.</p>
                <p className="text-sm mt-1">Try adjusting your search or scan a barcode.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplifiedReceiving;
