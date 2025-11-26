import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationStat {
  id: string;
  title: string;
  body: string;
  sent_at: string;
  successful_count: number;
  failed_count: number;
  total_recipients: number;
  is_test: boolean;
}

export const NotificationStatistics = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<NotificationStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('notification_statistics')
        .select('*')
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSent = stats.reduce((sum, stat) => sum + stat.successful_count, 0);
  const totalFailed = stats.reduce((sum, stat) => sum + stat.failed_count, 0);
  const totalNotifications = stats.length;
  const successRate = totalSent + totalFailed > 0 
    ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего отправлено</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">уведомлений</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Успешных доставок</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">из {totalSent + totalFailed} ({successRate}%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ошибок доставки</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">неудачных попыток</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История отправок</CardTitle>
          <CardDescription>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
              <TabsList>
                <TabsTrigger value="day">За день</TabsTrigger>
                <TabsTrigger value="week">За неделю</TabsTrigger>
                <TabsTrigger value="month">За месяц</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Получателей</TableHead>
                  <TableHead>Доставлено</TableHead>
                  <TableHead>Ошибок</TableHead>
                  <TableHead>Тип</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(stat.sent_at).toLocaleString("ru-RU", {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{stat.title}</TableCell>
                    <TableCell>{stat.total_recipients}</TableCell>
                    <TableCell className="text-green-600">{stat.successful_count}</TableCell>
                    <TableCell className="text-red-600">{stat.failed_count}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${stat.is_test ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                        {stat.is_test ? 'Тест' : 'Обычное'}
                      </span>
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
