import { createContext, ReactNode, useState } from "react";
import { StockFilters } from "@/components/inventory/StockStatusSidebar";

// Define the context type
interface InventoryContextType {
  stockFilters: StockFilters | null;
  setStockFilters: (filters: StockFilters) => void;
}

// Create the context with default values
const InventoryContextInstance = createContext<InventoryContextType>({
  stockFilters: null,
  setStockFilters: () => {},
});

// Create a provider component
interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
  const [stockFilters, setStockFilters] = useState<StockFilters | null>(null);

  return (
    <InventoryContextInstance.Provider value={{ stockFilters, setStockFilters }}>
      {children}
    </InventoryContextInstance.Provider>
  );
};

// Export the context
export const InventoryContext = InventoryContextInstance;
