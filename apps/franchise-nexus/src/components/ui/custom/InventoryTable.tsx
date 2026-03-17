import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  cost: number;
  lastUpdated: string;
}

interface InventoryTableProps {
  data: InventoryItem[];
  onAddItem?: () => void;
  onEditItem?: (item: InventoryItem) => void;
  className?: string;
}

const InventoryTable = ({
  data,
  onAddItem,
  onEditItem,
  className,
}: InventoryTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredData = searchTerm
    ? data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return { label: "Out of Stock", class: "bg-alert-error text-white" };
    }
    if (quantity <= reorderLevel) {
      return { label: "Low Stock", class: "bg-alert-warning text-white" };
    }
    return { label: "In Stock", class: "bg-alert-success text-white" };
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory items..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {onAddItem && (
          <Button className="w-full sm:w-auto" onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const status = getStockStatus(item.quantity, item.reorderLevel);
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onEditItem && onEditItem(item)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.class}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₱{item.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.lastUpdated}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryTable;
