
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem("userRole");
  });
  const navigate = useNavigate();

  const handleLogin = (role: string) => {
    setUserRole(role);
    localStorage.setItem("userRole", role);
    
    // For owner role, show welcome toast
    if (role === "owner") {
      toast.success("Welcome to your Command Center", {
        description: "Your business overview is ready for review"
      });
    }
  };
  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
  };

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <Dashboard userRole={userRole || "admin"} />
    </AppLayout>
  );
};

export default Index;
