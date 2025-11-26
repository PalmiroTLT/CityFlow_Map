import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        "serviceWorker" in navigator && 
        "PushManager" in window && 
        "Notification" in window;
      setIsSupported(supported);
    };

    checkSupport();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    try {
      // Remove any whitespace and ensure it's a clean base64url string
      const cleanBase64 = base64String.trim().replace(/\s/g, '');
      
      // Add padding if needed
      const padding = "=".repeat((4 - (cleanBase64.length % 4)) % 4);
      const base64 = (cleanBase64 + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error("Failed to decode VAPID key:", error);
      console.error("Base64 string:", base64String);
      throw new Error("VAPID ключ имеет неверный формат. Проверьте секрет VAPID_PUBLIC_KEY в настройках.");
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Не поддерживается",
        description: "Ваш браузер не поддерживает push-уведомления",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast({
          title: "Разрешение не получено",
          description: "Вы отклонили уведомления",
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Generate VAPID keys using edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
      
      if (vapidError || !vapidData?.publicKey) {
        console.error("VAPID key error:", vapidError);
        throw new Error("Не удалось получить VAPID ключ");
      }

      console.log("VAPID public key received, length:", vapidData.publicKey.length);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Требуется авторизация",
          description: "Войдите в аккаунт для подписки на уведомления",
          variant: "destructive",
        });
        return;
      }

      const subscriptionData = subscription.toJSON();

      console.log("Subscribing user:", user.id, "with endpoint:", subscriptionData.endpoint);

      // Save subscription to database
      const { error, data } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh,
        auth: subscriptionData.keys!.auth,
      }).select();

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      console.log("Subscription saved to database:", data);

      setIsSubscribed(true);
      toast({
        title: "Успешно",
        description: "Вы подписались на уведомления",
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error subscribing to push notifications:", error);
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось подписаться на уведомления",
        variant: "destructive",
      });
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        const subscriptionData = subscription.toJSON();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscriptionData.endpoint!);

        setIsSubscribed(false);
        toast({
          title: "Успешно",
          description: "Вы отписались от уведомлений",
        });
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отписаться",
        variant: "destructive",
      });
    }
  };

  return {
    isSubscribed,
    isSupported,
    subscribe,
    unsubscribe,
  };
};
