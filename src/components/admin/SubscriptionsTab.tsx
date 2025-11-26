import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName } from "@/lib/i18n/languageUtils";

interface SubscriptionPlan {
  id: string;
  name: string;
  name_en: string | null;
  name_ru: string | null;
  name_sr: string | null;
  type: "place_listing" | "premium_status";
  price: number;
  billing_period: "daily" | "weekly" | "monthly" | "yearly";
  is_active: boolean;
}

export function SubscriptionsTab() {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    name_ru: "",
    name_sr: "",
    type: "place_listing" as "place_listing" | "premium_status",
    price: "",
    billing_period: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error(t("fillAllFields"));
      return;
    }

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .insert({
          name: formData.name,
          name_en: formData.name_en || null,
          name_ru: formData.name_ru || null,
          name_sr: formData.name_sr || null,
          type: formData.type,
          price: parseInt(formData.price),
          billing_period: formData.billing_period,
        });

      if (error) throw error;

      toast.success(t("subscriptionPlanCreated"));
      setFormData({
        name: "",
        name_en: "",
        name_ru: "",
        name_sr: "",
        type: "place_listing",
        price: "",
        billing_period: "monthly",
      });
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !currentStatus })
        .eq("id", planId);

      if (error) throw error;

      toast.success(t("subscriptionPlanUpdated"));
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast.success(t("subscriptionPlanDeleted"));
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getBillingPeriodLabel = (period: string) => {
    const labels = {
      daily: t("daily"),
      weekly: t("weekly"),
      monthly: t("monthly"),
      yearly: t("yearly"),
    };
    return labels[period as keyof typeof labels] || period;
  };

  const getTypeLabel = (type: string) => {
    return type === "place_listing" ? t("placeListing") : t("premiumStatus");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("createSubscriptionPlan")}</CardTitle>
          <CardDescription>{t("createSubscriptionPlanDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} (SR)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("enterName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{t("name")} (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder={t("enterName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ru">{t("name")} (RU)</Label>
                <Input
                  id="name_ru"
                  value={formData.name_ru}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                  placeholder={t("enterName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_sr">{t("name")} (SR Cyrillic)</Label>
                <Input
                  id="name_sr"
                  value={formData.name_sr}
                  onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
                  placeholder={t("enterName")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t("subscriptionType")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "place_listing" | "premium_status") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="place_listing">{t("placeListing")}</SelectItem>
                    <SelectItem value="premium_status">{t("premiumStatus")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t("priceInCredits")}</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_period">{t("billingPeriod")}</Label>
                <Select
                  value={formData.billing_period}
                  onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") =>
                    setFormData({ ...formData, billing_period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("daily")}</SelectItem>
                    <SelectItem value="weekly">{t("weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("monthly")}</SelectItem>
                    <SelectItem value="yearly">{t("yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {t("createPlan")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionPlans")}</CardTitle>
          <CardDescription>{t("manageSubscriptionPlans")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{getLocalizedName(plan, language)}</TableCell>
                  <TableCell>{getTypeLabel(plan.type)}</TableCell>
                  <TableCell>{plan.price} {t("credits")}</TableCell>
                  <TableCell>{getBillingPeriodLabel(plan.billing_period)}</TableCell>
                  <TableCell>
                    <Button
                      variant={plan.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? t("active") : t("inactive")}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
