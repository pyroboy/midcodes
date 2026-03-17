
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { SystemConfiguration } from "@/components/owner/SystemConfiguration";

export default function Settings() {
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem("userRole") || null);

  const handleLogin = (role: string) => {
    localStorage.setItem("userRole", role);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
  };

  return (
    <AppLayout 
      userRole={userRole}
      onLogin={handleLogin}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <SystemConfiguration />
      </div>
    </AppLayout>
  );
}
