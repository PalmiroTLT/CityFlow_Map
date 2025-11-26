import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type Transaction = {
  id: string;
  created_at: string;
  type: 'deposit' | 'withdrawal' | 'tour_purchase' | 'place_subscription' | 'premium_subscription';
  description: string | null;
  amount: number;
};

type ProfileTabProps = {
  user: User | null;
};

const transactionTypeMap = {
  deposit: { label: "Пополнение", variant: "secondary" },
  withdrawal: { label: "Вывод", variant: "secondary" },
  tour_purchase: { label: "Покупка тура", variant: "default" },
  place_subscription: { label: "Подписка на место", variant: "destructive" },
  premium_subscription: { label: "Премиум подписка", variant: "destructive" },
};

export const ProfileTab = ({ user }: ProfileTabProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, created_at, type, description, amount")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Не удалось загрузить историю транзакций.");
      console.error("Error fetching transactions:", error);
    } else {
      setTransactions(data);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>История операций</CardTitle>
        <CardDescription>Здесь отображаются все ваши финансовые операции.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={transactionTypeMap[tx.type]?.variant as any || "default"}>
                        {transactionTypeMap[tx.type]?.label || tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.description || "-"}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    У вас еще нет транзакций.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
