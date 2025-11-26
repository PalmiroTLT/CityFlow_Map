import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Calendar, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, startOfDay, subDays } from "date-fns";

interface PlacePageStatisticsProps {
  placeId: string;
}

export const PlacePageStatistics = ({ placeId }: PlacePageStatisticsProps) => {
  const { t } = useLanguage();
  const [totalViews, setTotalViews] = useState(0);
  const [viewsToday, setViewsToday] = useState(0);
  const [viewsWeek, setViewsWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [placeId]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const today = startOfDay(new Date());
      const weekAgo = subDays(today, 7);

      // Total views
      const { count: total } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("place_id", placeId);

      // Views today
      const { count: todayCount } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("place_id", placeId)
        .gte("viewed_at", today.toISOString());

      // Views this week
      const { count: weekCount } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("place_id", placeId)
        .gte("viewed_at", weekAgo.toISOString());

      setTotalViews(total || 0);
      setViewsToday(todayCount || 0);
      setViewsWeek(weekCount || 0);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t("pageStatistics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {t("pageStatistics")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{t("totalViews")}</span>
            </div>
            <p className="text-2xl font-bold">{totalViews}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{t("viewsToday")}</span>
            </div>
            <p className="text-2xl font-bold">{viewsToday}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{t("viewsThisWeek")}</span>
            </div>
            <p className="text-2xl font-bold">{viewsWeek}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};