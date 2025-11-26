import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserCircle, CreditCard, ShoppingBag, History, MapPin, Crown } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Subscription = Database["public"]["Tables"]["user_subscriptions"]["Row"] & {
  subscription_plans?: { name: string; name_sr: string | null; price: number; billing_period: string };
  places?: { name: string; is_premium: boolean } | null;
};
type Transaction = Database["public"]["Tables"]["credit_transactions"]["Row"];
type PurchasedTour = Database["public"]["Tables"]["purchased_tours"]["Row"] & {
  tours?: { name: string; name_sr: string | null; price: number | null };
};
type Place = Database["public"]["Tables"]["places"]["Row"] & {
  cities?: { name_sr: string };
  categories?: { name: string };
};

interface UserDetails {
  profile: Profile;
  subscriptions: Subscription[];
  transactions: Transaction[];
  purchasedTours: PurchasedTour[];
  places: Place[];
}

export const UsersTab = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const fetchUserDetails = async (userId: string) => {
    setLoading(true);
    
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Fetch subscriptions with plan details and place info
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans(name, name_sr, price, billing_period),
        places(name, is_premium)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Fetch transactions
    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Fetch purchased tours
    const { data: purchasedTours } = await supabase
      .from("purchased_tours")
      .select(`
        *,
        tours(name, name_sr, price)
      `)
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    // Fetch user's places
    const { data: places } = await supabase
      .from("places")
      .select(`
        *,
        cities(name_sr),
        categories(name)
      `)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (profile) {
      setSelectedUser({
        profile,
        subscriptions: subscriptions || [],
        transactions: transactions || [],
        purchasedTours: purchasedTours || [],
        places: places || [],
      });
      setDialogOpen(true);
    }
    
    setLoading(false);
  };

  const getUserTypeBadge = (userType: string | null) => {
    if (userType === "business") {
      return <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">Бизнес</Badge>;
    }
    return <Badge variant="outline">Индивидуальный</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Все пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <UserCircle className="w-10 h-10 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          {getUserTypeBadge(user.user_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Кредиты: <span className="font-medium text-foreground">{user.credits}</span>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Создан: {format(new Date(user.created_at), "dd.MM.yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => fetchUserDetails(user.id)}
                      disabled={loading}
                    >
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    Профиль
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Имя</p>
                      <p className="font-medium">{selectedUser.profile.full_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Тип пользователя</p>
                      {getUserTypeBadge(selectedUser.profile.user_type)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Кредиты</p>
                      <p className="font-medium text-lg">{selectedUser.profile.credits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Язык</p>
                      <p className="font-medium">{selectedUser.profile.language?.toUpperCase() || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Дата регистрации</p>
                      <p className="font-medium">{format(new Date(selectedUser.profile.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Подписки ({selectedUser.subscriptions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.subscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет подписок</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.subscriptions.map((sub) => (
                        <div key={sub.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {sub.subscription_plans?.name_sr || sub.subscription_plans?.name || "План"}
                              </p>
                              {sub.places && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {sub.places.name}
                                  {sub.places.is_premium && <Crown className="w-3 h-3 text-premium ml-1" />}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={sub.is_active ? "default" : "secondary"}>
                                {sub.is_active ? "Активна" : "Неактивна"}
                              </Badge>
                              {sub.cancel_at_period_end && (
                                <Badge variant="outline" className="text-orange-600">
                                  Отменена
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Стоимость: </span>
                              <span className="font-medium">{sub.subscription_plans?.price} кредитов / {sub.subscription_plans?.billing_period}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Начало: </span>
                              <span>{format(new Date(sub.started_at), "dd.MM.yyyy")}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">След. списание: </span>
                              <span>{format(new Date(sub.next_billing_date), "dd.MM.yyyy")}</span>
                            </div>
                            {sub.cancelled_at && (
                              <div>
                                <span className="text-muted-foreground">Отменена: </span>
                                <span>{format(new Date(sub.cancelled_at), "dd.MM.yyyy")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    История операций ({selectedUser.transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет транзакций</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{tx.description || tx.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), "dd.MM.yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount} кредитов
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchased Tours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Купленные туры ({selectedUser.purchasedTours.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.purchasedTours.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет купленных туров</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.purchasedTours.map((pt) => (
                        <div key={pt.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {pt.tours?.name_sr || pt.tours?.name || "Тур"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Куплен: {format(new Date(pt.purchased_at), "dd.MM.yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {pt.tours?.price || 0} кредитов
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User's Places */}
              {selectedUser.places.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Места пользователя ({selectedUser.places.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedUser.places.map((place) => (
                        <div key={place.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{place.name}</p>
                                {place.is_premium && <Crown className="w-4 h-4 text-premium" />}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {place.cities && (
                                  <span>{place.cities.name_sr}</span>
                                )}
                                {place.categories && (
                                  <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span>{place.categories.name}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Создано: {format(new Date(place.created_at), "dd.MM.yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
