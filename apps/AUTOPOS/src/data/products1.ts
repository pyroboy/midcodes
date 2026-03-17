import { Product } from "@/types/sales";

// Products file 1: Brake and Filter items
export const PRODUCTS_BATCH_1: Product[] = [
  {
    id: "p1",
    name: "Premium Brake Pads",
    description: "High-performance ceramic brake pads for optimal stopping power",
    price: 3999.95,
    category: "Brakes",
    sku: "BRK-001",
    imageUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?q=80&w=500&auto=format",
    stock: 42,
    manufacturer: "StopTech",
    location: "A1-B3",
    barcode: "7891234567801",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "set",
    minStockLevel: 10,
    status: "active",
    cost: 2899.95,
    suppliers: [
      {
        id: "s001",
        name: "AutoParts Distributors",
        contactPerson: "Jane Smith",
        phone: "555-123-4567",
        email: "orders@apd.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "123 Auto Parts St, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for ceramic brake pads",
        minOrderQuantity: 10,
        status: "active",
        code: "APD",
        category: "Brakes"
      },
      {
        id: "s002",
        name: "StopTech Direct",
        contactPerson: "Mike Johnson",
        phone: "555-987-6543",
        email: "sales@stoptech.com",
        leadTime: 5,
        preferredSupplier: false,
        rating: 3,
        address: "456 StopTech St, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Secondary supplier for ceramic brake pads",
        minOrderQuantity: 10,
        status: "active",
        code: "STP",
        category: "Brakes"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2018-2023",
        make: ["Toyota", "Honda"],
        model: ["Camry", "Accord", "Civic"]
      }
    ],
    oem: "44060-33130",
    partType: "aftermarket",
    warranty: "Limited lifetime"
  },
  {
    id: "p2",
    name: "Oil Filter - Standard",
    description: "Standard replacement oil filter for most domestic vehicles",
    price: 649.50,
    category: "Filters",
    sku: "FLT-100",
    imageUrl: "https://images.unsplash.com/photo-1620393508176-1a9c9605d10e?q=80&w=500&auto=format",
    stock: 130,
    manufacturer: "FilterCraft",
    location: "B2-C4",
    barcode: "7891234567802",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 30,
    status: "active",
    cost: 429.50,
    suppliers: [
      {
        id: "s001",
        name: "AutoParts Distributors",
        contactPerson: "Jane Smith",
        phone: "555-123-4567",
        email: "orders@apd.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "123 Auto Parts St, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for filters",
        minOrderQuantity: 10,
        status: "active",
        code: "APD",
        category: "Filters"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2022",
        make: ["Ford", "Chevrolet", "Chrysler"],
        model: ["F-150", "Silverado", "Ram 1500"]
      }
    ],
    oem: "15208-65F0A",
    partType: "OEM",
    warranty: "12 months"
  },
  {
    id: "p3",
    name: "Spark Plug Set (4pk)",
    description: "Set of 4 iridium spark plugs for improved fuel efficiency",
    price: 1649.95,
    category: "Ignition",
    sku: "IGN-220",
    imageUrl: "https://images.unsplash.com/photo-1616010494977-aba29e442eaf?q=80&w=500&auto=format",
    stock: 56,
    manufacturer: "FirePower",
    location: "C3-D1",
    barcode: "7891234567803",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "set",
    minStockLevel: 15,
    status: "active",
    cost: 1199.95,
    suppliers: [
      {
        id: "s003",
        name: "Performance Parts Inc",
        contactPerson: "Alex Brown",
        phone: "555-333-7777",
        email: "sales@perfparts.com",
        leadTime: 4,
        preferredSupplier: true,
        rating: 4,
        address: "789 Performance St, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for performance ignition parts",
        minOrderQuantity: 10,
        status: "active",
        code: "PP",
        category: "Ignition"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2010-2022",
        make: ["Toyota", "Honda", "Nissan", "Mazda"],
        model: ["Camry", "Accord", "Altima", "Mazda6"]
      }
    ],
    oem: "9091901253",
    partType: "performance",
    warranty: "2 years"
  },
  {
    id: "p4",
    name: "Synthetic Motor Oil - 5W30 (5qt)",
    description: "Full synthetic motor oil for superior engine protection",
    price: 1849.95,
    category: "Fluids",
    sku: "OIL-530",
    imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=500&auto=format",
    stock: 90,
    manufacturer: "LubeMax",
    location: "A4-B2",
    barcode: "7891234567804",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "container",
    minStockLevel: 20,
    status: "active",
    cost: 1349.95,
    suppliers: [
      {
        id: "s004",
        name: "Fluids & Lubricants Supply",
        contactPerson: "Sarah Wilson",
        phone: "555-444-8888",
        email: "orders@fluidsnlube.com",
        leadTime: 2,
        preferredSupplier: true,
        rating: 4,
        address: "789 Fluids St, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for fluids",
        minOrderQuantity: 10,
        status: "active",
        code: "F&L",
        category: "Fluids"
      }
    ]
  },
  {
    id: "p5",
    name: "Wiper Blade Set",
    description: "All-weather silicone wiper blades with universal adapter",
    price: 1249.50,
    category: "Exterior",
    sku: "WPR-215",
    imageUrl: "https://images.unsplash.com/photo-1592805723127-004b174a27f4?q=80&w=500&auto=format",
    stock: 73,
    manufacturer: "ClearView",
    location: "D2-E4",
    barcode: "7891234567805",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "pair",
    minStockLevel: 18,
    status: "active",
    cost: 849.50,
    suppliers: [
      {
        id: "s005",
        name: "Exterior Parts Co",
        contactPerson: "Robert Garcia",
        phone: "555-222-3333",
        email: "sales@exteriorparts.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 5,
        address: "100 Exterior Blvd, Anytown, CA 90210",
        lastOrder: "2023-10-01",
        notes: "Reliable supplier for exterior accessories",
        minOrderQuantity: 5,
        status: "active",
        code: "EPC",
        category: "Exterior"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2023",
        make: ["Universal"],
      }
    ],
    partType: "aftermarket",
    warranty: "1 year"
  }
];