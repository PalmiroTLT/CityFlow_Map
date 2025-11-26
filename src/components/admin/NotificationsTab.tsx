import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bell, TestTube, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationStatistics } from "./NotificationStatistics";
import { ScheduledNotifications } from "./ScheduledNotifications";

export const NotificationsTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: t("error"),
        description: "Не удалось загрузить подписки",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (isTest = false) => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: t("error"),
        description: t("enterTitleAndBody"),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: title.trim(),
          body: body.trim(),
          isTest,
          testUserId: isTest ? userData.user?.id : null,
          data: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      console.log("Notification result:", data);

      toast({
        title: t("success"),
        description: isTest 
          ? `Тестовое уведомление отправлено`
          : `${t("notificationSent")} ${data.successful || 0} ${t("users")} (${data.failed || 0} ${t("failed")})`,
      });

      setTitle("");
      setBody("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: t("error"),
        description: t("notificationFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCleanupInvalidSubscriptions = async () => {
    setIsCleaning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke("cleanup-invalid-subscriptions", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      console.log("Cleanup result:", data);

      toast({
        title: t("success"),
        description: `Очистка завершена: удалено ${data.deleted} из ${data.checked} подписок`,
      });

      // Refresh subscriptions list
      await fetchSubscriptions();
    } catch (error) {
      console.error("Error cleaning up subscriptions:", error);
      toast({
        title: t("error"),
        description: "Не удалось выполнить очистку подписок",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Tabs defaultValue="send" className="space-y-6">
      <TabsList>
        <TabsTrigger value="send">Отправка</TabsTrigger>
        <TabsTrigger value="scheduled">Запланированные</TabsTrigger>
        <TabsTrigger value="statistics">Статистика</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Подписчики на уведомления
                </CardTitle>
                <CardDescription>
                  Всего подписчиков: {subscriptions.length}
                </CardDescription>
              </div>
              <Button
                onClick={handleCleanupInvalidSubscriptions}
                disabled={isCleaning || subscriptions.length === 0}
                variant="outline"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isCleaning ? "Очистка..." : "Удалить невалидные"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Загрузка...</div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Нет подписчиков на уведомления
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Пользователя</TableHead>
                    <TableHead>Дата подписки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs">
                        {sub.user_id || "Анонимный"}
                      </TableCell>
                      <TableCell>
                        {new Date(sub.created_at).toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {t("pushNotifications")}
            </CardTitle>
            <CardDescription>
              {t("sendNotification")} {t("sendToAllUsers").toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">{t("notificationTitle")}</Label>
              <Input
                id="notification-title"
                placeholder={t("notificationTitle")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-body">{t("notificationBody")}</Label>
              <Textarea
                id="notification-body"
                placeholder={t("notificationBody")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSendNotification(true)}
                disabled={isSending || !title.trim() || !body.trim()}
                variant="outline"
                className="flex-1"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {isSending ? t("loading") : "Тест (себе)"}
              </Button>
              
              <Button
                onClick={() => handleSendNotification(false)}
                disabled={isSending || !title.trim() || !body.trim()}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? t("loading") : t("sendToAllUsers")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scheduled">
        <ScheduledNotifications />
      </TabsContent>

      <TabsContent value="statistics">
        <NotificationStatistics />
      </TabsContent>
    </Tabs>
  );
};
