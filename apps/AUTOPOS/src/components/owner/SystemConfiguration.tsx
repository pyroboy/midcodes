
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Database, ShieldCheck, Bell, Settings, ImageIcon } from "lucide-react";
import { usePartRecognition } from "@/contexts/PartRecognitionContext";
import { toast } from "sonner";

export const SystemConfiguration = () => {
  const { settings, updateSettings, savedImages, clearSavedImages } = usePartRecognition();
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [maintenanceWindow, setMaintenanceWindow] = useState("sunday");

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      updateSettings({ confidenceThreshold: value });
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-5 mb-6">
        <TabsTrigger value="general">
          <Settings className="mr-2 h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="database">
          <Database className="mr-2 h-4 w-4" />
          Database
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="part-recognition">
          <ImageIcon className="mr-2 h-4 w-4" />
          Part Recognition
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="America/Los_Angeles" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" defaultValue="English" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Main St, Anytown" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>Configure user access levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-role">Admin Role</Label>
                <Input id="admin-role" defaultValue="Administrator" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager-role">Manager Role</Label>
                <Input id="manager-role" defaultValue="Manager" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password Policies</CardTitle>
              <CardDescription>Set password requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Minimum Length</Label>
                <Input id="min-length" defaultValue="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="require-symbols">Require Symbols</Label>
                <Input id="require-symbols" defaultValue="Yes" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="database">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure database backup options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <select
                  id="backup-frequency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-location">Backup Location</Label>
                <Input id="backup-location" defaultValue="/var/backups" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>Schedule system maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-window">Maintenance Window</Label>
                <select
                  id="maintenance-window"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={maintenanceWindow}
                  onChange={(e) => setMaintenanceWindow(e.target.value)}
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-time">Maintenance Time</Label>
                <Input id="maintenance-time" defaultValue="03:00" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Input id="email-notifications" defaultValue="Enabled" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <Input id="sms-notifications" defaultValue="Disabled" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize notification emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-confirmation">Order Confirmation</Label>
                <Input id="order-confirmation" defaultValue="Your order has been confirmed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-update">Shipping Update</Label>
                <Input id="shipping-update" defaultValue="Your order has been shipped" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="part-recognition">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Recognition Settings</CardTitle>
              <CardDescription>Configure part recognition behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-save recognized parts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save images of recognized parts
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.autoSaveEnabled}
                    onCheckedChange={(checked) => updateSettings({ autoSaveEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="save-auto-parts">Save only auto parts</Label>
                    <p className="text-sm text-muted-foreground">
                      Only save images identified as automotive parts
                    </p>
                  </div>
                  <Switch
                    id="save-auto-parts"
                    checked={settings.saveOnlyAutoParts}
                    onCheckedChange={(checked) => updateSettings({ saveOnlyAutoParts: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">
                    Confidence threshold ({(settings.confidenceThreshold * 100).toFixed(0)}%)
                  </Label>
                  <Input
                    id="confidence-threshold"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.confidenceThreshold}
                    onChange={handleThresholdChange}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum confidence level required for auto-saving (higher = more accurate but fewer matches)
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    updateSettings({
                      autoSaveEnabled: true,
                      confidenceThreshold: 0.65,
                      saveOnlyAutoParts: true
                    });
                    toast.success("Settings reset to defaults");
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Saved Images</CardTitle>
              <CardDescription>View and manage saved part images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedImages.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                      {savedImages.map((img) => (
                        <div key={img.id} className="border rounded-md p-2 space-y-2">
                          <div className="aspect-square bg-muted rounded-md overflow-hidden">
                            <img 
                              src={img.imageData} 
                              alt="Saved part" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium truncate">
                              {img.analysis?.productType || 'Unknown product'}
                              {img.analysis?.isAutoPart && ' (Auto Part)'}
                            </p>
                            <p className="text-xs font-medium">
                              Confidence: {(img.confidence * 100).toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(img.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          clearSavedImages();
                          toast.success("All saved images cleared");
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No saved images yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images will appear here when recognized parts are saved
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};
