import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PushNotificationButton = () => {
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show the button if push notifications are not supported or user is not logged in
  if (!isSupported || !user) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSubscribed ? "secondary" : "outline"}
            size="icon"
            onClick={isSubscribed ? unsubscribe : subscribe}
            className="h-9 w-9"
          >
            {isSubscribed ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSubscribed
              ? t("unsubscribeNotifications") || "Отключить уведомления"
              : t("subscribeNotifications") || "Включить уведомления"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
