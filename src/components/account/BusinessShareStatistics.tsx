import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface PlaceShareStats {
  place_id: string;
  place_name: string;
  total_shares: number;
  whatsapp: number;
  telegram: number;
  facebook: number;
  link: number;
  native: number;
}

interface ShareDetail {
  id: string;
  place_name: string;
  platform: string;
  shared_at: string;
}

export const BusinessShareStatistics = () => {
  const [placeStats, setPlaceStats] = useState<PlaceShareStats[]>([]);
  const [shareDetails, setShareDetails] = useState<ShareDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's places
      const { data: userPlaces } = await supabase
        .from("places")
        .select("id, name")
        .eq("owner_id", user.id);

      if (!userPlaces || userPlaces.length === 0) {
        setLoading(false);
        return;
      }

      const placeIds = userPlaces.map(p => p.id);

      // Get share statistics for user's places
      const { data: shareData, error } = await supabase
        .from("share_statistics")
        .select("*")
        .in("place_id", placeIds)
        .order("shared_at", { ascending: false });

      if (error) throw error;

      // Process data for place statistics
      const placeStatsMap = new Map<string, PlaceShareStats>();
      const details: ShareDetail[] = [];
      let total = 0;

      shareData?.forEach((item) => {
        const placeId = item.place_id;
        const place = userPlaces.find(p => p.id === placeId);
        const placeName = place?.name || "Unknown";
        const platform = item.platform;

        if (!placeStatsMap.has(placeId)) {
          placeStatsMap.set(placeId, {
            place_id: placeId,
            place_name: placeName,
            total_shares: 0,
            whatsapp: 0,
            telegram: 0,
            facebook: 0,
            link: 0,
            native: 0,
          });
        }

        const placeStatsItem = placeStatsMap.get(placeId)!;
        placeStatsItem.total_shares++;
        total++;

        if (platform === "whatsapp") placeStatsItem.whatsapp++;
        else if (platform === "telegram") placeStatsItem.telegram++;
        else if (platform === "facebook") placeStatsItem.facebook++;
        else if (platform === "link") placeStatsItem.link++;
        else if (platform === "native") placeStatsItem.native++;

        // Share details
        details.push({
          id: item.id,
          place_name: placeName,
          platform: platform,
          shared_at: item.shared_at,
        });
      });

      setPlaceStats(
        Array.from(placeStatsMap.values()).sort((a, b) => b.total_shares - a.total_shares)
      );
      setShareDetails(details);
      setTotalShares(total);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      telegram: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      facebook: "bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-600/20",
      link: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
      native: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    };
    return (
      <Badge variant="outline" className={colors[platform] || ""}>
        {platform === "native" ? "Mobile" : platform}
      </Badge>
    );
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
          <CardTitle>Статистика шерингов ваших мест</CardTitle>
          <CardDescription>
            У вас пока нет мест или ими еще никто не поделился
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего шерингов</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Вашими местами поделились
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Популярных мест</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placeStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Ваших мест с шерингами
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика по вашим местам</CardTitle>
          <CardDescription>
            Сколько раз поделились каждым из ваших мест
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Место</TableHead>
                  <TableHead className="text-right">Всего</TableHead>
                  <TableHead className="text-right">WhatsApp</TableHead>
                  <TableHead className="text-right">Telegram</TableHead>
                  <TableHead className="text-right">Facebook</TableHead>
                  <TableHead className="text-right">Mobile</TableHead>
                  <TableHead className="text-right">Ссылка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeStats.map((stat, index) => (
                  <TableRow key={stat.place_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        )}
                        {stat.place_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {stat.total_shares}
                    </TableCell>
                    <TableCell className="text-right">{stat.whatsapp}</TableCell>
                    <TableCell className="text-right">{stat.telegram}</TableCell>
                    <TableCell className="text-right">{stat.facebook}</TableCell>
                    <TableCell className="text-right">{stat.native}</TableCell>
                    <TableCell className="text-right">{stat.link}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние шеринги</CardTitle>
          <CardDescription>
            История шерингов ваших мест
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Место</TableHead>
                  <TableHead>Платформа</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareDetails.slice(0, 20).map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell className="text-sm">
                      {format(new Date(detail.shared_at), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {detail.place_name}
                    </TableCell>
                    <TableCell>
                      {getPlatformBadge(detail.platform)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
