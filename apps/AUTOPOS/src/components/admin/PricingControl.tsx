
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, ArrowUpDown, Save, FileDown, FileUp, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Mock product pricing data
const mockProducts = [
  { id: 1, sku: "BP-1001", name: "Brake Pad Set", category: "Brakes", cost: 25.40, price: 49.99, margin: 49.19, lastUpdated: "2023-08-15" },
  { id: 2, sku: "OL-2002", name: "Synthetic Oil 5W-30", category: "Fluids", cost: 18.75, price: 32.50, margin: 42.31, lastUpdated: "2023-08-12" },
  { id: 3, sku: "FL-3003", name: "Air Filter", category: "Filters", cost: 8.15, price: 15.99, margin: 49.03, lastUpdated: "2023-08-20" },
  { id: 4, sku: "SP-4004", name: "Spark Plug Set", category: "Ignition", cost: 12.35, price: 24.99, margin: 50.58, lastUpdated: "2023-08-18" },
  { id: 5, sku: "BT-5005", name: "Battery 12V", category: "Electrical", cost: 65.25, price: 109.99, margin: 40.68, lastUpdated: "2023-08-10" },
  { id: 6, sku: "WP-6006", name: "Wiper Blade Set", category: "Exterior", cost: 14.50, price: 28.99, margin: 49.98, lastUpdated: "2023-08-22" },
  { id: 7, sku: "BL-7007", name: "Brake Light Bulb", category: "Electrical", cost: 3.25, price: 6.99, margin: 53.51, lastUpdated: "2023-08-19" },
  { id: 8, sku: "TF-8008", name: "Transmission Fluid", category: "Fluids", cost: 22.80, price: 38.50, margin: 40.78, lastUpdated: "2023-08-17" },
];

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  margin: number;
  lastUpdated: string;
}

interface PricingRule {
  id: number;
  name: string;
  category: string;
  condition: string;
  action: string;
  value: number;
  status: "active" | "inactive";
}

// Mock pricing rules
const mockRules: PricingRule[] = [
  { id: 1, name: "Holiday Season Markup", category: "All", condition: "dateRange", action: "increasePrice", value: 10, status: "inactive" },
  { id: 2, name: "Low Margin Correction", category: "All", condition: "marginBelow", action: "setMinMargin", value: 35, status: "active" },
  { id: 3, name: "Brake Products Sale", category: "Brakes", condition: "always", action: "decreasePrice", value: 5, status: "active" },
];

export const PricingControl = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [bulkEditPercentage, setBulkEditPercentage] = useState(0);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(mockRules);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    name: "",
    category: "All",
    condition: "always",
    action: "increasePrice",
    value: 0,
    status: "inactive"
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => 
    (searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === null || product.category === selectedCategory)
  );

  const handlePriceChange = (id: number, newPrice: number) => {
    setProducts(products.map(product => {
      if (product.id === id) {
        const margin = ((newPrice - product.cost) / newPrice) * 100;
        return { 
          ...product, 
          price: newPrice,
          margin: parseFloat(margin.toFixed(2)),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return product;
    }));
  };

  const handleBulkPriceUpdate = () => {
    if (bulkEditPercentage === 0) {
      toast.error("Please enter a non-zero percentage");
      return;
    }

    const updatedProducts = products.map(product => {
      if (selectedCategory === null || product.category === selectedCategory) {
        const multiplier = 1 + (bulkEditPercentage / 100);
        const newPrice = parseFloat((product.price * multiplier).toFixed(2));
        const margin = ((newPrice - product.cost) / newPrice) * 100;
        
        return {
          ...product,
          price: newPrice,
          margin: parseFloat(margin.toFixed(2)),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    setShowBulkEditDialog(false);
    toast.success(`Prices updated by ${bulkEditPercentage}%`);
    setBulkEditPercentage(0);
  };

  const handleSaveChanges = () => {
    setEditModeEnabled(false);
    toast.success("Price changes saved successfully");
  };

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error("Please provide a rule name");
      return;
    }

    const newId = Math.max(...pricingRules.map(r => r.id)) + 1;
    setPricingRules([...pricingRules, { 
      id: newId, 
      name: newRule.name || "", 
      category: newRule.category || "All", 
      condition: newRule.condition || "always", 
      action: newRule.action || "increasePrice", 
      value: newRule.value || 0, 
      status: newRule.status || "inactive" as "active" | "inactive"
    }]);

    setNewRule({
      name: "",
      category: "All",
      condition: "always",
      action: "increasePrice",
      value: 0,
      status: "inactive"
    });

    toast.success("New pricing rule added");
  };

  const handleToggleRuleStatus = (id: number) => {
    setPricingRules(pricingRules.map(rule => 
      rule.id === id ? { ...rule, status: rule.status === "active" ? "inactive" : "active" } : rule
    ));
    toast.success("Rule status updated");
  };

  const handleDeleteRule = (id: number) => {
    setPricingRules(pricingRules.filter(rule => rule.id !== id));
    toast.success("Rule deleted successfully");
  };

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Pricing Control</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 md:w-[250px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value === "" ? null : e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            
            <Button variant="outline" onClick={() => setShowBulkEditDialog(true)}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Bulk Update
            </Button>
            
            <Button variant="outline" onClick={() => setShowRulesDialog(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Pricing Rules
            </Button>
            
            {editModeEnabled ? (
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            ) : (
              <Button onClick={() => setEditModeEnabled(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Prices
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost ($)</TableHead>
                <TableHead className="text-right">Price ($)</TableHead>
                <TableHead className="text-right">Margin (%)</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {editModeEnabled ? (
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => handlePriceChange(product.id, parseFloat(e.target.value))}
                          className="w-24 text-right inline-block"
                          step="0.01"
                        />
                      ) : (
                        `$${product.price.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className={`text-right ${product.margin < 35 ? 'text-destructive' : ''}`}>
                      {product.margin.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.lastUpdated}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export Prices
          </Button>
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            Import Prices
          </Button>
        </div>
      </CardContent>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-filter">Category</Label>
              <select
                id="category-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value === "" ? null : e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="percentage">Price Change Percentage</Label>
              <div className="flex items-center">
                <Input
                  id="percentage"
                  type="number"
                  placeholder="10"
                  value={bulkEditPercentage}
                  onChange={(e) => setBulkEditPercentage(parseFloat(e.target.value))}
                  className="mr-2"
                  step="0.1"
                />
                <span>%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Enter a positive value to increase prices or a negative value to decrease.
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">
                This will {bulkEditPercentage > 0 ? "increase" : "decrease"} prices by {Math.abs(bulkEditPercentage)}% 
                for {selectedCategory ? `${selectedCategory} products` : "all products"}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredProducts.length} products will be affected.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEditDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkPriceUpdate}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Rules Dialog */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pricing Rules</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.category}</TableCell>
                      <TableCell>
                        {rule.condition === "always" ? "Always Apply" : 
                         rule.condition === "dateRange" ? "Date Range" : 
                         rule.condition === "marginBelow" ? "Margin Below" : rule.condition}
                      </TableCell>
                      <TableCell>
                        {rule.action === "increasePrice" ? "Increase Price" : 
                         rule.action === "decreasePrice" ? "Decrease Price" : 
                         rule.action === "setMinMargin" ? "Set Min Margin" : rule.action}
                      </TableCell>
                      <TableCell className="text-right">
                        {rule.action === "setMinMargin" ? `${rule.value}%` : `${rule.value}%`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleToggleRuleStatus(rule.id)}>
                            {rule.status === "active" ? "Disable" : "Enable"}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted/30 p-4 rounded-md mt-4">
              <h3 className="font-medium mb-3">Add New Rule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="Holiday Sale"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rule-category">Apply to Category</Label>
                  <select
                    id="rule-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  >
                    <option value="All">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rule-condition">Condition</Label>
                  <select
                    id="rule-condition"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newRule.condition}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  >
                    <option value="always">Always Apply</option>
                    <option value="dateRange">Date Range</option>
                    <option value="marginBelow">Margin Below</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rule-action">Action</Label>
                  <select
                    id="rule-action"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  >
                    <option value="increasePrice">Increase Price</option>
                    <option value="decreasePrice">Decrease Price</option>
                    <option value="setMinMargin">Set Minimum Margin</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rule-value">Value</Label>
                  <div className="flex items-center">
                    <Input
                      id="rule-value"
                      type="number"
                      placeholder="5"
                      value={newRule.value}
                      onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                      className="mr-2"
                      step="0.1"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddRule} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
