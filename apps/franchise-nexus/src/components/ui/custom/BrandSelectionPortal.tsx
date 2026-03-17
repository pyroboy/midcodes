
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { Coffee, Drumstick } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logo: React.ReactNode;
  description: string;
  locations: number;
}

const BrandSelectionPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Mock brand data - in a real app, this would come from an API
  const brands: Brand[] = [
    {
      id: "coffee-brand",
      name: "BrewMaster Coffee",
      logo: <Coffee size={36} />,
      description: "Premium coffee franchise with 120 locations nationwide",
      locations: 120
    },
    {
      id: "chicken-brand",
      name: "Crispy Chicken Co.",
      logo: <Drumstick size={36} />,
      description: "Fast-casual chicken restaurant chain with 85 locations",
      locations: 85
    }
  ];

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrand(brandId);
    // In a real app, this would set the selected brand in context/state
    // and potentially load brand-specific data
    setTimeout(() => {
      navigate("/dashboard");
    }, 300);
  };

  if (!user) return null;

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {brands.map((brand) => (
        <Card 
          key={brand.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedBrand === brand.id ? "ring-2 ring-brand-500" : ""
          }`}
          onClick={() => handleSelectBrand(brand.id)}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-primary">
              {brand.logo}
            </div>
            <div>
              <CardTitle className="text-lg">{brand.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {brand.locations} locations
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{brand.description}</p>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectBrand(brand.id);
              }}
            >
              Select Brand
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BrandSelectionPortal;
