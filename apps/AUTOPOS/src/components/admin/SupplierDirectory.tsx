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
import { Search, PlusCircle, FileText, Phone, Mail, Star, MapPin, Clock, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  code: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  rating: number;
  address: string;
  lastOrder: string;
  notes: string;
}

const mockSuppliers: Supplier[] = [
  { 
    id: 1, 
    name: "AutoParts Wholesalers", 
    code: "APW", 
    category: "Brakes, Filters", 
    contactName: "John Williams", 
    phone: "555-123-4567", 
    email: "jwilliams@apw.com", 
    status: "active", 
    rating: 4,
    address: "123 Industrial Pkwy, Columbus, OH 43215",
    lastOrder: "2023-08-15",
    notes: "Reliable supplier with consistent quality. Offers volume discounts."
  },
  { 
    id: 2, 
    name: "Global Auto Supplies", 
    code: "GAS", 
    category: "Electrical, Fluids", 
    contactName: "Sarah Miller", 
    phone: "555-987-6543", 
    email: "smiller@globalauto.com", 
    status: "active", 
    rating: 3,
    address: "456 Commerce Blvd, Detroit, MI 48226",
    lastOrder: "2023-08-10",
    notes: "Good pricing but occasional delivery delays. Net-30 payment terms."
  },
  { 
    id: 3, 
    name: "Premium Parts Co.", 
    code: "PPC", 
    category: "Engine, Transmission", 
    contactName: "Robert Chen", 
    phone: "555-456-7890", 
    email: "rchen@premiumparts.com", 
    status: "active", 
    rating: 5,
    address: "789 Manufacturing Dr, Chicago, IL 60616",
    lastOrder: "2023-08-18",
    notes: "Premium quality products with excellent technical support. Higher prices but worth it for critical components."
  },
  { 
    id: 4, 
    name: "Budget Auto Parts", 
    code: "BAP", 
    category: "Filters, Wipers, Lighting", 
    contactName: "Linda Garcia", 
    phone: "555-234-5678", 
    email: "lgarcia@budgetauto.com", 
    status: "inactive", 
    rating: 2,
    address: "321 Discount Way, Phoenix, AZ 85004",
    lastOrder: "2023-06-22",
    notes: "Low-cost alternative but inconsistent quality. Use for non-critical components only."
  },
  { 
    id: 5, 
    name: "Tech Auto Innovations", 
    code: "TAI", 
    category: "Electronics, Sensors", 
    contactName: "David Kim", 
    phone: "555-345-6789", 
    email: "dkim@techauto.com", 
    status: "active", 
    rating: 4,
    address: "555 Technology Pl, San Jose, CA 95112",
    lastOrder: "2023-08-12",
    notes: "Excellent for specialty electronic components and newest tech. Good technical documentation."
  },
];

export const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    code: "",
    category: "",
    contactName: "",
    phone: "",
    email: "",
    status: "active",
    rating: 3,
    address: "",
    notes: ""
  });

  const allCategories = suppliers.flatMap(s => s.category.split(", "));
  const uniqueCategories = Array.from(new Set(allCategories));

  const filteredSuppliers = suppliers.filter(supplier => 
    (searchTerm === "" || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === null || supplier.category.includes(selectedCategory))
  );

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierDetails(true);
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.code) {
      toast.error("Please fill in the required fields");
      return;
    }

    const newId = Math.max(...suppliers.map(s => s.id)) + 1;
    const today = new Date().toISOString().split("T")[0];
    
    setSuppliers([...suppliers, { 
      id: newId, 
      name: newSupplier.name || "", 
      code: newSupplier.code || "", 
      category: newSupplier.category || "", 
      contactName: newSupplier.contactName || "", 
      phone: newSupplier.phone || "", 
      email: newSupplier.email || "", 
      status: newSupplier.status as "active" | "inactive" || "active", 
      rating: newSupplier.rating || 3,
      address: newSupplier.address || "",
      lastOrder: today,
      notes: newSupplier.notes || ""
    }]);
    
    setNewSupplier({
      name: "",
      code: "",
      category: "",
      contactName: "",
      phone: "",
      email: "",
      status: "active",
      rating: 3,
      address: "",
      notes: ""
    });
    
    setShowAddSupplier(false);
    toast.success("Supplier added successfully");
  };

  const handleUpdateSupplier = () => {
    if (!selectedSupplier) return;

    setSuppliers(suppliers.map(supplier => 
      supplier.id === selectedSupplier.id ? selectedSupplier : supplier
    ));
    
    setShowSupplierDetails(false);
    toast.success("Supplier updated successfully");
  };

  const handleToggleStatus = (id: number) => {
    setSuppliers(suppliers.map(supplier => 
      supplier.id === id ? { ...supplier, status: supplier.status === "active" ? "inactive" : "active" } : supplier
    ));
    
    const supplier = suppliers.find(s => s.id === id);
    toast.success(`Supplier ${supplier?.status === "active" ? "deactivated" : "activated"} successfully`);
  };

  const renderRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
    ));
  };

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Supplier Directory</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search suppliers..."
              className="pl-8 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value === "" ? null : e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
          
          <Button onClick={() => setShowAddSupplier(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-mono">{supplier.code}</TableCell>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      {supplier.category.split(", ").map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="mr-1 capitalize">
                          {cat}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>{supplier.contactName}</TableCell>
                    <TableCell>
                      <div className="flex">{renderRatingStars(supplier.rating)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={supplier.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSupplier(supplier)}
                        >
                          Details
                        </Button>
                        <Button
                          variant={supplier.status === "active" ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => handleToggleStatus(supplier.id)}
                        >
                          {supplier.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showSupplierDetails} onOpenChange={setShowSupplierDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    {selectedSupplier.name} 
                    <span className="text-sm font-mono text-muted-foreground ml-2">{selectedSupplier.code}</span>
                  </h3>
                  <div className="flex items-center mt-1">
                    <Badge 
                      variant={selectedSupplier.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {selectedSupplier.status}
                    </Badge>
                    <div className="flex ml-3">
                      {renderRatingStars(selectedSupplier.rating)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleStatus(selectedSupplier.id)}
                  >
                    {selectedSupplier.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Contact:</span>
                      <Input
                        value={selectedSupplier.contactName}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, contactName: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={selectedSupplier.phone}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, phone: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={selectedSupplier.email}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, email: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={selectedSupplier.address}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Supplier Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Categories:</span>
                      <Input
                        value={selectedSupplier.category}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, category: e.target.value})}
                        placeholder="Enter categories separated by commas"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Order:</span>
                      <span>{selectedSupplier.lastOrder}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Rating:</span>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedSupplier.rating}
                        onChange={(e) => setSelectedSupplier({...selectedSupplier, rating: parseInt(e.target.value)})}
                      >
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Fair</option>
                        <option value="3">3 - Good</option>
                        <option value="4">4 - Very Good</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <textarea
                  className="w-full p-2 h-24 rounded-md border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedSupplier.notes}
                  onChange={(e) => setSelectedSupplier({...selectedSupplier, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open(`mailto:${selectedSupplier.email}`)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Supplier
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Order History
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDetails(false)}>Cancel</Button>
            <Button onClick={handleUpdateSupplier}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="Global Auto Parts"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Supplier Code *</Label>
              <Input
                id="code"
                placeholder="GAP"
                value={newSupplier.code}
                onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categories</Label>
              <Input
                id="category"
                placeholder="Brakes, Filters, Electronics"
                value={newSupplier.category}
                onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Separate categories with commas</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Name</Label>
              <Input
                id="contact"
                placeholder="John Smith"
                value={newSupplier.contactName}
                onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="555-123-4567"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@supplier.com"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Business St, City, ST 12345"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full p-2 h-20 rounded-md border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Additional information about this supplier..."
                value={newSupplier.notes}
                onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              ></textarea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
