
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface StockAlert {
  id: string;
  type: "low" | "out" | "expiring";
  name: string;
  enabled: boolean;
  threshold?: number;
  notifyVia: ("email" | "sms" | "push")[];
}

interface StockAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockAlerts: StockAlert[] = [
  {
    id: "1",
    type: "low",
    name: "Low Stock Alert",
    enabled: true,
    threshold: 15,
    notifyVia: ["email", "push"]
  },
  {
    id: "2",
    type: "out",
    name: "Out of Stock Alert",
    enabled: true,
    notifyVia: ["email", "sms", "push"]
  },
  {
    id: "3",
    type: "expiring",
    name: "Expiring Inventory Alert",
    enabled: false,
    threshold: 3,
    notifyVia: ["email"]
  }
];

export function StockAlertsModal({ isOpen, onClose }: StockAlertsModalProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>(mockAlerts);

  const handleToggleAlert = (id: string, enabled: boolean) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, enabled } : alert
    ));
  };

  const handleUpdateThreshold = (id: string, threshold: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, threshold } : alert
    ));
  };

  const handleToggleNotification = (id: string, type: "email" | "sms" | "push") => {
    setAlerts(alerts.map(alert => {
      if (alert.id === id) {
        const notifyVia = alert.notifyVia.includes(type)
          ? alert.notifyVia.filter(t => t !== type)
          : [...alert.notifyVia, type];
        return { ...alert, notifyVia };
      }
      return alert;
    }));
  };

  const handleSaveSettings = () => {
    toast.success("Alert settings saved successfully");
    onClose();
  };

  // Helper function to get the badge color based on alert type
  const getAlertBadge = (type: "low" | "out" | "expiring") => {
    switch (type) {
      case "low":
        return <Badge className="bg-alert-warning">Low Stock</Badge>;
      case "out":
        return <Badge className="bg-alert-error">Out of Stock</Badge>;
      case "expiring":
        return <Badge className="bg-amber-500">Expiring Soon</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Inventory Alert Settings
          </DialogTitle>
          <DialogDescription>
            Configure when and how you receive inventory alerts
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto py-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="mb-6 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-medium">{alert.name}</h3>
                  {getAlertBadge(alert.type)}
                </div>
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor={`enable-${alert.id}`}
                    className={`text-sm ${alert.enabled ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {alert.enabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Checkbox 
                    id={`enable-${alert.id}`}
                    checked={alert.enabled}
                    onCheckedChange={(checked) => handleToggleAlert(alert.id, checked as boolean)}
                  />
                </div>
              </div>

              <Separator className="my-3" />

              <div className={alert.enabled ? "opacity-100" : "opacity-50"}>
                {alert.threshold !== undefined && (
                  <div className="mb-3">
                    <Label htmlFor={`threshold-${alert.id}`} className="mb-1 block text-sm">
                      Alert Threshold
                      {alert.type === "low" && " (% of reorder level)"}
                      {alert.type === "expiring" && " (days until expiry)"}
                    </Label>
                    <div className="flex w-full max-w-[180px] gap-2">
                      <Input
                        id={`threshold-${alert.id}`}
                        type="number"
                        value={alert.threshold}
                        onChange={(e) => handleUpdateThreshold(alert.id, Number(e.target.value))}
                        min={1}
                        max={100}
                        disabled={!alert.enabled}
                      />
                      <span className="flex items-center text-sm">
                        {alert.type === "low" ? "%" : "days"}
                      </span>
                    </div>
                  </div>
                )}

                <h4 className="mb-2 text-sm font-medium">Notification Methods</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`email-${alert.id}`}
                      checked={alert.notifyVia.includes("email")}
                      onCheckedChange={() => handleToggleNotification(alert.id, "email")}
                      disabled={!alert.enabled}
                    />
                    <Label htmlFor={`email-${alert.id}`} className="text-sm">Email</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`sms-${alert.id}`}
                      checked={alert.notifyVia.includes("sms")}
                      onCheckedChange={() => handleToggleNotification(alert.id, "sms")}
                      disabled={!alert.enabled}
                    />
                    <Label htmlFor={`sms-${alert.id}`} className="text-sm">SMS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`push-${alert.id}`}
                      checked={alert.notifyVia.includes("push")}
                      onCheckedChange={() => handleToggleNotification(alert.id, "push")}
                      disabled={!alert.enabled}
                    />
                    <Label htmlFor={`push-${alert.id}`} className="text-sm">Push Notification</Label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveSettings} className="gap-2">
            <Settings className="h-4 w-4" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
