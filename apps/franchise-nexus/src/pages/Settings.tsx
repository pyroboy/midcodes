
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useAppSettings } from '@/context/useAppSettings';
import MainLayout from '@/components/layout/MainLayout';
import { Camera, Loader2, RefreshCw, Trash2 } from 'lucide-react';

type SettingsFormValues = {
  appName: string;
  themeColor: 'blue' | 'chrome';
};

const Settings = () => {
  const { settings, updateAppName, updateLogoUrl, updateThemeColor, resetSettings } = useAppSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(settings.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      appName: settings.appName,
      themeColor: settings.themeColor,
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      updateAppName(values.appName);
      updateThemeColor(values.themeColor);
      
      toast({
        title: "Settings updated",
        description: "Your application settings have been saved successfully.",
      });
      
      setIsLoading(false);
    }, 500);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      updateLogoUrl(result);
      
      toast({
        title: "Logo updated",
        description: "Your application logo has been updated.",
      });
    };

    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    resetSettings();
    setPreviewUrl(null);
    form.reset({
      appName: 'MidCodes',
      themeColor: 'chrome',
    });
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    });
  };

  const removeLogo = () => {
    setPreviewUrl(null);
    updateLogoUrl('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "Logo removed",
      description: "Your application logo has been removed.",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your application settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Information</CardTitle>
                    <CardDescription>
                      Customize your application name and branding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="appName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter application name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-3">
                      <FormLabel>Application Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="rounded-md border h-16 w-16 overflow-hidden flex items-center justify-center relative">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className={`h-full w-full flex items-center justify-center ${settings.themeColor === 'chrome' ? 'bg-chrome-600' : 'bg-brand-600'} text-white text-lg font-bold`}>
                              {settings.appName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Change
                            </Button>
                            {previewUrl && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={removeLogo}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload a square image (JPG, PNG) for best results. Max 2MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>
                      Customize the appearance of your application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="themeColor"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel>Primary Color</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              className={`cursor-pointer rounded-md border p-4 flex items-center space-x-3 ${field.value === 'blue' ? 'border-brand-500 ring-2 ring-brand-500' : ''}`}
                              onClick={() => field.onChange('blue')}
                            >
                              <div className="h-5 w-5 rounded-full bg-brand-600" />
                              <div className="font-medium">Blue</div>
                            </div>
                            <div 
                              className={`cursor-pointer rounded-md border p-4 flex items-center space-x-3 ${field.value === 'chrome' ? 'border-chrome-500 ring-2 ring-chrome-500' : ''}`}
                              onClick={() => field.onChange('chrome')}
                            >
                              <div className="h-5 w-5 rounded-full bg-chrome-600" />
                              <div className="font-medium">Chrome Yellow</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="dark-mode" disabled />
                      <label
                        htmlFor="dark-mode"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Dark Mode (Coming Soon)
                      </label>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
