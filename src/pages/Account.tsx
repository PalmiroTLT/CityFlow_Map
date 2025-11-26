import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coins, LogOut, MapPin, ShoppingCart, History, Check, Heart, BarChart3, Key } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlacesManager } from "@/components/account/UserPlacesManager";
import { UserWishlist } from "@/components/account/UserWishlist";
import { BusinessShareStatistics } from "@/components/account/BusinessShareStatistics";
import { BusinessPageViewStatistics } from "@/components/account/BusinessPageViewStatistics";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: "individual" | "business";
  credits: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Place {
  id: string;
  name: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  has_custom_page: boolean | null;
}

interface SubscriptionDetail {
  placeId: string;
  placeName: string;
  nextBillingDate: string;
  placeListingCost: number;
  premiumCost: number;
  billingPeriod: string;
  cancelAtPeriodEnd: boolean;
}

interface PurchasedTour {
  id: string;
  tour_id: string;
  purchased_at: string;
  tours: {
    name: string;
    name_en: string | null;
    description: string | null;
  };
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [purchasedTours, setPurchasedTours] = useState<PurchasedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetail[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    await fetchProfile(userId);
    await fetchTransactions(userId);
    await fetchPlaces(userId);
    await fetchPurchasedTours(userId);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast({
        title: t("error"),
        description: t("failedToLoadProfile"),
        variant: "destructive",
      });
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setTransactions(data);
  };

  const fetchPlaces = async (userId: string) => {
    const { data } = await supabase
      .from("places")
      .select("id, name, is_premium, premium_expires_at, created_at, has_custom_page")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setPlaces(data);
      
      // Calculate subscription details for each place
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans (
            price,
            billing_period
          ),
          places!inner (
            id,
            name,
            is_premium
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (subscriptions && subscriptions.length > 0) {
        const details: SubscriptionDetail[] = subscriptions.map((sub: any) => {
          const plan = sub.subscription_plans;
          const place = sub.places;
          
          // Don't show premium cost if it's cancelled
          const premiumCost = (place?.is_premium && !sub.cancel_at_period_end) ? 8 : 0;
          
          return {
            placeId: place.id,
            placeName: place.name,
            nextBillingDate: sub.next_billing_date,
            placeListingCost: plan.price,
            premiumCost: premiumCost,
            billingPeriod: plan.billing_period,
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          };
        });

        setSubscriptionDetails(details);
      }
    }
  };

  const fetchPurchasedTours = async (userId: string) => {
    const { data } = await supabase
      .from("purchased_tours")
      .select("id, tour_id, purchased_at, tours(name, name_en, description)")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (data) setPurchasedTours(data as PurchasedTour[]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleChangePassword = async () => {
    if (!profile?.email) {
      toast({
        title: language === "sr" ? "Грешка" : language === "ru" ? "Ошибка" : "Error",
        description: language === "sr" ? "Не могу добавити е-пошту" : language === "ru" ? "Не удалось получить email" : "Could not get email",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setChangingPassword(false);

    if (error) {
      toast({
        title: language === "sr" ? "Грешка" : language === "ru" ? "Ошибка" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: language === "sr" ? "Успех" : language === "ru" ? "Успех" : "Success",
        description: language === "sr" ? "Проверите е-пошту за промену лозинке" : language === "ru" ? "Проверьте email для смены пароля" : "Check your email to change password",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">{t("personalAccount")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">{profile.email}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1 sm:flex-none text-sm">
              <MapPin className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("map")}</span>
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="flex-1 sm:flex-none text-sm">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          </div>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("balance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">{profile.credits} {t("credits")}</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {t("topUpComingSoon")}
            </p>
          </CardContent>
        </Card>

        {subscriptionDetails.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t("upcomingBillings")}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t("subscriptionDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {subscriptionDetails.map((detail) => {
                  const total = detail.placeListingCost + detail.premiumCost;
                  return (
                    <div key={detail.placeId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{detail.placeName}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {t("billingPeriod")}: {
                            detail.billingPeriod === 'daily' ? t("billingPeriod_daily") :
                            detail.billingPeriod === 'weekly' ? t("billingPeriod_weekly") :
                            detail.billingPeriod === 'monthly' ? t("billingPeriod_monthly") :
                            t("billingPeriod_yearly")
                          }
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {t("nextBilling")}: {new Date(detail.nextBillingDate).toLocaleDateString(language === "sr" ? "sr-RS" : language === "ru" ? "ru-RU" : "en-US")}
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-bold">{total} {t("credits")}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{t("placeListing")}: {detail.placeListingCost}</div>
                          {detail.premiumCost > 0 && (
                            <div>{t("premiumStatus")}: {detail.premiumCost}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1 p-1">
            <TabsTrigger value="history" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <History className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("transactionHistory")}</span>
              <span className="sm:hidden">История</span>
            </TabsTrigger>
            <TabsTrigger value="tours" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "sr" ? "Моје туре" : language === "ru" ? "Мои туры" : "My Tours"}</span>
              <span className="sm:hidden">Туры</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "sr" ? "Желим посетити" : language === "ru" ? "Хочу посетить" : "Wishlist"}</span>
              <span className="sm:hidden">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
              <Key className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "sr" ? "Безбедност" : language === "ru" ? "Безопасность" : "Security"}</span>
              <span className="sm:hidden">{language === "sr" ? "Безб." : language === "ru" ? "Безоп." : "Sec."}</span>
            </TabsTrigger>
            {profile.user_type === "business" && (
              <>
                <TabsTrigger value="places" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("myPlaces")}</span>
                  <span className="sm:hidden">Места</span>
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden lg:inline">Статистика шерингов</span>
                  <span className="lg:hidden">Стат.</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">{t("transactionHistory")}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("recentTransactions")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-sm sm:text-base text-muted-foreground py-8">
                    {t("noTransactions")}
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">{t("date")}</TableHead>
                          <TableHead className="text-xs sm:text-sm">{t("description")}</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">{t("amount")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{transaction.description || transaction.type}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                              <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                              </span>
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

          <TabsContent value="tours">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "sr" ? "Моје туре" : language === "ru" ? "Мои туры" : "My Tours"}
                </CardTitle>
                <CardDescription>
                  {language === "sr" ? "Туре које сте купили" : language === "ru" ? "Туры которые вы купили" : "Tours you have purchased"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchasedTours.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {language === "sr" ? "Још увек нисте купили ниједну туру" : language === "ru" ? "Вы еще не купили ни один тур" : "You haven't purchased any tours yet"}
                    </p>
                    <Button onClick={() => navigate("/tours")}>
                      {language === "sr" ? "Прегледај туре" : language === "ru" ? "Просмотреть туры" : "Browse Tours"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedTours.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-5 h-5" />
                          <div>
                            <div className="font-medium">
                              {language === "en" && purchase.tours.name_en 
                                ? purchase.tours.name_en 
                                : purchase.tours.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(purchase.purchased_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {language === "sr" ? "Купљено" : language === "ru" ? "Куплено" : "Owned"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist">
            <UserWishlist />
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  {language === "sr" ? "Промена лозинке" : language === "ru" ? "Смена пароля" : "Change Password"}
                </CardTitle>
                <CardDescription>
                  {language === "sr" ? "За промену лозинке послаћемо вам имејл са упутствима" : language === "ru" ? "Для смены пароля мы отправим вам письмо с инструкциями" : "We will send you an email with instructions to change your password"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "sr" 
                      ? "Кликните на дугме испод да примите имејл са упутствима за безбедну промену лозинке." 
                      : language === "ru" 
                      ? "Нажмите кнопку ниже, чтобы получить письмо с инструкциями для безопасной смены пароля." 
                      : "Click the button below to receive an email with instructions for secure password change."}
                  </p>
                  <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full sm:w-auto">
                    {changingPassword 
                      ? (language === "sr" ? "Шаљем..." : language === "ru" ? "Отправка..." : "Sending...") 
                      : (language === "sr" ? "Пошаљи имејл" : language === "ru" ? "Отправить письмо" : "Send Email")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {profile.user_type === "business" && (
            <>
              <TabsContent value="places">
                <UserPlacesManager
                  places={places}
                  credits={profile.credits}
                  subscriptions={subscriptionDetails.map(d => ({
                    placeId: d.placeId,
                    cancelAtPeriodEnd: d.cancelAtPeriodEnd
                  }))}
                  onRefresh={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      await fetchData(session.user.id);
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="statistics">
                <Tabs defaultValue="views" className="space-y-4">
                  <TabsList className="w-full flex-wrap h-auto justify-start gap-1 p-1">
                    <TabsTrigger value="views" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden lg:inline">Посещения</span>
                      <span className="lg:hidden">View</span>
                    </TabsTrigger>
                    <TabsTrigger value="shares" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden lg:inline">Шеринги</span>
                      <span className="lg:hidden">Share</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="views">
                    <BusinessPageViewStatistics />
                  </TabsContent>
                  <TabsContent value="shares">
                    <BusinessShareStatistics />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Account;