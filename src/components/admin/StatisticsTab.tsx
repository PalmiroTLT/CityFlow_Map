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
import { Share2, TrendingUp, Users, History, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlaceShareStats {
  place_id: string;
  place_name: string;
  place_owner_name: string | null;
  total_shares: number;
  whatsapp: number;
  telegram: number;
  facebook: number;
  link: number;
  native: number;
}

interface UserShareStats {
  user_id: string;
  user_name: string;
  user_email: string;
  total_shares: number;
}

interface ShareDetail {
  id: string;
  place_name: string;
  user_name: string | null;
  user_email: string | null;
  platform: string;
  shared_at: string;
}

interface BusinessOwnerStats {
  owner_id: string;
  owner_name: string;
  owner_email: string;
  total_shares: number;
  places: Array<{
    place_id: string;
    place_name: string;
    shares: number;
  }>;
}

export const StatisticsTab = () => {
  const { t } = useLanguage();
  const [placeStats, setPlaceStats] = useState<PlaceShareStats[]>([]);
  const [userStats, setUserStats] = useState<UserShareStats[]>([]);
  const [shareDetails, setShareDetails] = useState<ShareDetail[]>([]);
  const [businessOwnerStats, setBusinessOwnerStats] = useState<BusinessOwnerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Получаем все шеринги с данными о местах
      const { data: shareData, error } = await supabase
        .from("share_statistics")
        .select(`
          id,
          place_id,
          platform,
          user_id,
          shared_at,
          places(name, owner_id)
        `)
        .order("shared_at", { ascending: false });

      if (error) {
        console.error("Error fetching share statistics:", error);
        throw error;
      }

      console.log("Share data received:", shareData);

      // Подготовка карт профилей пользователей и владельцев бизнеса
      const userIds = Array.from(
        new Set(
          (shareData || [])
            .map((item: any) => item.user_id)
            .filter((id: string | null) => Boolean(id))
        )
      ) as string[];

      const ownerIds = Array.from(
        new Set(
          (shareData || [])
            .map((item: any) => item.places?.owner_id)
            .filter((id: string | null) => Boolean(id))
        )
      ) as string[];

      const userProfilesMap = new Map<string, { full_name: string | null; email: string }>();
      const ownerProfilesMap = new Map<string, { full_name: string | null; email: string }>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching user profiles for statistics:", profilesError);
        } else {
          (profilesData || []).forEach((profile: any) => {
            userProfilesMap.set(profile.id, {
              full_name: profile.full_name,
              email: profile.email,
            });
          });
        }
      }

      if (ownerIds.length > 0) {
        const { data: ownersData, error: ownersError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds);

        if (ownersError) {
          console.error("Error fetching owner profiles for statistics:", ownersError);
        } else {
          (ownersData || []).forEach((owner: any) => {
            ownerProfilesMap.set(owner.id, {
              full_name: owner.full_name,
              email: owner.email,
            });
          });
        }
      }

      // Обработка данных для статистики
      const placeStatsMap = new Map<string, PlaceShareStats>();
      const userStatsMap = new Map<string, UserShareStats>();
      const businessOwnerStatsMap = new Map<string, BusinessOwnerStats>();
      const details: ShareDetail[] = [];
      let total = 0;

      for (const item of shareData || []) {
        const placeId = item.place_id;
        const placeName = item.places?.name || "Unknown";
        const platform = item.platform;
        const userId = item.user_id as string | null;

        // Владелец места
        let ownerName: string | null = null;
        let ownerEmail: string | null = null;
        if (item.places?.owner_id) {
          const ownerProfile = ownerProfilesMap.get(item.places.owner_id);
          ownerName = ownerProfile?.full_name || ownerProfile?.email || null;
          ownerEmail = ownerProfile?.email || null;
        }

        // Статистика по местам
        if (!placeStatsMap.has(placeId)) {
          placeStatsMap.set(placeId, {
            place_id: placeId,
            place_name: placeName,
            place_owner_name: ownerName,
            total_shares: 0,
            whatsapp: 0,
            telegram: 0,
            facebook: 0,
            link: 0,
            native: 0,
          });
        }

        const placeStatsItem = placeStatsMap.get(placeId)!;
        placeStatsItem.place_owner_name = ownerName;
        placeStatsItem.total_shares++;
        total++;

        if (platform === "whatsapp") placeStatsItem.whatsapp++;
        else if (platform === "telegram") placeStatsItem.telegram++;
        else if (platform === "facebook") placeStatsItem.facebook++;
        else if (platform === "link") placeStatsItem.link++;
        else if (platform === "native") placeStatsItem.native++;

        // Статистика по пользователям
        if (userId) {
          if (!userStatsMap.has(userId)) {
            const profile = userProfilesMap.get(userId);
            userStatsMap.set(userId, {
              user_id: userId,
              user_name: profile?.full_name || profile?.email || "Unknown",
              user_email: profile?.email || "",
              total_shares: 0,
            });
          }
          userStatsMap.get(userId)!.total_shares++;
        }

        // Статистика по владельцам бизнеса
        if (item.places?.owner_id) {
          const ownerId = item.places.owner_id as string;
          if (!businessOwnerStatsMap.has(ownerId)) {
            const ownerProfile = ownerProfilesMap.get(ownerId);
            businessOwnerStatsMap.set(ownerId, {
              owner_id: ownerId,
              owner_name: ownerProfile?.full_name || ownerProfile?.email || "Unknown",
              owner_email: ownerProfile?.email || ownerEmail || "",
              total_shares: 0,
              places: [],
            });
          }

          const ownerStats = businessOwnerStatsMap.get(ownerId)!;
          ownerStats.total_shares++;

          const existingPlace = ownerStats.places.find((p) => p.place_id === placeId);
          if (existingPlace) {
            existingPlace.shares++;
          } else {
            ownerStats.places.push({
              place_id: placeId,
              place_name: placeName,
              shares: 1,
            });
          }
        }

        // Детальная история шерингов
        const profile = userId ? userProfilesMap.get(userId) : undefined;
        details.push({
          id: item.id,
          place_name: placeName,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          platform: platform,
          shared_at: item.shared_at,
        });
      }

      setPlaceStats(
        Array.from(placeStatsMap.values()).sort((a, b) => b.total_shares - a.total_shares)
      );
      setUserStats(
        Array.from(userStatsMap.values()).sort((a, b) => b.total_shares - a.total_shares)
      );
      setBusinessOwnerStats(
        Array.from(businessOwnerStatsMap.values())
          .sort((a, b) => b.total_shares - a.total_shares)
          .map((owner) => ({
            ...owner,
            places: owner.places.sort((a, b) => b.shares - a.shares),
          }))
      );
      setShareDetails(details);
      setTotalShares(total);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
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
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Всего поделились</CardTitle>
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Общее количество шерингов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Популярных мест</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{placeStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Мест с шерингами
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Активных пользователей</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{userStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Пользователей делились
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="places" className="space-y-4">
        <TabsList className="w-full flex-wrap h-auto justify-start gap-1 p-1">
          <TabsTrigger value="places" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">По местам</TabsTrigger>
          <TabsTrigger value="users" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">По польз.</TabsTrigger>
          <TabsTrigger value="business" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">По бизнесу</TabsTrigger>
          <TabsTrigger value="details" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">Детали</TabsTrigger>
        </TabsList>

        <TabsContent value="places" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Статистика шерингов по местам</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Самые популярные места по количеству поделившихся
              </CardDescription>
            </CardHeader>
            <CardContent>
              {placeStats.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Нет данных о шерингах
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Место</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Владелец</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Всего</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">WA</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">TG</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden xl:table-cell">FB</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden xl:table-cell">Mob</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden xl:table-cell">Ссыл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placeStats.map((stat, index) => (
                        <TableRow key={stat.place_id}>
                          <TableCell className="text-xs sm:text-sm font-medium">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {index < 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              )}
                              <span className="truncate max-w-[120px] sm:max-w-none">{stat.place_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                            <span className="truncate block max-w-[150px]">{stat.place_owner_name || "—"}</span>
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm font-bold whitespace-nowrap">
                            {stat.total_shares}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell">{stat.whatsapp}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell">{stat.telegram}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden xl:table-cell">{stat.facebook}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden xl:table-cell">{stat.native}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden xl:table-cell">{stat.link}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по пользователям</CardTitle>
              <CardDescription>
                Самые активные пользователи по количеству шерингов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о пользователях
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Всего шерингов</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((stat, index) => (
                        <TableRow key={stat.user_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              )}
                              {stat.user_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stat.user_email}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {stat.total_shares}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Статистика по владельцам бизнеса
              </CardTitle>
              <CardDescription>
                Статистика шерингов мест по владельцам бизнеса
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessOwnerStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о владельцах бизнеса
                </div>
              ) : (
                <div className="space-y-6">
                  {businessOwnerStats.map((owner, index) => (
                    <Card key={owner.owner_id} className="border-l-4 border-l-primary/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Badge variant="secondary" className="text-xs">
                                #{index + 1}
                              </Badge>
                            )}
                            <div>
                              <CardTitle className="text-lg">{owner.owner_name}</CardTitle>
                              <CardDescription className="text-sm">{owner.owner_email}</CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{owner.total_shares}</div>
                            <p className="text-xs text-muted-foreground">всего шерингов</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Места ({owner.places.length}):
                          </p>
                          <div className="grid gap-2">
                            {owner.places.map((place) => (
                              <div 
                                key={place.place_id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <span className="font-medium">{place.place_name}</span>
                                <Badge variant="secondary">
                                  {place.shares} {place.shares === 1 ? 'шеринг' : 'шерингов'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Детальная история шерингов
              </CardTitle>
              <CardDescription>
                Полная история всех шерингов с деталями
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shareDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о шерингах
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата и время</TableHead>
                        <TableHead>Место</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Платформа</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareDetails.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell className="text-sm">
                            {format(new Date(detail.shared_at), "dd.MM.yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {detail.place_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {detail.user_name || detail.user_email || (
                              <span className="text-muted-foreground italic">Гость</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPlatformBadge(detail.platform)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
