import { Product } from "@/types/sales";
// Products file 2: Air filters, headlight kits, alternators, etc.
export const PRODUCTS_BATCH_2: Product[] = [
    {
      id: "p6",
      name: "Air Filter - Performance",
      description: "High-flow air filter for improved horsepower and acceleration",
      price: 2499.50,
      category: "Filters",
      sku: "FLT-210",
      imageUrl: "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?q=80&w=500&auto=format",
      stock: 35,
      manufacturer: "TurboFlow",
      location: "B2-C5",
      barcode: "7891234567806",
      taxRate: 0.07,
      discountable: true,
      unitOfMeasure: "each",
      minStockLevel: 10,
      status: "active",
      cost: 1799.50,
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
          lastOrder: "2023-09-25",
          notes: "Primary supplier for performance parts",
          minOrderQuantity: 5,
          status: "active",
          code: "PP",
          category: "Filters"
        }
      ],
      vehicleCompatibility: [
        {
          year: "2016-2023",
          make: ["Ford", "Dodge", "Chevrolet"],
          model: ["Mustang", "Challenger", "Camaro"]
        }
      ],
      oem: "AF-2345",
      partType: "performance",
      warranty: "3 years"
    },
    {
      id: "p7",
      name: "Headlight Restoration Kit",
      description: "Complete kit to restore foggy and yellowed headlights",
      price: 999.95,
      category: "Exterior",
      sku: "LGT-305",
      imageUrl: "https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=500&auto=format",
      stock: 28,
      manufacturer: "BrightBeam",
      location: "E1-F3",
      barcode: "7891234567807",
      taxRate: 0.07,
      discountable: true,
      unitOfMeasure: "kit",
      minStockLevel: 8,
      status: "active",
      cost: 649.95,
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
      ]
    },
    {
      id: "p8",
      name: "Alternator - Remanufactured",
      description: "Remanufactured alternator with 2-year warranty",
      price: 6499.50,
      category: "Electrical",
      sku: "ELC-405",
      imageUrl: "https://images.unsplash.com/photo-1619642751034-765fc2da97dc?q=80&w=500&auto=format",
      stock: 12,
      manufacturer: "PowerGen",
      location: "F2-G4",
      barcode: "7891234567808",
      taxRate: 0.07,
      discountable: false,
      unitOfMeasure: "each",
      minStockLevel: 5,
      status: "active",
      cost: 4999.50,
      suppliers: [
        {
          id: "s006",
          name: "Electrical Components Ltd",
          contactPerson: "Thomas Lee",
          phone: "555-777-8888",
          email: "orders@electricalcomponents.com",
          leadTime: 5,
          preferredSupplier: true,
          rating: 4,
          address: "500 Electric Ave, Anytown, CA 90210",
          lastOrder: "2023-08-15",
          notes: "Primary supplier for electrical components",
          minOrderQuantity: 2,
          status: "active",
          code: "ECL",
          category: "Electrical"
        }
      ],
      vehicleCompatibility: [
        {
          year: "2010-2018",
          make: ["Toyota", "Lexus"],
          model: ["Camry", "Avalon", "ES350"]
        }
      ],
      oem: "27060-31120",
      partType: "remanufactured",
      warranty: "2 years"
    },
    {
      id: "p9",
      name: "Wheel Bearing Assembly",
      description: "Front wheel bearing and hub assembly",
      price: 4499.50,
      category: "Suspension",
      sku: "SUS-510",
      imageUrl: "https://images.unsplash.com/photo-1580974852861-c381510bc98a?q=80&w=500&auto=format",
      stock: 18,
      manufacturer: "RollerTech",
      location: "G1-H3",
      barcode: "7891234567809",
      taxRate: 0.07,
      discountable: true,
      unitOfMeasure: "each",
      minStockLevel: 4,
      status: "active",
      cost: 3299.50,
      suppliers: [
        {
          id: "s007",
          name: "Suspension Specialists",
          contactPerson: "Laura Martinez",
          phone: "555-999-0000",
          email: "parts@suspensionspecialists.com",
          leadTime: 3,
          preferredSupplier: true,
          rating: 4,
          address: "200 Suspension Rd, Anytown, CA 90210",
          lastOrder: "2023-09-10",
          notes: "Primary supplier for suspension components",
          minOrderQuantity: 4,
          status: "active",
          code: "SS",
          category: "Suspension"
        }
      ],
      vehicleCompatibility: [
        {
          year: "2014-2020",
          make: ["Honda", "Acura"],
          model: ["Accord", "Civic", "TLX", "ILX"]
        }
      ],
      oem: "44300-SDA-A01",
      partType: "OEM",
      warranty: "3 years"
    },
    {
      id: "p10",
      name: "Brake Rotor - Front",
      description: "OEM replacement front brake rotor with anti-rust coating",
      price: 2299.50,
      category: "Brakes",
      sku: "BRK-120",
      imageUrl: "https://images.unsplash.com/photo-1581098631708-634d2e77a5d6?q=80&w=500&auto=format",
      stock: 24,
      manufacturer: "StopTech",
      location: "A1-B4",
      barcode: "7891234567810",
      taxRate: 0.07,
      discountable: true,
      unitOfMeasure: "each",
      minStockLevel: 6,
      status: "active",
      cost: 1599.50,
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
          lastOrder: "2023-09-22",
          notes: "Primary supplier for brake components",
          minOrderQuantity: 6,
          status: "active",
          code: "APD",
          category: "Brakes"
        }
      ],
      vehicleCompatibility: [
        {
          year: "2016-2023",
          make: ["Toyota", "Honda", "Nissan"],
          model: ["Camry", "Accord", "Altima"]
        }
      ],
      oem: "43512-06090",
      partType: "aftermarket",
      warranty: "2 years"
    }
  ];