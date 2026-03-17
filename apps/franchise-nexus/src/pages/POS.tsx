/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingBag, 
  CreditCard, 
  RefreshCw, 
  ArrowDownToLine,
  Settings,
  BarChart2,
  HardDrive,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import RoleBasedWrapper from "@/components/ui/custom/RoleBasedWrapper";
import { posSystems, menuSyncStatus } from "@/utils/posUtils";

function POS() {
  const handleSyncPOS = (posId: string) => {
    toast.info(`Syncing POS: ${posSystems.find(pos => pos.id === posId)?.name}`);
  };

  const handleConfigurePOS = (posId: string) => {
    toast.info(`Configuring POS: ${posSystems.find(pos => pos.id === posId)?.name}`);
  };

  const handlePublishMenu = () => {
    toast.success("Publishing menu changes to all connected POS systems");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-alert-success">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="outline">Not Connected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">POS Integration</h1>
          <p className="text-muted-foreground mt-1">
            Manage your point-of-sale connections and menu deployments.
          </p>
        </div>

        {/* POS Connection Status */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                POS Connections
              </CardTitle>
              <CardDescription>
                Status of your POS system integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {posSystems.map((pos) => (
                <div key={pos.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{pos.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last synced: {pos.lastSync}
                        </p>
                      </div>
                    </div>
                    <div>{getStatusBadge(pos.status)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleSyncPOS(pos.id)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleConfigurePOS(pos.id)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>
                </div>
              ))}

              <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner']}>
                <Button className="w-full mt-4" variant="outline">
                  Connect New POS
                </Button>
              </RoleBasedWrapper>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Menu Deployment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-brand-600" />
                  Menu Deployment
                </CardTitle>
                <CardDescription>
                  Publish menu updates to all connected POS systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Pending Changes</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{menuSyncStatus.pendingChanges}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Last published: {menuSyncStatus.lastPublished}
                        </span>
                      </div>
                    </div>
                    <RoleBasedWrapper 
                      allowedRoles={['admin', 'franchiseOwner']}
                      fallback={
                        <Badge variant="secondary" className="px-3">
                          <Info className="mr-1 h-3 w-3" />
                          Requires Approval
                        </Badge>
                      }
                    >
                      <Button onClick={handlePublishMenu}>
                        Publish Changes
                      </Button>
                    </RoleBasedWrapper>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sync Progress</span>
                      <span>{menuSyncStatus.syncProgress}%</span>
                    </div>
                    <Progress value={menuSyncStatus.syncProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-y">
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center rounded-none py-6 hover:bg-muted"
                  >
                    <BarChart2 className="h-8 w-8 mb-2 text-brand-600" />
                    <span>Sales Reports</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center rounded-none py-6 hover:bg-muted"
                  >
                    <CreditCard className="h-8 w-8 mb-2 text-brand-600" />
                    <span>Payment Methods</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center rounded-none py-6 hover:bg-muted"
                  >
                    <HardDrive className="h-8 w-8 mb-2 text-brand-600" />
                    <span>Backup Data</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center rounded-none py-6 hover:bg-muted"
                  >
                    <Settings className="h-8 w-8 mb-2 text-brand-600" />
                    <span>POS Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* POS Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-brand-600" />
              POS Integration Guide
            </CardTitle>
            <CardDescription>
              Learn how to set up and manage your POS integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="rounded-full bg-brand-500/10 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-medium mb-2">Connect POS Systems</h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to connect your existing POS systems to Midcodes
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="rounded-full bg-brand-500/10 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <ArrowDownToLine className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-medium mb-2">Menu Deployment</h3>
                <p className="text-sm text-muted-foreground">
                  Push menu updates to all your franchise locations simultaneously
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="rounded-full bg-brand-500/10 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <BarChart2 className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-medium mb-2">Sales Data Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically import sales data from your POS systems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default POS;