import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/ui/custom/StatCard";
import LineChart from "@/components/ui/custom/LineChart";
import RecipeCard from "@/components/ui/custom/RecipeCard";
import { 
  BarChart2, 
  Package, 
  ChefHat, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ShoppingBag,
  Store,
  ArrowUpRight,
  CreditCard,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/useAuth";
import { Recipe } from "@/components/ui/custom/RecipeCard";
import { cn } from "@/lib/utils";
import RoleBasedWrapper from "@/components/ui/custom/RoleBasedWrapper";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockSalesData = [
  { name: "Jan", Sales: 4000, Orders: 240, Customers: 100 },
  { name: "Feb", Sales: 3000, Orders: 198, Customers: 87 },
  { name: "Mar", Sales: 5000, Orders: 280, Customers: 130 },
  { name: "Apr", Sales: 2780, Orders: 190, Customers: 91 },
  { name: "May", Sales: 1890, Orders: 130, Customers: 71 },
  { name: "Jun", Sales: 2390, Orders: 150, Customers: 80 },
  { name: "Jul", Sales: 3490, Orders: 220, Customers: 115 },
];

const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Signature Chicken Sandwich",
    category: "sandwich",
    description: "Our famous crispy chicken sandwich with special sauce and pickles on a toasted brioche bun.",
    prepTime: 12,
    cost: 3.75,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1400&auto=format&fit=crop",
    tags: ["featured", "popular", "chicken"]
  },
  {
    id: "2",
    name: "Artisan Coffee Blend",
    category: "beverage",
    description: "House-roasted coffee blend with notes of chocolate and caramel.",
    prepTime: 5,
    cost: 1.25,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop",
    tags: ["featured", "beverage", "coffee"]
  },
  {
    id: "3",
    name: "Avocado Chicken Wrap",
    category: "wrap",
    description: "Grilled chicken with avocado, lettuce, tomato and chipotle mayo in a whole wheat wrap.",
    prepTime: 8,
    cost: 4.20,
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1400&auto=format&fit=crop",
    tags: ["healthy", "lunch", "chicken"]
  },
  {
    id: "4",
    name: "Caramel Macchiato",
    category: "beverage",
    description: "Espresso with steamed milk, vanilla syrup, and caramel drizzle.",
    prepTime: 6,
    cost: 2.80,
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1400&auto=format&fit=crop",
    tags: ["coffee", "popular", "beverage"]
  },
];

const mockLocations = [
  { id: "1", name: "Downtown", revenue: 58420, change: 12.5, status: "active" },
  { id: "2", name: "Westside", revenue: 42880, change: -3.8, status: "active" },
  { id: "3", name: "Eastside", revenue: 49650, change: 8.2, status: "active" },
  { id: "4", name: "Northside", revenue: 36540, change: 0.5, status: "active" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewRecipe = (recipe: Recipe) => {
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your franchise today.
            </p>
          </div>
          <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner']}>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-9">
                <TrendingUp className="mr-2 h-4 w-4" />
                Run Reports
              </Button>
              <Button className="h-9 bg-brand-600 hover:bg-brand-500">
                <Store className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          </RoleBasedWrapper>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={isLoading ? "" : "₱24,896"}
            description="vs. last period"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 12.5, isPositive: true }}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Orders"
            value={isLoading ? "" : "1,234"}
            description="vs. last period"
            icon={<ShoppingBag className="h-4 w-4" />}
            trend={{ value: 8.2, isPositive: true }}
            isLoading={isLoading}
          />
          <StatCard
            title="Active Locations"
            value={isLoading ? "" : "12"}
            icon={<Store className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Average Ticket"
            value={isLoading ? "" : "₱21.48"}
            description="vs. last period"
            icon={<CreditCard className="h-4 w-4" />}
            trend={{ value: 2.3, isPositive: true }}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales Performance Chart */}
          <LineChart
            title="Sales Performance"
            description="Revenue, orders, and customers over time"
            data={mockSalesData}
            categories={[
              { name: "Sales", color: "#0ea5e9" },
              { name: "Orders", color: "#8b5cf6" },
              { name: "Customers", color: "#10b981" },
            ]}
            className="lg:col-span-2"
          />

          {/* Quick Links Section */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-y">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center rounded-none h-28 hover:bg-muted"
                  onClick={() => navigate("/inventory")}
                >
                  <Package className="h-8 w-8 mb-2 text-brand-600" />
                  <span>Manage Inventory</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center rounded-none h-28 hover:bg-muted"
                  onClick={() => navigate("/recipes")}
                >
                  <ChefHat className="h-8 w-8 mb-2 text-brand-600" />
                  <span>Recipe Library</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center rounded-none h-28 hover:bg-muted"
                  onClick={() => navigate("/analytics")}
                >
                  <BarChart2 className="h-8 w-8 mb-2 text-brand-600" />
                  <span>Analytics Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center rounded-none h-28 hover:bg-muted"
                  onClick={() => navigate("/pos")}
                >
                  <ShoppingBag className="h-8 w-8 mb-2 text-brand-600" />
                  <span>POS Management</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Locations Overview */}
          <RoleBasedWrapper 
            allowedRoles={['admin', 'franchiseOwner']}
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Featured Recipes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRecipes.slice(0, 2).map((recipe) => (
                    <div key={recipe.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleViewRecipe(recipe)}>
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.name} 
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{recipe.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{recipe.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {recipe.prepTime} min
                          </span>
                          <span className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="mr-1 h-3 w-3" />
                            ₱{recipe.cost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Locations Overview</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-sm">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLocations.map((location) => (
                    <div 
                      key={location.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{location.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs capitalize",
                                location.status === "active" && "border-alert-success text-alert-success"
                              )}
                            >
                              {location.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₱{location.revenue.toLocaleString()}</p>
                        <span className={cn(
                          "text-xs font-medium",
                          location.change > 0 ? "text-alert-success" : "text-alert-error"
                        )}>
                          {location.change > 0 ? "+" : ""}{location.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </RoleBasedWrapper>
        </div>

        {/* Featured Recipes */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Featured Recipes</h2>
            <Button variant="outline" onClick={() => navigate("/recipes")}>
              View All Recipes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onClick={handleViewRecipe}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
