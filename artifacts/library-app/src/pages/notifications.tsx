import React from "react";
import { 
  useListNotifications, getListNotificationsQueryKey, 
  useMarkNotificationRead, useMarkAllNotificationsRead,
  getGetStudentDashboardQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() }
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ data: { notificationId: id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStudentDashboardQueryKey() });
      }
    });
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-sm py-1 px-3 rounded-full font-sans">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Updates regarding your library account</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8 text-primary" /></div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground">You don't have any notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notification) => (
            <Card key={notification.id} className={`transition-colors ${!notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`mt-1 rounded-full p-2 ${!notification.isRead ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className={`text-base ${!notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </div>
                </div>
                {!notification.isRead && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={markRead.isPending}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}