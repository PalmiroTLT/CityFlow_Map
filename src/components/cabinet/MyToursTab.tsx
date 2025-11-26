import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type PurchasedTour = {
  id: string;
  purchased_at: string;
  tours: {
    name: string;
    description: string | null;
    price: number | null;
  } | null;
};

type MyToursTabProps = {
  user: User | null;
};

export const MyToursTab = ({ user }: MyToursTabProps) => {
  const [tours, setTours] = useState<PurchasedTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchasedTours();
    }
  }, [user]);

  const fetchPurchasedTours = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("purchased_tours")
      .select(`
        id,
        purchased_at,
        tours (
          name,
          description,
          price
        )
      `)
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });

    if (error) {
      toast.error("Не удалось загрузить список купленных туров.");
      console.error("Error fetching purchased tours:", error);
    } else {
      setTours(data as PurchasedTour[]);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Мои туры</CardTitle>
        <CardDescription>Здесь отображаются все купленные вами туры.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="space-y-4">
            {tours.length > 0 ? (
              tours.map((tour) => (
                <Card key={tour.id} className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{tour.tours?.name || "Название не найдено"}</CardTitle>
                    <CardDescription>
                      Куплено: {new Date(tour.purchased_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{tour.tours?.description || "Описание отсутствует."}</p>
                    <p className="text-right font-semibold mt-2">
                      Цена: {tour.tours?.price?.toFixed(2) ?? 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">У вас еще нет купленных туров.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
