import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import RecipeCard, { Recipe } from "@/components/ui/custom/RecipeCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Search, Plus, Clock, DollarSign, Filter, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import RoleBasedWrapper from "@/components/ui/custom/RoleBasedWrapper";

// Mock detailed recipes data
const mockRecipes: Recipe[] = [{
  id: "1",
  name: "Signature Chicken Sandwich",
  category: "sandwich",
  description: "Our famous crispy chicken sandwich with special sauce and pickles on a toasted brioche bun.",
  prepTime: 12,
  cost: 3.75,
  imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1400&auto=format&fit=crop",
  tags: ["featured", "popular", "chicken"]
}, {
  id: "2",
  name: "Artisan Coffee Blend",
  category: "beverage",
  description: "House-roasted coffee blend with notes of chocolate and caramel.",
  prepTime: 5,
  cost: 1.25,
  imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop",
  tags: ["featured", "beverage", "coffee"]
}, {
  id: "3",
  name: "Avocado Chicken Wrap",
  category: "wrap",
  description: "Grilled chicken with avocado, lettuce, tomato and chipotle mayo in a whole wheat wrap.",
  prepTime: 8,
  cost: 4.20,
  imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1400&auto=format&fit=crop",
  tags: ["healthy", "lunch", "chicken"]
}, {
  id: "4",
  name: "Caramel Macchiato",
  category: "beverage",
  description: "Espresso with steamed milk, vanilla syrup, and caramel drizzle.",
  prepTime: 6,
  cost: 2.80,
  imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1400&auto=format&fit=crop",
  tags: ["coffee", "popular", "beverage"]
}, {
  id: "5",
  name: "Spicy Nashville Hot Chicken",
  category: "entree",
  description: "Crispy fried chicken tossed in our signature Nashville hot sauce, served with pickles and coleslaw.",
  prepTime: 18,
  cost: 5.50,
  imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=1400&auto=format&fit=crop",
  tags: ["spicy", "chicken", "popular"]
}, {
  id: "6",
  name: "Fresh Fruit Smoothie",
  category: "beverage",
  description: "Blend of seasonal fruits with yogurt and honey.",
  prepTime: 4,
  cost: 3.25,
  imageUrl: "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?q=80&w=1400&auto=format&fit=crop",
  tags: ["healthy", "beverage", "fruit"]
}, {
  id: "7",
  name: "Classic Cheeseburger",
  category: "sandwich",
  description: "Juicy beef patty with melted American cheese, lettuce, tomato, and special sauce on a toasted bun.",
  prepTime: 10,
  cost: 4.50,
  imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop",
  tags: ["beef", "popular", "lunch"]
}, {
  id: "8",
  name: "Garden Fresh Salad",
  category: "salad",
  description: "Mixed greens with seasonal vegetables, cherry tomatoes, cucumbers, and house vinaigrette.",
  prepTime: 5,
  cost: 3.80,
  imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop",
  tags: ["healthy", "vegetarian", "lunch"]
}];

// Categories for filtering
const categories = [{
  id: "all",
  name: "All Categories"
}, {
  id: "sandwich",
  name: "Sandwiches"
}, {
  id: "beverage",
  name: "Beverages"
}, {
  id: "entree",
  name: "Entrees"
}, {
  id: "wrap",
  name: "Wraps"
}, {
  id: "salad",
  name: "Salads"
}];

// Tags for filtering
const allTags = Array.from(new Set(mockRecipes.flatMap(recipe => recipe.tags)));
const Recipes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = searchTerm ? recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) || recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const handleAddRecipe = () => {
    toast.info("Add new recipe functionality would open a modal here");
  };
  const handleViewRecipe = (recipe: Recipe) => {
    toast.info(`Viewing recipe: ${recipe.name}`);
    // If this were a real app, we would navigate to a detailed recipe page
    // navigate(`/recipes/${recipe.id}`);
  };
  return <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Menu</h1>
            <p className="text-muted-foreground mt-1">
              Manage and access all your standardized recipes in one place.
            </p>
          </div>
          <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner']}>
            <Button className="bg-brand-600 hover:bg-brand-500" onClick={handleAddRecipe}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </RoleBasedWrapper>
        </div>

        {/* Search and filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search recipes..." className="pl-9 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <div className="flex border rounded-md">
                  <Button variant="ghost" size="icon" className={cn("rounded-r-none", viewMode === "grid" && "bg-secondary")} onClick={() => setViewMode("grid")}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn("rounded-l-none", viewMode === "list" && "bg-secondary")} onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-6 w-full overflow-x-auto flex justify-start">
            {categories.map(category => <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>)}
          </TabsList>

          <TabsContent value={selectedCategory} className="m-0">
            {filteredRecipes.length > 0 ? <div className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4")}>
                {viewMode === "grid" ?
            // Grid view
            filteredRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onClick={handleViewRecipe} />) :
            // List view
            filteredRecipes.map(recipe => <Card key={recipe.id} className="overflow-hidden hover:shadow-md transition-all" onClick={() => handleViewRecipe(recipe)}>
                      <div className="flex flex-col sm:flex-row cursor-pointer">
                        <div className="sm:w-56 h-40 sm:h-auto">
                          <img src={recipe.imageUrl} alt={recipe.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex flex-col justify-between p-4 flex-1">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{recipe.name}</h3>
                                <Badge variant="secondary" className="text-xs mt-1 capitalize">
                                  {recipe.category}
                                </Badge>
                              </div>
                              <ChefHat className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                              {recipe.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock size={14} />
                                <span>{recipe.prepTime} min</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign size={14} />
                                <span>${recipe.cost.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {recipe.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>)}
                              {recipe.tags.length > 2 && <Badge variant="outline" className="text-xs">
                                  +{recipe.tags.length - 2}
                                </Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>)}
              </div> : <div className="text-center py-12">
                <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No recipes found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}>
                  Clear Filters
                </Button>
              </div>}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>;
};
export default Recipes;