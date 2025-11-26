import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface PlaceViewStat {
  place_id: string;
  place_name: string;
  total_views: number;
}

interface ViewDetail {
  id: string;
  place_name: string;
  viewed_at: string;
}

export const BusinessPageViewStatistics = () => {
  const [placeStats, setPlaceStats] = useState<PlaceViewStat[]>([]);
  const [viewDetails, setViewDetails] = useState<ViewDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userPlaces } = await supabase
        .from("places")
        .select("id, name, is_premium")
        .eq("owner_id", user.id)
        .eq("is_premium", true);

      if (!userPlaces || userPlaces.length === 0) {
        setLoading(false);
        return;
      }

      const placeIds = userPlaces.map(p => p.id);

      const { data: views, error } = await supabase
        .from("page_views")
        .select("id, place_id, viewed_at")
        .in("place_id", placeIds)
        .order("viewed_at", { ascending: false });

      if (error) throw error;

      const statsMap = new Map<string, PlaceViewStat>();
      const details: ViewDetail[] = [];
      let total = 0;

      views?.forEach(view => {
        const place = userPlaces.find(p => p.id === view.place_id);
        const placeName = place?.name || "Unknown";

        if (!statsMap.has(view.place_id)) {
          statsMap.set(view.place_id, {
            place_id: view.place_id,
            place_name: placeName,
            total_views: 0,
          });
        }

        const stat = statsMap.get(view.place_id)!;
        stat.total_views++;
        total++;

        details.push({
          id: view.id,
          place_name: placeName,
          viewed_at: view.viewed_at,
        });
      });

      setPlaceStats(Array.from(statsMap.values()).sort((a, b) => b.total_views - a.total_views));
      setViewDetails(details);
      setTotalViews(total);
    } catch (error) {
      console.error("Error fetching page view statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (placeStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика посещений премиум-страниц</CardTitle>
          <CardDescription>
            У вас пока нет премиум-мест или по ним еще не было посещений
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего посещений</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalViews}</div>
          <p className="text-xs text-muted-foreground">
            Сколько раз открывали премиум-страницы ваших мест
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика по местам</CardTitle>
          <CardDescription>
            Сколько посещений у каждой вашей премиум-точки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {placeStats.map((stat, index) => (
              <div
                key={stat.place_id}
                className="flex items-center justify-between border rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      #{index + 1}
                    </span>
                  )}
                  <span className="font-medium">{stat.place_name}</span>
                </div>
                <div className="text-sm font-semibold">
                  {stat.total_views}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние посещения</CardTitle>
          <CardDescription>
            История открытий ваших премиум-страниц
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {viewDetails.slice(0, 20).map(detail => (
              <div
                key={detail.id}
                className="flex items-center justify-between text-sm border-b last:border-0 py-1"
              >
                <div className="flex-1 mr-2 truncate">{detail.place_name}</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(detail.viewed_at), "dd.MM.yyyy HH:mm")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
