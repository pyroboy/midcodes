import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChefHat, Package, BarChart2, ShoppingBag, User, Shield, Store, Coffee } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  const navigate = useNavigate();
  const { login, user, isLoading, error } = useAuth();
  const [email, setEmail] = useState("admin@franchise.com");
  const [password, setPassword] = useState("123456");

  // Move navigation logic to useEffect
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    await login(demoEmail, "123456");
  };

  const demoUsers = [
    {
      email: "admin@franchise.com",
      role: "Admin",
      icon: <Shield size={18} />,
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      email: "owner@franchise.com",
      role: "Franchise Owner",
      icon: <Store size={18} />,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      email: "manager@franchise.com",
      role: "Store Manager",
      icon: <Coffee size={18} />,
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      email: "staff@franchise.com",
      role: "Kitchen Staff",
      icon: <ChefHat size={18} />,
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  const featureItems = [
    {
      icon: <ShoppingBag size={24} className="text-brand-600" />,
      title: "POS Integration",
      description: "Centralize sales data and standardize menu implementation across all franchise locations.",
    },
    {
      icon: <Package size={24} className="text-brand-600" />,
      title: "Inventory Management",
      description: "Track stock levels, get alerts on low inventory, and connect inventory to menu items.",
    },
    {
      icon: <ChefHat size={24} className="text-brand-600" />,
      title: "Recipe Management",
      description: "Maintain consistent recipes across all franchise locations with version control.",
    },
    {
      icon: <BarChart2 size={24} className="text-brand-600" />,
      title: "Analytics & Reporting",
      description: "Visualize performance data for informed business decisions across all locations.",
    },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Left side - Login form */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-brand-600 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,hsl(212,100%,60%)_0%,transparent_70%),radial-gradient(circle_at_70%_70%,hsl(212,100%,60%)_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-3xl text-white p-12">
          <div className="flex items-center mb-8">
            <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <ChefHat className="h-6 w-6 text-brand-600" />
            </div>
            <h1 className="text-4xl font-bold">Midcodes</h1>
          </div>
          
          <h2 className="text-3xl font-medium mb-6">Streamline your franchise operations</h2>
          <p className="text-lg text-white/80 mb-12 max-w-xl">
            The complete management system for restaurant franchises, providing seamless integration across all your locations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featureItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                <ChefHat className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <a href="#" className="text-sm text-brand-600 hover:text-brand-700">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className={cn("w-full bg-brand-600 hover:bg-brand-500", isLoading && "opacity-70 cursor-not-allowed")}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Demo accounts (password: 123456)
              </p>
              <div className="flex justify-center gap-2">
                <TooltipProvider>
                  {demoUsers.map((demoUser, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          className={cn("rounded-full p-2", demoUser.color)}
                          onClick={() => handleDemoLogin(demoUser.email)}
                          type="button"
                        >
                          {demoUser.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{demoUser.role}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;
