
import React, { useEffect, useState } from "react";
import { StockFilters } from "./StockStatusSidebar";
import { Product } from "@/types/sales";
import { SearchFilter } from "./filters/SearchFilter";
import { PriceRangeFilter } from "./filters/PriceRangeFilter";
import { CheckboxFilter } from "./filters/CheckboxFilter";
import { StockStatusFilter } from "./filters/StockStatusFilter";
import { AutoPartsFilter } from "./filters/AutoPartsFilter";
import { FilterSection } from "./filters/FilterSection";

interface StockStatusSidebarProps {
  products: Product[];
  onFilterChange: (filters: StockFilters) => void;
  initialFilters?: StockFilters;
  compact?: boolean;
}

const StockStatusSidebar = ({
  products,
  onFilterChange,
  initialFilters,
  compact = false,
}: StockStatusSidebarProps) => {
  // Extract unique values from products
  const getUniqueValues = (key: keyof Product): string[] => {
    const values = products.map((product) => String(product[key]));
    return [...new Set(values)].sort();
  };

  const categories = getUniqueValues("category");
  const manufacturers = getUniqueValues("manufacturer");
  const locations = getUniqueValues("location");
  
  // Extract unique suppliers
  const suppliers = products.reduce((acc: string[], product) => {
    if (product.suppliers) {
      const supplierNames = product.suppliers.map(s => s.name);
      return [...acc, ...supplierNames];
    }
    return acc;
  }, []);
  const uniqueSuppliers = [...new Set(suppliers)].sort();
  
  // Extract unique part types
  const partTypes = products.reduce((acc: string[], product) => {
    if (product.partType) {
      return [...acc, product.partType];
    }
    return acc;
  }, []);
  const uniquePartTypes = [...new Set(partTypes)].sort();

  // Calculate min and max prices
  const prices = products.map((product) => product.price);
  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  // Section open/close state
  const [openSections, setOpenSections] = useState({
    filters: true,
    categories: true,
    manufacturers: true,
    price: true,
    stock: true,
    locations: true,
    suppliers: !compact,
    partTypes: !compact,
    autoParts: !compact
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Initialize filters
  const defaultFilters: StockFilters = {
    categories: [],
    manufacturers: [],
    priceRange: [minPrice, maxPrice],
    stockStatus: [],
    locations: [],
    search: "",
    suppliers: [],
    partTypes: [],
    isAutoParts: false
  };

  const [filters, setFilters] = useState<StockFilters>(
    initialFilters || defaultFilters
  );

  // Update filters when products change
  useEffect(() => {
    if (!initialFilters) {
      setFilters(prev => ({
        ...prev,
        priceRange: [minPrice, maxPrice]
      }));
    }
  }, [products, minPrice, maxPrice, initialFilters]);

  // Handle filter changes
  const updateFilters = (newFilters: Partial<StockFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // Checkbox filter handlers
  const handleArrayFilterChange = (key: keyof StockFilters, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    
    updateFilters({ [key]: newValues } as Partial<StockFilters>);
  };

  return (
    <div className={`sidebar-filters ${compact ? 'text-sm' : ''}`}>
      <SearchFilter 
        search={filters.search} 
        onSearchChange={(value) => updateFilters({ search: value })} 
      />

      <FilterSection 
        title="Categories" 
        isOpen={openSections.categories}
        onToggle={() => toggleSection('categories')}
      >
        <CheckboxFilter
          title="Categories"
          options={categories}
          selectedValues={filters.categories}
          onChange={(value) => handleArrayFilterChange('categories', value)}
          maxHeight={compact ? "120px" : "180px"}
        />
      </FilterSection>

      <FilterSection 
        title="Price Range" 
        isOpen={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <PriceRangeFilter
          priceRange={filters.priceRange}
          onPriceRangeChange={(value) => updateFilters({ priceRange: value })}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </FilterSection>

      <FilterSection 
        title="Stock Status" 
        isOpen={openSections.stock}
        onToggle={() => toggleSection('stock')}
      >
        <StockStatusFilter
          stockStatus={filters.stockStatus}
          onStockStatusChange={(value) => handleArrayFilterChange('stockStatus', value)}
        />
      </FilterSection>

      <FilterSection 
        title="Manufacturers" 
        isOpen={openSections.manufacturers}
        onToggle={() => toggleSection('manufacturers')}
      >
        <CheckboxFilter
          title="Manufacturers"
          options={manufacturers}
          selectedValues={filters.manufacturers}
          onChange={(value) => handleArrayFilterChange('manufacturers', value)}
          maxHeight={compact ? "120px" : "180px"}
        />
      </FilterSection>

      <FilterSection 
        title="Locations" 
        isOpen={openSections.locations}
        onToggle={() => toggleSection('locations')}
      >
        <CheckboxFilter
          title="Locations"
          options={locations}
          selectedValues={filters.locations}
          onChange={(value) => handleArrayFilterChange('locations', value)}
          maxHeight={compact ? "120px" : "180px"}
        />
      </FilterSection>

      {!compact && (
        <>
          <FilterSection 
            title="Suppliers" 
            isOpen={openSections.suppliers}
            onToggle={() => toggleSection('suppliers')}
          >
            <CheckboxFilter
              title="Suppliers"
              options={uniqueSuppliers}
              selectedValues={filters.suppliers}
              onChange={(value) => handleArrayFilterChange('suppliers', value)}
              maxHeight="180px"
            />
          </FilterSection>

          <FilterSection 
            title="Part Types" 
            isOpen={openSections.partTypes}
            onToggle={() => toggleSection('partTypes')}
          >
            <CheckboxFilter
              title="Part Types"
              options={uniquePartTypes}
              selectedValues={filters.partTypes}
              onChange={(value) => handleArrayFilterChange('partTypes', value)}
              maxHeight="180px"
            />
          </FilterSection>

          <FilterSection 
            title="Auto Parts" 
            isOpen={openSections.autoParts}
            onToggle={() => toggleSection('autoParts')}
          >
            <AutoPartsFilter
              isAutoParts={filters.isAutoParts}
              onAutoPartsChange={(value) => updateFilters({ isAutoParts: value })}
            />
          </FilterSection>
        </>
      )}
    </div>
  );
};

export default StockStatusSidebar;
