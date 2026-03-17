
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, User, ShoppingCart, Package, Users, Settings, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScaleIn } from "../ui/motion/Transitions";
import { useNavigate } from "react-router-dom";

interface Role {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const roles: Role[] = [
  {
    id: "sales",
    name: "Sales Associate",
    icon: <div className="w-10 h-10 rounded-full bg-blue-100 grid place-items-center"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>,
    description: "Process customer orders and manage sales activities"
  },
  {
    id: "cashier",
    name: "Cashier",
    icon: <div className="w-10 h-10 rounded-full bg-emerald-100 grid place-items-center"><CreditCard className="h-5 w-5 text-emerald-600" /></div>,
    description: "Process transactions and handle checkout operations"
  },
  {
    id: "inventory",
    name: "Inventory Manager",
    icon: <div className="w-10 h-10 rounded-full bg-green-100 grid place-items-center"><Package className="h-5 w-5 text-green-600" /></div>,
    description: "Control stock levels and handle warehouse operations"
  },
  {
    id: "admin",
    name: "Administrator",
    icon: <div className="w-10 h-10 rounded-full bg-purple-100 grid place-items-center"><Users className="h-5 w-5 text-purple-600" /></div>,
    description: "Manage system settings, users, and all operations"
  },
  {
    id: "owner",
    name: "Owner",
    icon: <div className="w-10 h-10 rounded-full bg-amber-100 grid place-items-center"><Settings className="h-5 w-5 text-amber-600" /></div>,
    description: "Complete system control and business oversight"
  },
];

export const LoginModal = ({ onLogin }: { onLogin: (role: string) => void }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedRole) {
      toast({
        title: "Role required",
        description: "Please select a role to continue",
        variant: "destructive",
      });
      return;
    }

    // For testing: Skip username/password validation
    toast({
      title: "Login successful",
      description: `Logged in as ${roles.find(r => r.id === selectedRole)?.name}`
    });
    
    onLogin(selectedRole);
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // For testing: Automatically login when a role is selected
    onLogin(roleId);
    toast({
      title: "Login successful",
      description: `Logged in as ${roles.find(r => r.id === roleId)?.name}`
    });

    // Redirect to inventory/stock if the role is inventory manager
    if (roleId === "inventory") {
      navigate("/inventory/stock");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm grid place-items-center p-4 z-50">
      <ScaleIn>
        <Card className="w-full max-w-md shadow-lg border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">OptimaxParts</CardTitle>
            <CardDescription>Auto Parts Hardware Store System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border transition-all",
                      "hover:border-primary/50 hover:bg-secondary",
                      selectedRole === role.id 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border"
                    )}
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    {role.icon}
                    <span className="mt-2 font-medium text-sm">{role.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Username and password fields are kept but not required for testing */}
            <div className="space-y-3 opacity-50 pointer-events-none">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(
                      "w-full h-10 pl-10 pr-4 rounded-md bg-background text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      "border border-input transition-all duration-200"
                    )}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full h-10 pl-10 pr-10 rounded-md bg-background text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      "border border-input transition-all duration-200"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full opacity-50 pointer-events-none" 
              onClick={handleLogin}
            >
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </ScaleIn>
    </div>
  );
};
