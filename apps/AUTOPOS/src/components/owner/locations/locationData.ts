
// Mock data for multiple locations
export const locations = [
  { id: 1, name: "Downtown", address: "123 Main St", status: "active" },
  { id: 2, name: "West Side", address: "456 West Blvd", status: "active" },
  { id: 3, name: "North Branch", address: "789 North Ave", status: "active" },
  { id: 4, name: "East End", address: "101 East St", status: "active" },
];

export const salesComparisonData = [
  { name: 'Week 1', Downtown: 4000, WestSide: 3400, NorthBranch: 2400, EastEnd: 1800 },
  { name: 'Week 2', Downtown: 3000, WestSide: 3700, NorthBranch: 2200, EastEnd: 2100 },
  { name: 'Week 3', Downtown: 5000, WestSide: 4200, NorthBranch: 3800, EastEnd: 2800 },
  { name: 'Week 4', Downtown: 4500, WestSide: 4000, NorthBranch: 3600, EastEnd: 2600 },
];

export const inventoryComparisonData = [
  { 
    category: 'Brakes', Downtown: 85, WestSide: 78, NorthBranch: 92, EastEnd: 65 
  },
  { 
    category: 'Engine', Downtown: 75, WestSide: 82, NorthBranch: 70, EastEnd: 60 
  },
  { 
    category: 'Electrical', Downtown: 88, WestSide: 72, NorthBranch: 80, EastEnd: 75 
  },
  { 
    category: 'Suspension', Downtown: 65, WestSide: 80, NorthBranch: 75, EastEnd: 82 
  },
  { 
    category: 'Body Parts', Downtown: 70, WestSide: 65, NorthBranch: 60, EastEnd: 90 
  },
];

export const efficiencyMetrics = [
  { metric: 'Sales per Employee', Downtown: 4.2, WestSide: 3.8, NorthBranch: 4.5, EastEnd: 3.5 },
  { metric: 'Processing Time (min)', Downtown: 12.5, WestSide: 15.2, NorthBranch: 11.8, EastEnd: 16.5 },
  { metric: 'Customer Satisfaction', Downtown: 4.5, WestSide: 4.3, NorthBranch: 4.7, EastEnd: 4.1 },
  { metric: 'Inventory Turnover', Downtown: 5.6, WestSide: 4.8, NorthBranch: 5.2, EastEnd: 4.5 },
  { metric: 'Return Rate (%)', Downtown: 2.2, WestSide: 3.1, NorthBranch: 1.8, EastEnd: 3.5 },
];

export const locationPerformance = [
  {
    subject: 'Sales',
    Downtown: 85,
    WestSide: 75,
    NorthBranch: 90,
    EastEnd: 65,
    fullMark: 100,
  },
  {
    subject: 'Inventory',
    Downtown: 80,
    WestSide: 85,
    NorthBranch: 75,
    EastEnd: 90,
    fullMark: 100,
  },
  {
    subject: 'Customer Service',
    Downtown: 90,
    WestSide: 70,
    NorthBranch: 85,
    EastEnd: 75,
    fullMark: 100,
  },
  {
    subject: 'Efficiency',
    Downtown: 75,
    WestSide: 80,
    NorthBranch: 90,
    EastEnd: 70,
    fullMark: 100,
  },
  {
    subject: 'Profitability',
    Downtown: 85,
    WestSide: 80,
    NorthBranch: 88,
    EastEnd: 72,
    fullMark: 100,
  },
];

// Location KPI stats
export const locationStats = {
  Downtown: {
    sales: "$45,230",
    salesTrend: { value: "8%", positive: true },
    inventory: "92%",
    inventoryTrend: { value: "3%", positive: true },
    staffing: "Full",
    returns: "2.1%"
  },
  WestSide: {
    sales: "$38,450",
    salesTrend: { value: "5%", positive: true },
    inventory: "85%",
    inventoryTrend: { value: "1%", positive: false },
    staffing: "1 vacancy",
    returns: "2.8%"
  },
  NorthBranch: {
    sales: "$42,780",
    salesTrend: { value: "12%", positive: true },
    inventory: "88%",
    inventoryTrend: { value: "2%", positive: true },
    staffing: "Full",
    returns: "1.9%"
  },
  EastEnd: {
    sales: "$32,120",
    salesTrend: { value: "3%", positive: false },
    inventory: "78%",
    inventoryTrend: { value: "4%", positive: false },
    staffing: "2 vacancies",
    returns: "3.2%"
  }
};
