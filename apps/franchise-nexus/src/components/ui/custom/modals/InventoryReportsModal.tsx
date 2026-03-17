import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Download, BarChart2, PieChart, LineChart, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface InventoryReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const reportTypes = [
  { id: "inventory-levels", name: "Inventory Levels", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "stock-movement", name: "Stock Movement", icon: <LineChart className="h-4 w-4" /> },
  { id: "category-breakdown", name: "Category Breakdown", icon: <PieChart className="h-4 w-4" /> },
  { id: "cost-analysis", name: "Cost Analysis", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "variance-report", name: "Variance Report", icon: <LineChart className="h-4 w-4" /> }
];

const categories = [
  "Meat", "Dairy", "Produce", "Bakery", "Beverage", 
  "Packaging", "Supplies", "Ingredients"
];

const exportFormats = [
  { id: "pdf", name: "PDF Document (.pdf)" },
  { id: "excel", name: "Excel Spreadsheet (.xlsx)" },
  { id: "csv", name: "CSV File (.csv)" }
];

export function InventoryReportsModal({ isOpen, onClose }: InventoryReportsModalProps) {
  const [activeTab, setActiveTab] = useState("generate");
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("week");
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 7));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories, category]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  const handleDateRangeChange = (value: "today" | "week" | "month" | "custom") => {
    setDateRange(value);
    
    const today = new Date();
    switch(value) {
      case "today":
        setFromDate(today);
        setToDate(today);
        break;
      case "week":
        setFromDate(subDays(today, 7));
        setToDate(today);
        break;
      case "month":
        setFromDate(subDays(today, 30));
        setToDate(today);
        break;
      // For custom, we keep the existing dates
    }
  };

  const handleGenerateReport = () => {
    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }
    
    const selectedReport = reportTypes.find(r => r.id === reportType);
    
    toast.success(`Generating ${selectedReport?.name} report`);
    toast("Your report will be ready in a few moments");
    
    // Simulate report generation delay
    setTimeout(() => {
      toast.success("Report generated successfully!");
      setActiveTab("download");
    }, 1500);
  };

  const handleDownloadReport = () => {
    const formatName = exportFormats.find(f => f.id === exportFormat)?.name.split(" ")[0];
    toast.success(`Downloading report as ${formatName}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inventory Reports
          </DialogTitle>
          <DialogDescription>
            Generate customized reports for your inventory data
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="download" disabled={activeTab !== "download"}>Download Report</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Date Range</Label>
                <RadioGroup 
                  value={dateRange} 
                  onValueChange={(v) => handleDateRangeChange(v as any)}
                  className="flex flex-wrap space-y-0 gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="today" id="today" />
                    <Label htmlFor="today" className="cursor-pointer">Today</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="cursor-pointer">Last 7 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="cursor-pointer">Last 30 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer">Custom Range</Label>
                  </div>
                </RadioGroup>
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fromDate ? format(fromDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={(date) => date && setFromDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {toDate ? format(toDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={(date) => date && setToDate(date)}
                          initialFocus
                          disabled={(date) => date < fromDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Categories</Label>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs"
                    onClick={handleSelectAllCategories}
                  >
                    {selectedCategories.length === categories.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeCharts" 
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  />
                  <Label htmlFor="includeCharts">Include Charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeTables" 
                    checked={includeTables}
                    onCheckedChange={(checked) => setIncludeTables(!!checked)}
                  />
                  <Label htmlFor="includeTables">Include Tables</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="download" className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-2 flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                <h3 className="font-medium">
                  {reportTypes.find(r => r.id === reportType)?.name} Report
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Data from: {format(fromDate, "MMM d, yyyy")} 
                {fromDate.toDateString() !== toDate.toDateString() && ` to ${format(toDate, "MMM d, yyyy")}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Categories: {selectedCategories.length === 0 
                  ? "All" 
                  : selectedCategories.length === categories.length 
                    ? "All" 
                    : selectedCategories.join(", ")}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="exportFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {activeTab === "generate" ? (
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          ) : (
            <Button onClick={handleDownloadReport} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
