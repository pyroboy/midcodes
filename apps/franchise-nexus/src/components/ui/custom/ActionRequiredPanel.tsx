
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertPriority = "critical" | "high" | "medium" | "low";
export type AlertStatus = "pending" | "in-progress" | "resolved" | "dismissed";

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  priority: AlertPriority;
  status: AlertStatus;
  locationId?: string;
  locationName?: string;
}

interface ActionRequiredPanelProps {
  alerts: AlertItem[];
  onResolveAlert?: (alertId: string) => void;
  onDismissAlert?: (alertId: string) => void;
  className?: string;
}

const ActionRequiredPanel = ({
  alerts,
  onResolveAlert,
  onDismissAlert,
  className,
}: ActionRequiredPanelProps) => {
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    );
  };

  const getPriorityDetails = (priority: AlertPriority) => {
    switch (priority) {
      case "critical":
        return { icon: <XCircle className="h-5 w-5" />, color: "bg-alert-error text-white" };
      case "high":
        return { icon: <AlertCircle className="h-5 w-5" />, color: "bg-alert-warning text-white" };
      case "medium":
        return { icon: <AlertTriangle className="h-5 w-5" />, color: "bg-alert-warning/80 text-white" };
      case "low":
        return { icon: <Clock className="h-5 w-5" />, color: "bg-alert-info text-white" };
      default:
        return { icon: <AlertCircle className="h-5 w-5" />, color: "bg-alert-info text-white" };
    }
  };

  const getStatusDetails = (status: AlertStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "bg-muted-foreground/20 text-muted-foreground" };
      case "in-progress":
        return { label: "In Progress", color: "bg-alert-info/20 text-alert-info" };
      case "resolved":
        return { label: "Resolved", color: "bg-alert-success/20 text-alert-success" };
      case "dismissed":
        return { label: "Dismissed", color: "bg-muted-foreground/20 text-muted-foreground" };
      default:
        return { label: "Pending", color: "bg-muted-foreground/20 text-muted-foreground" };
    }
  };

  // Sort alerts by priority (critical first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Filter out resolved and dismissed alerts
  const activeAlerts = sortedAlerts.filter(
    (alert) => alert.status !== "resolved" && alert.status !== "dismissed"
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Action Required</CardTitle>
        <CardDescription>
          {activeAlerts.length} {activeAlerts.length === 1 ? "alert" : "alerts"} requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-1">
        <div className="flex flex-col divide-y">
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => {
              const priorityDetails = getPriorityDetails(alert.priority);
              const statusDetails = getStatusDetails(alert.status);
              const isExpanded = expandedAlerts.includes(alert.id);

              return (
                <div
                  key={alert.id}
                  className="px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(alert.id)}
                  >
                    <div className={cn("rounded-full p-1", priorityDetails.color)}>
                      {priorityDetails.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">
                          {alert.title}
                        </h4>
                        <Badge className={statusDetails.color}>
                          {statusDetails.label}
                        </Badge>
                      </div>
                      {alert.locationName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Location: {alert.locationName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.timestamp}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-9">
                      <p className="text-sm mb-3">{alert.description}</p>
                      <div className="flex space-x-2">
                        {alert.status !== "resolved" && onResolveAlert && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-alert-success h-8"
                            onClick={() => onResolveAlert(alert.id)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Resolve
                          </Button>
                        )}
                        {alert.status !== "dismissed" && onDismissAlert && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-muted-foreground h-8"
                            onClick={() => onDismissAlert(alert.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
              <p>No pending alerts. Everything looks good!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionRequiredPanel;
