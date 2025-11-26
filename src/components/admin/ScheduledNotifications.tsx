import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduled_for: string;
  sent: boolean;
  sent_at: string | null;
}

export const ScheduledNotifications = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setScheduled(data || []);
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить запланированные уведомления",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleNotification = async () => {
    if (!title.trim() || !body.trim() || !scheduledFor) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      toast({
        title: "Ошибка",
        description: "Дата должна быть в будущем",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('scheduled_notifications')
        .insert({
          title: title.trim(),
          body: body.trim(),
          scheduled_for: scheduledDate.toISOString(),
          created_by: userData.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Уведомление запланировано",
      });

      setTitle("");
      setBody("");
      setScheduledFor("");
      fetchScheduled();
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось запланировать уведомление",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Уведомление удалено",
      });

      fetchScheduled();
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомление",
        variant: "destructive",
      });
    }
  };

  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Запланировать уведомление
          </CardTitle>
          <CardDescription>
            Отправка уведомления в указанное время
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled-title">Заголовок</Label>
            <Input
              id="scheduled-title"
              placeholder="Заголовок уведомления"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled-body">Текст</Label>
            <Textarea
              id="scheduled-body"
              placeholder="Текст уведомления"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled-time">Дата и время отправки</Label>
            <Input
              id="scheduled-time"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={minDateTime}
            />
          </div>

          <Button
            onClick={handleScheduleNotification}
            disabled={isScheduling || !title.trim() || !body.trim() || !scheduledFor}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            {isScheduling ? "Планирование..." : "Запланировать"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Запланированные уведомления</CardTitle>
          <CardDescription>
            {scheduled.filter(s => !s.sent).length} ожидают отправки
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : scheduled.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Нет запланированных уведомлений
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Запланировано на</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduled.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="max-w-[200px] truncate">{notif.title}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(notif.scheduled_for).toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      {notif.sent ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          Отправлено
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          Ожидает
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!notif.sent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
