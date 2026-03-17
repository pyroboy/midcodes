
import { useState } from "react";
import { Search, User, Plus, UserPlus, Phone, Mail, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/types/sales";
import { MOCK_CUSTOMERS } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

interface CustomerManagementProps {
  onCustomerSelect: (customer: Customer) => void;
  activeCustomer: Customer | null;
}

export const CustomerManagement = ({ onCustomerSelect, activeCustomer }: CustomerManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query) {
      setFilteredCustomers(MOCK_CUSTOMERS);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = MOCK_CUSTOMERS.filter(customer => 
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(query)
    );
    
    setFilteredCustomers(filtered);
  };

  const handleNewCustomer = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: ""
    });
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCustomer) {
      toast({
        title: "Customer updated",
        description: `${formData.name} has been updated`,
      });
    } else {
      // In a real app, we would save to backend here
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        ...formData
      };
      
      onCustomerSelect(newCustomer);
      
      toast({
        title: "Customer created",
        description: `${formData.name} has been added`,
      });
    }
    
    setShowCustomerForm(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customers</CardTitle>
            <Button
              onClick={handleNewCustomer}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Customer</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div id="customer-modal-trigger" className="hidden"></div>
            
            <div className="space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    className={`flex items-center gap-4 p-3 rounded-md border transition-colors cursor-pointer ${
                      activeCustomer?.id === customer.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => onCustomerSelect(customer)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activeCustomer?.id === customer.id 
                        ? "bg-primary/20" 
                        : "bg-muted"
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{customer.name}</h3>
                      <div className="flex flex-wrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 mr-3">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Customers Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try a different search term or add a new customer.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNewCustomer}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        {showCustomerForm ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingCustomer ? "Edit Customer" : "New Customer"}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomerForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="address">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomerForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : activeCustomer ? (
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{activeCustomer.name}</h3>
                  {activeCustomer.loyaltyLevel && (
                    <div className="text-xs px-2 py-0.5 bg-primary/20 rounded-full inline-flex">
                      {activeCustomer.loyaltyLevel.charAt(0).toUpperCase() + activeCustomer.loyaltyLevel.slice(1)} Member
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email Address</div>
                  <div className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {activeCustomer.email}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Phone Number</div>
                  <div className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {activeCustomer.phone}
                  </div>
                </div>
                
                {activeCustomer.address && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Address</div>
                    <div className="font-medium">
                      {activeCustomer.address}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleEditCustomer(activeCustomer)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Customer Selected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a customer from the list to view their details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
