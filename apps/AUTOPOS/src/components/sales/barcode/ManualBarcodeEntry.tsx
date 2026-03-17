
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManualBarcodeEntryProps {
  onSearch: (barcode: string) => void;
}

export const ManualBarcodeEntry = ({ onSearch }: ManualBarcodeEntryProps) => {
  const [manualBarcode, setManualBarcode] = useState("");
  
  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      onSearch(manualBarcode.trim());
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Input
        type="text"
        placeholder="Enter barcode manually"
        value={manualBarcode}
        onChange={(e) => setManualBarcode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
      />
      <Button type="submit" onClick={handleManualSearch}>
        Search
      </Button>
    </div>
  );
};
