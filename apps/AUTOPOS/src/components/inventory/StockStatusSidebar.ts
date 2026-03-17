
export interface StockFilters {
  categories: string[];
  manufacturers: string[];
  priceRange: [number, number];
  stockStatus: string[];
  locations: string[];
  search: string;
  suppliers: string[];
  partTypes: string[];
  isAutoParts: boolean;
}

// Import and re-export the component
export { default as StockStatusSidebar } from "./StockStatusSidebar.component";
