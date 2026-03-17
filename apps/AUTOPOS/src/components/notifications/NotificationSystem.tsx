
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Package, 
  AlertCircle, 
  RefreshCw, 
  UserPlus, 
  CreditCard, 
  CheckCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: number;
  type: 'order' | 'inventory' | 'system' | 'user' | 'payment' | 'task';
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  title: string;
  description: string;
  time: string;
  isNew?: boolean;
  isRead?: boolean;
}

interface NotificationSystemProps {
  onToggle?: (isOpen: boolean) => void;
  className?: string;
}

export const NotificationSystem = ({ onToggle, className }: NotificationSystemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  const [autoHideTimers, setAutoHideTimers] = useState<Record<number, NodeJS.Timeout>>({});
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Default notification data
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'order', icon: Package, color: 'red', title: 'New Order', description: 'Order #1234 has been placed', time: '5 min ago', isRead: false },
    { id: 2, type: 'inventory', icon: AlertCircle, color: 'red', title: 'Inventory Alert', description: 'Item XYZ is running low', time: '1 hour ago', isRead: false },
    { id: 3, type: 'system', icon: RefreshCw, color: 'red', title: 'System Update', description: 'System will be updated tonight', time: '2 hours ago', isRead: false },
    { id: 4, type: 'user', icon: UserPlus, color: 'red', title: 'New User', description: 'John Doe joined your team', time: '3 hours ago', isRead: false },
    { id: 5, type: 'payment', icon: CreditCard, color: 'red', title: 'Payment Received', description: '$1,250.00 from Customer #5678', time: '5 hours ago', isRead: false },
    { id: 6, type: 'task', icon: CheckCircle, color: 'red', title: 'Task Completed', description: 'Weekly inventory audit finished', time: '1 day ago', isRead: false },
  ]);

  // Mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true, isNew: false } : notification
    ));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ 
      ...notification, 
      isRead: true,
      isNew: false 
    })));
  };

  // Toggle read status of a notification
  const toggleReadStatus = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: !notification.isRead } : notification
    ));
  };
  
  // Add new notification (for demonstration purposes)
  const addNewNotification = () => {
    const newNotificationId = Date.now();
    const newNotification = {
      id: newNotificationId,
      type: 'order' as const,
      icon: Package,
      color: 'red',
      title: 'New Order',
      description: `Order #${Math.floor(1000 + Math.random() * 9000)} has been placed`,
      time: 'Just now',
      isNew: true,
      isRead: false
    };
    
    // Add to main notifications list
    setNotifications([newNotification, ...notifications]);
    
    // Add to toast notifications stack
    setToastNotifications(prev => [...prev, newNotification]);
    
    // Set auto-hide timer for this specific notification
    const fadeOutTimer = setTimeout(() => {
      // Remove after animation completes
      setToastNotifications(prev => prev.filter(toast => toast.id !== newNotificationId));
      
      // Remove from timers object
      setAutoHideTimers(prev => {
        const newTimers = {...prev};
        delete newTimers[newNotificationId];
        return newTimers;
      });
    }, 3000);
    
    // Store the timer reference
    setAutoHideTimers(prev => ({
      ...prev,
      [newNotificationId]: fadeOutTimer
    }));
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      // Clear all auto-hide timers
      Object.values(autoHideTimers).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, [autoHideTimers]);
  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      event.stopPropagation();
      if (isExpanded && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Make sure we're not clicking the notification toggle elements
        const bellIcon = document.getElementById('notification-bell-button');
        const notificationPreview = document.getElementById('notification-preview');
        
        if (
          !bellIcon?.contains(event.target as Node) && 
          !notificationPreview?.contains(event.target as Node)
        ) {
          setIsExpanded(false);
          if (onToggle) onToggle(false);
        }
      }
    };
    // Add event listener when the modal is expanded
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
    }
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, [isExpanded, onToggle]);
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggle) onToggle(newState);
  };
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-3">
        {/* First notification preview */}
        {!isExpanded && unreadCount > 0 && (
          <div 
            id="notification-preview"
            className="cursor-pointer flex items-center gap-2 animate-fade-in bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full transition-all duration-300"
            onClick={toggleExpanded}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
              {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
            </div>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}

        {/* Bell icon button */}
        <Button
          id="notification-bell-button"
          variant="ghost"
          size="icon"
          className="relative"
          onClick={toggleExpanded}
        >
          <Bell className={cn("h-5 w-5", unreadCount > 0 ? "text-red-500" : "")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
      
      {/* Dropdown modal for notifications with fixed width */}
      {isExpanded && (
        <div 
          ref={modalRef}
          className="absolute top-12 right-0 z-50 bg-background shadow-lg rounded-lg border border-border w-[400px] max-h-96 overflow-y-auto transition-all duration-300 ease-in-out animate-fade-in"
          style={{
            transformOrigin: 'top right'
          }}
        >
          <div className="w-full border-t border-border bg-background px-4 py-3 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-lg text-red-500 dark:text-red-400">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all as read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => {
                    setIsExpanded(false);
                    if (onToggle) onToggle(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Alert 
                    key={notification.id} 
                    className={cn(
                      "p-3 hover:bg-accent transition-colors duration-200 cursor-pointer border-l-4 shadow-sm", 
                      notification.isRead ? "border-l-gray-300 bg-gray-50 dark:bg-gray-900/20" : "border-l-red-500"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <AlertTitle className={cn(
                      "text-sm font-semibold flex items-center justify-between",
                      notification.isRead ? "text-gray-600 dark:text-gray-400" : "text-red-600 dark:text-red-400"
                    )}>
                      <span className="flex items-center gap-2">
                        {notification.title}
                        {notification.isNew && !notification.isRead && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </span>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={cn(
                          "h-6 w-6 rounded-full ml-auto",
                          notification.isRead ? 
                            "hover:bg-blue-100 dark:hover:bg-blue-900/20 text-gray-400" : 
                            "hover:bg-red-100 dark:hover:bg-red-900/20"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReadStatus(notification.id);
                        }}
                      >
                        <Check className={cn(
                          "h-3 w-3",
                          notification.isRead ? "text-blue-500" : "opacity-0"
                        )} />
                      </Button>
                    </AlertTitle>
                    <AlertDescription className={cn(
                      "text-xs",
                      notification.isRead ? "text-gray-500" : ""
                    )}>
                      <div className="flex justify-between items-center">
                        <span>{notification.description}</span>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
