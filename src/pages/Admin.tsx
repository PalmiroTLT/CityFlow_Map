import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { PlacesTab } from "@/components/admin/PlacesTab";
import { ToursTab } from "@/components/admin/ToursTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { CountriesTab } from "@/components/admin/CountriesTab";
import { CitiesTab } from "@/components/admin/CitiesTab";
import { CreditsTab } from "@/components/admin/CreditsTab";
import { SubscriptionsTab } from "@/components/admin/SubscriptionsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { StatisticsTab } from "@/components/admin/StatisticsTab";
import { DonationTab } from "@/components/admin/DonationTab";
import EmailTemplatesTab from "@/components/admin/EmailTemplatesTab";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import { useLanguage } from "@/lib/i18n/LanguageContext";

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error(t("noAdminRights"));
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("backToMap")}</span>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">{t("adminPanel")}</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate w-full sm:w-auto">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="categories" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1 p-1">
            <TabsTrigger value="countries" className="flex-shrink-0 text-xs px-2 py-1.5">{t("countries")}</TabsTrigger>
            <TabsTrigger value="cities" className="flex-shrink-0 text-xs px-2 py-1.5">{t("cities")}</TabsTrigger>
            <TabsTrigger value="categories" className="flex-shrink-0 text-xs px-2 py-1.5">{t("categories")}</TabsTrigger>
            <TabsTrigger value="places" className="flex-shrink-0 text-xs px-2 py-1.5">{t("places")}</TabsTrigger>
            <TabsTrigger value="tours" className="flex-shrink-0 text-xs px-2 py-1.5">{t("tours")}</TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 text-xs px-2 py-1.5">Польз.</TabsTrigger>
            <TabsTrigger value="credits" className="flex-shrink-0 text-xs px-2 py-1.5">{t("credits")}</TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex-shrink-0 text-xs px-2 py-1.5">Подп.</TabsTrigger>
            <TabsTrigger value="statistics" className="flex-shrink-0 text-xs px-2 py-1.5">Стат.</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-shrink-0 text-xs px-2 py-1.5">Увед.</TabsTrigger>
            <TabsTrigger value="email-templates" className="flex-shrink-0 text-xs px-2 py-1.5">Email</TabsTrigger>
            <TabsTrigger value="donation" className="flex-shrink-0 text-xs px-2 py-1.5">Донат</TabsTrigger>
          </TabsList>

          <TabsContent value="countries" className="space-y-4">
            <CountriesTab />
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <CitiesTab />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="places" className="space-y-4">
            <PlacesTab />
          </TabsContent>

          <TabsContent value="tours" className="space-y-4">
            <ToursTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UsersTab />
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            <CreditsTab />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <StatisticsTab />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="email-templates" className="space-y-4">
            <EmailTemplatesTab />
          </TabsContent>

          <TabsContent value="donation" className="space-y-4">
            <DonationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
