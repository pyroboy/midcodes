import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import InventoryTable, { InventoryItem } from "@/components/ui/custom/InventoryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  BarChart2, 
  Calendar, 
  FileText, 
  Truck, 
  Bell, 
  DollarSign,
  PlusCircle
} from "lucide-react";
import StatCard from "@/components/ui/custom/StatCard";
import RoleBasedWrapper from "@/components/ui/custom/RoleBasedWrapper";
import PredictiveInventoryIntelligence from "@/components/ui/custom/PredictiveInventoryIntelligence";
import SmartOrderingAssistant from "@/components/ui/custom/SmartOrderingAssistant";
import SimplifiedReceiving from "@/components/ui/custom/SimplifiedReceiving";
import VarianceAnalysis from "@/components/ui/custom/VarianceAnalysis";
import { OrderManagementModal } from "@/components/ui/custom/modals/OrderManagementModal";
import { DeliverySchedulerModal } from "@/components/ui/custom/modals/DeliverySchedulerModal";
import { StockAlertsModal } from "@/components/ui/custom/modals/StockAlertsModal";
import { InvoiceSubmissionModal } from "@/components/ui/custom/modals/InvoiceSubmissionModal";
import { InventoryReportsModal } from "@/components/ui/custom/modals/InventoryReportsModal";

// Mock data
const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "Chicken Breast",
    category: "Meat",
    quantity: 42.5,
    unit: "lbs",
    reorderLevel: 20,
    cost: 3.99,
    lastUpdated: "Today, 9:32 AM",
  },
  {
    id: "2",
    name: "Coffee Beans (Dark Roast)",
    category: "Beverage",
    quantity: 15,
    unit: "kg",
    reorderLevel: 10,
    cost: 12.50,
    lastUpdated: "Yesterday, 5:15 PM",
  },
  {
    id: "3",
    name: "Brioche Buns",
    category: "Bakery",
    quantity: 120,
    unit: "pcs",
    reorderLevel: 50,
    cost: 0.45,
    lastUpdated: "Yesterday, 2:20 PM",
  },
  {
    id: "4",
    name: "Cheddar Cheese",
    category: "Dairy",
    quantity: 8.2,
    unit: "kg",
    reorderLevel: 5,
    cost: 6.75,
    lastUpdated: "2 days ago",
  },
  {
    id: "5",
    name: "Lettuce",
    category: "Produce",
    quantity: 12,
    unit: "heads",
    reorderLevel: 8,
    cost: 1.25,
    lastUpdated: "Today, 7:45 AM",
  },
  {
    id: "6",
    name: "Tomatoes",
    category: "Produce",
    quantity: 25,
    unit: "lbs",
    reorderLevel: 15,
    cost: 2.10,
    lastUpdated: "Yesterday, 9:00 AM",
  },
  {
    id: "7",
    name: "To-Go Cups (16oz)",
    category: "Packaging",
    quantity: 350,
    unit: "pcs",
    reorderLevel: 200,
    cost: 0.18,
    lastUpdated: "3 days ago",
  },
  {
    id: "8",
    name: "Napkins",
    category: "Supplies",
    quantity: 1200,
    unit: "pcs",
    reorderLevel: 500,
    cost: 0.02,
    lastUpdated: "1 week ago",
  },
  {
    id: "9",
    name: "Cooking Oil",
    category: "Ingredients",
    quantity: 18,
    unit: "L",
    reorderLevel: 10,
    cost: 4.50,
    lastUpdated: "4 days ago",
  },
  {
    id: "10",
    name: "Whole Milk",
    category: "Dairy",
    quantity: 12,
    unit: "gal",
    reorderLevel: 8,
    cost: 3.25,
    lastUpdated: "Today, 8:30 AM",
  },
  {
    id: "11",
    name: "Espresso Beans",
    category: "Beverage",
    quantity: 5,
    unit: "kg",
    reorderLevel: 8,
    cost: 18.99,
    lastUpdated: "2 days ago",
  },
  {
    id: "12",
    name: "Almond Milk",
    category: "Dairy",
    quantity: 6,
    unit: "gal",
    reorderLevel: 5,
    cost: 4.99,
    lastUpdated: "Yesterday, 3:15 PM",
  }
];

// Filter low stock items
const lowStockItems = mockInventoryItems.filter(
  (item) => item.quantity <= item.reorderLevel && item.quantity > 0
);

// Filter out of stock items
const outOfStockItems = mockInventoryItems.filter(
  (item) => item.quantity <= 0
);

// Mock data for forecast
const mockForecastItems = [
  {
    id: "1",
    name: "Chicken Breast",
    currentStock: 42.5,
    unit: "lbs",
    daysRemaining: 4,
    reorderPoint: 20,
    reorderQuantity: 40,
    forecast: [
      { date: "Mon", projected: 10.5, actual: 9.8 },
      { date: "Tue", projected: 12.3, actual: 11.5 },
      { date: "Wed", projected: 8.7, actual: 9.2 },
      { date: "Thu", projected: 11.2 },
      { date: "Fri", projected: 13.5 },
      { date: "Sat", projected: 15.8 },
      { date: "Sun", projected: 14.2 },
    ],
    trend: "decreasing" as const,
    alert: "Will reach reorder point in 2 days",
  },
  {
    id: "2",
    name: "Coffee Beans (Dark Roast)",
    currentStock: 15,
    unit: "kg",
    daysRemaining: 7,
    reorderPoint: 10,
    reorderQuantity: 20,
    forecast: [
      { date: "Mon", projected: 2.1, actual: 1.9 },
      { date: "Tue", projected: 2.3, actual: 2.4 },
      { date: "Wed", projected: 1.9, actual: 2.0 },
      { date: "Thu", projected: 2.4 },
      { date: "Fri", projected: 2.2 },
      { date: "Sat", projected: 3.1 },
      { date: "Sun", projected: 2.8 },
    ],
    trend: "stable" as const,
  },
  {
    id: "3",
    name: "Lettuce",
    currentStock: 12,
    unit: "heads",
    daysRemaining: 3,
    reorderPoint: 8,
    reorderQuantity: 15,
    forecast: [
      { date: "Mon", projected: 3.5, actual: 4.2 },
      { date: "Tue", projected: 3.7, actual: 3.5 },
      { date: "Wed", projected: 4.1, actual: 4.3 },
      { date: "Thu", projected: 3.9 },
      { date: "Fri", projected: 4.2 },
      { date: "Sat", projected: 4.5 },
      { date: "Sun", projected: 3.8 },
    ],
    trend: "increasing" as const,
    alert: "Quick turnover item",
  },
];

// Mock data for order recommendations
interface OrderRecommendation {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  urgency: "high" | "medium" | "low";
  reason: string;
  cost: number;
  supplier: string;
  leadTime: string;
  autoOrder?: boolean;
}

const mockRecommendations: OrderRecommendation[] = [
  {
    id: "1",
    name: "Chicken Breast",
    quantity: 40,
    unit: "lbs",
    urgency: "high",
    reason: "Stock will reach critical level based on current usage trends",
    cost: 159.60,
    supplier: "Premium Poultry Co.",
    leadTime: "2 business days",
    autoOrder: true,
  },
  {
    id: "2",
    name: "Napkins",
    quantity: 1000,
    unit: "pcs",
    urgency: "medium",
    reason: "Regular restocking cycle based on seasonal forecasts",
    cost: 20.00,
    supplier: "Eco-Supplies Inc.",
    leadTime: "3-5 business days",
    autoOrder: false,
  },
  {
    id: "3",
    name: "Espresso Beans",
    quantity: 10,
    unit: "kg",
    urgency: "low",
    reason: "Proactive reordering to maintain optimal stock levels",
    cost: 189.90,
    supplier: "Gourmet Coffee Imports",
    leadTime: "7 business days",
    autoOrder: false,
  },
];

// Mock data for receivable items
const mockReceivables = [
  {
    id: "1",
    name: "Brioche Buns",
    expectedQuantity: 200,
    receivedQuantity: 0,
    unit: "pcs",
    supplier: "Artisan Bakery Inc.",
    purchaseOrderId: "PO-2023-2456",
    expectedDeliveryDate: "Today",
    status: "pending" as const,
  },
  {
    id: "2",
    name: "Whole Milk",
    expectedQuantity: 24,
    receivedQuantity: 12,
    unit: "gal",
    supplier: "Fresh Dairy Farms",
    purchaseOrderId: "PO-2023-2457",
    expectedDeliveryDate: "Today",
    status: "partial" as const,
  },
  {
    id: "3",
    name: "To-Go Cups (16oz)",
    expectedQuantity: 500,
    receivedQuantity: 500,
    unit: "pcs",
    supplier: "EcoPackaging Co.",
    purchaseOrderId: "PO-2023-2455",
    expectedDeliveryDate: "Yesterday",
    status: "complete" as const,
  },
];

// Mock data for variance analysis
const mockVarianceItems = [
  {
    id: "1",
    name: "Chicken Breast",
    expected: 50,
    actual: 42.5,
    unit: "lbs",
    variance: -7.5,
    variancePercent: 15,
    cost: 29.93,
    date: "Jun 15, 2023",
    category: "Meat",
    reviewed: false,
  },
  {
    id: "2",
    name: "Napkins",
    expected: 1200,
    actual: 1000,
    unit: "pcs",
    variance: -200,
    variancePercent: 16.7,
    cost: 4.00,
    date: "Jun 15, 2023",
    category: "Supplies",
    reviewed: true,
  },
  {
    id: "3",
    name: "Cooking Oil",
    expected: 15,
    actual: 18,
    unit: "L",
    variance: 3,
    variancePercent: 20,
    cost: 13.50,
    date: "Jun 15, 2023",
    category: "Ingredients",
    reviewed: false,
  },
  {
    id: "4",
    name: "Lettuce",
    expected: 10,
    actual: 12,
    unit: "heads",
    variance: 2,
    variancePercent: 20,
    cost: 2.50,
    date: "Jun 15, 2023",
    category: "Produce",
    reviewed: false,
  },
];

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [activeSection, setActiveSection] = useState("inventory");
  
  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const handleAddItem = () => {
    toast.info("Add new inventory item functionality would open a modal here");
  };

  const handleEditItem = (item: InventoryItem) => {
    toast.info(`Edit item: ${item.name}`);
  };

  const handleCreateOrder = (items: OrderRecommendation[]) => {
    toast.success(`Creating order for ${items.length} items`);
  };

  const handleReceiveItem = (itemId: string, quantity: number) => {
    toast.success(`Received ${quantity} units of item #${itemId}`);
  };

  const handleReviewVariance = (itemId: string) => {
    toast.info(`Reviewing variance for item #${itemId}`);
  };

  const handleOpenModal = (modalType: string) => {
    switch (modalType) {
      case "Order Management":
        setIsOrderModalOpen(true);
        break;
      case "Delivery Scheduler":
        setIsDeliveryModalOpen(true);
        break;
      case "Stock Alerts":
        setIsAlertsModalOpen(true);
        break;
      case "Invoice Submission":
        setIsInvoiceModalOpen(true);
        break;
      case "Inventory Reports":
        setIsReportsModalOpen(true);
        break;
      default:
        toast.info(`Opening ${modalType} modal`);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-background to-muted/30 p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-semibold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your inventory levels across all locations.
          </p>
        </div>

        {/* Main Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <div className="border-b">
            <TabsList className="mb-0 bg-transparent h-12">
              <TabsTrigger value="inventory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12">Inventory</TabsTrigger>
              <TabsTrigger value="intelligence" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12">Intelligence</TabsTrigger>
              <TabsTrigger value="ordering" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12">Ordering</TabsTrigger>
              <TabsTrigger value="receiving" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12">Receiving</TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12">Analysis</TabsTrigger>
            </TabsList>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 my-6">
            <StatCard
              title="Total Items"
              value={mockInventoryItems.length}
              icon={<Package className="h-4 w-4" />}
              className="shadow-sm hover:shadow transition-shadow"
            />
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.length}
              icon={<AlertTriangle className="h-4 w-4" />}
              className={lowStockItems.length > 0 ? "border-alert-warning shadow-sm hover:shadow transition-shadow" : "shadow-sm hover:shadow transition-shadow"}
            />
            <StatCard
              title="Out of Stock"
              value={outOfStockItems.length}
              icon={<TrendingDown className="h-4 w-4" />}
              className={outOfStockItems.length > 0 ? "border-alert-error shadow-sm hover:shadow transition-shadow" : "shadow-sm hover:shadow transition-shadow"}
            />
            <RoleBasedWrapper 
              allowedRoles={['admin', 'franchiseOwner', 'storeManager']}
              fallback={
                <StatCard
                  title="Items Tracked"
                  value={mockInventoryItems.length}
                  icon={<BarChart2 className="h-4 w-4" />}
                  className="shadow-sm hover:shadow transition-shadow"
                />
              }
            >
              <StatCard
                title="Pending Orders"
                value="3"
                icon={<ShoppingCart className="h-4 w-4" />}
                className="shadow-sm hover:shadow transition-shadow"
              />
            </RoleBasedWrapper>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenModal("Order Management")}
            >
              <ShoppingCart className="h-4 w-4" />
              New Order
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenModal("Delivery Scheduler")}
            >
              <Truck className="h-4 w-4" />
              Schedule Delivery
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenModal("Stock Alerts")}
            >
              <Bell className="h-4 w-4" />
              Stock Alerts
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenModal("Invoice Submission")}
            >
              <DollarSign className="h-4 w-4" />
              Submit Invoice
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenModal("Inventory Reports")}
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="m-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="all" className="relative data-[state=active]:bg-muted/50">
                    All Items
                    <Badge className="ml-2 bg-muted text-muted-foreground">{mockInventoryItems.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="low" className="relative data-[state=active]:bg-muted/50">
                    Low Stock
                    {lowStockItems.length > 0 && (
                      <Badge className="ml-2 bg-alert-warning text-white">{lowStockItems.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="out" className="relative data-[state=active]:bg-muted/50">
                    Out of Stock
                    {outOfStockItems.length > 0 && (
                      <Badge className="ml-2 bg-alert-error text-white">{outOfStockItems.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <Button 
                  onClick={handleAddItem}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="mt-6">
                <TabsContent value="all" className="m-0">
                  <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle>All Inventory Items</CardTitle>
                      <CardDescription>
                        View and manage all items in your inventory
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InventoryTable
                        data={mockInventoryItems}
                        onAddItem={handleAddItem}
                        onEditItem={handleEditItem}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="low" className="m-0">
                  <Card className="shadow-sm hover:shadow transition-shadow border-alert-warning/30">
                    <CardHeader className="pb-2">
                      <CardTitle>Low Stock Items</CardTitle>
                      <CardDescription>
                        Items that need to be reordered soon
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InventoryTable
                        data={lowStockItems}
                        onAddItem={handleAddItem}
                        onEditItem={handleEditItem}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="out" className="m-0">
                  <Card className="shadow-sm hover:shadow transition-shadow border-alert-error/30">
                    <CardHeader className="pb-2">
                      <CardTitle>Out of Stock Items</CardTitle>
                      <CardDescription>
                        Items that need immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InventoryTable
                        data={outOfStockItems}
                        onAddItem={handleAddItem}
                        onEditItem={handleEditItem}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>

          {/* Intelligence Tab Content */}
          <TabsContent value="intelligence" className="m-0">
            <div className="space-y-6">
              <PredictiveInventoryIntelligence items={mockForecastItems} />
            </div>
          </TabsContent>

          {/* Ordering Tab Content */}
          <TabsContent value="ordering" className="m-0">
            <div className="space-y-6">
              <SmartOrderingAssistant 
                recommendations={mockRecommendations} 
                onCreateOrder={handleCreateOrder}
              />
            </div>
          </TabsContent>

          {/* Receiving Tab Content */}
          <TabsContent value="receiving" className="m-0">
            <div className="space-y-6">
              <SimplifiedReceiving 
                items={mockReceivables}
                onReceiveItem={handleReceiveItem}
              />
            </div>
          </TabsContent>

          {/* Analysis Tab Content */}
          <TabsContent value="analysis" className="m-0">
            <div className="space-y-6">
              <VarianceAnalysis 
                items={mockVarianceItems}
                onReviewVariance={handleReviewVariance}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <OrderManagementModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)}
      />
      
      <DeliverySchedulerModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
      
      <StockAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
      />
      
      <InvoiceSubmissionModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
      
      <InventoryReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </MainLayout>
  );
};

export default Inventory;
