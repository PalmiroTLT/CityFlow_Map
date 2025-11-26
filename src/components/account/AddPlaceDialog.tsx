import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName } from "@/lib/i18n/languageUtils";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";
import { MapPlacePicker } from "@/components/map/MapPlacePicker";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];
type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"];

interface AddPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddPlaceDialog = ({ open, onOpenChange, onSuccess }: AddPlaceDialogProps) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [cityChanged, setCityChanged] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [translating, setTranslating] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    city_id: "",
    name: "",
    name_en: "",
    name_sr: "",
    description: "",
    description_en: "",
    description_sr: "",
    latitude: "",
    longitude: "",
    address: "",
    phone: "",
    website: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchCities();
      fetchSubscriptionPlans();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    setCategories(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*");
    setCities(data || []);
  };

  const fetchSubscriptionPlans = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("type", "place_listing")
      .eq("is_active", true)
      .order("price");
    setSubscriptionPlans(data || []);
  };

  const getPlanLabel = (plan: SubscriptionPlan) => {
    const periodLabels = {
      daily: t("daily"),
      weekly: t("weekly"),
      monthly: t("monthly"),
      yearly: t("yearly"),
    };
    return `${getLocalizedName(plan, language)} - ${plan.price} ${t("credits")} / ${periodLabels[plan.billing_period as keyof typeof periodLabels]}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (!formData.category_id) {
        throw new Error("Пожалуйста, выберите категорию");
      }

      if (!selectedPlan) {
        throw new Error(t("selectSubscriptionPlan"));
      }

      // Validate phone format
      if (formData.phone && !formData.phone.match(/^\+?[\d\s\-\(\)]+$/)) {
        throw new Error(t("invalidPhoneFormat"));
      }

      // Validate URL format
      if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
        throw new Error(t("invalidWebsiteUrl"));
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-place-with-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          category_id: formData.category_id || null,
          city_id: formData.city_id || null,
          plan_id: selectedPlan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add place");
      }

      toast({
        title: t("success"),
        description: t("placeAddedWithSubscription"),
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToAddPlace"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressBlur = async () => {
    if (!formData.address.trim() || formData.latitude || formData.longitude || geocoding) return;
    
    setGeocoding(true);
    const result = await geocodeAddress(formData.address);
    setGeocoding(false);
    
    if (result) {
      await determineCityFromCoordinates(result.latitude, result.longitude);
      setFormData(prev => ({
        ...prev,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
      }));
      toast({
        title: t("success"),
        description: t("coordinatesAutoFilled"),
      });
    }
  };

  const determineCityFromCoordinates = async (lat: number, lng: number) => {
    try {
      // Find the closest city to these coordinates
      const closestCity = cities.reduce((closest, city) => {
        const distance = Math.sqrt(
          Math.pow(city.latitude - lat, 2) + Math.pow(city.longitude - lng, 2)
        );
        if (!closest || distance < closest.distance) {
          return { city, distance };
        }
        return closest;
      }, null as { city: City; distance: number } | null);

      if (closestCity && closestCity.distance < 0.5) {
        setFormData(prev => ({ ...prev, city_id: closestCity.city.id }));
        toast({
          title: t("success"),
          description: `${t("cityAutoDetected")}: ${getLocalizedName(closestCity.city, language)}`,
        });
      }
    } catch (error) {
      console.error("Error determining city:", error);
    }
  };

  const handleCoordinatesChange = async (field: "latitude" | "longitude", value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (newFormData.latitude && newFormData.longitude) {
      const lat = parseFloat(newFormData.latitude);
      const lng = parseFloat(newFormData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        await determineCityFromCoordinates(lat, lng);
      }
    }
  };

  const translateText = async (text: string, targetLanguage: "sr" | "ru" | "en") => {
    if (!text.trim()) return "";

    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text, targetLanguage },
      });

      if (error) throw error;
      return (data as any)?.translatedText || "";
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: t("error"),
        description: "Ошибка перевода",
        variant: "destructive",
      });
      return "";
    }
  };

  const handleTranslate = async (sourceField: "name" | "name_sr" | "name_en" | "description" | "description_sr" | "description_en", value: string) => {
    if (!value.trim() || translating) return;

    setTranslating(true);

    const isNameField = sourceField.startsWith("name");
    const base = isNameField ? "name" : "description";

    let sourceLang: "sr" | "ru" | "en";
    if (sourceField === base) sourceLang = "ru";
    else if (sourceField === `${base}_sr`) sourceLang = "sr";
    else sourceLang = "en";

    const targetLangs: ("sr" | "ru" | "en")[] = ["sr", "ru", "en"].filter(l => l !== sourceLang) as any;

    const fieldForLang = (lang: "sr" | "ru" | "en") => {
      if (lang === "ru") return base;
      if (lang === "sr") return `${base}_sr`;
      return `${base}_en`;
    };

    for (const lang of targetLangs) {
      const field = fieldForLang(lang);
      const current = (formData as any)[field] as string;
      if (!current || !current.trim()) {
        const translated = await translateText(value, lang);
        if (translated) {
          setFormData(prev => ({ ...prev, [field]: translated }));
        }
      }
    }

    setTranslating(false);
  };

  const handleMapSelect = async (data: { latitude: number; longitude: number; address: string }) => {
    await determineCityFromCoordinates(data.latitude, data.longitude);
    setFormData({
      ...formData,
      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),
      address: data.address,
    });
    setCityChanged(false); // Reset city changed flag after selecting location
    toast({
      title: t("success"),
      description: t("locationSelectedFromMap"),
    });
  };

  const getCityCenter = (): [number, number] | undefined => {
    const selectedCity = cities.find(c => c.id === formData.city_id);
    if (selectedCity) {
      return [selectedCity.latitude, selectedCity.longitude];
    }
    return undefined;
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      city_id: "",
      name: "",
      name_en: "",
      name_sr: "",
      description: "",
      description_en: "",
      description_sr: "",
      latitude: "",
      longitude: "",
      address: "",
      phone: "",
      website: "",
    });
    setSelectedPlan("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addNewPlace")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (RU) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onBlur={(e) => handleTranslate("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_sr">Name (SR)</Label>
              <Input
                id="name_sr"
                value={formData.name_sr}
                onChange={(e) => setFormData(prev => ({ ...prev, name_sr: e.target.value }))}
                onBlur={(e) => handleTranslate("name_sr", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">Name (EN)</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                onBlur={(e) => handleTranslate("name_en", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getLocalizedName(cat, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("city")}</Label>
              <Select
                value={formData.city_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, city_id: value }));
                  setCityChanged(true); // Mark that city was changed by user
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {getLocalizedName(city, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (RU)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                onBlur={(e) => handleTranslate("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_sr">Description (SR)</Label>
              <Textarea
                id="description_sr"
                value={formData.description_sr}
                onChange={(e) => setFormData(prev => ({ ...prev, description_sr: e.target.value }))}
                onBlur={(e) => handleTranslate("description_sr", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">Description (EN)</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                onBlur={(e) => handleTranslate("description_en", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              onBlur={handleAddressBlur}
              placeholder={t("enterAddressForAutoCoordinates")}
            />
            {geocoding && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("searchingCoordinates")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+381 11 234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t("website")}</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleCoordinatesChange("latitude", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleCoordinatesChange("longitude", e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setMapPickerOpen(true)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t("selectOnMap")}
          </Button>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="subscription_plan" className="text-base font-semibold">
              {t("subscriptionPlan")} *
            </Label>
            <Select
              value={selectedPlan}
              onValueChange={setSelectedPlan}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectSubscriptionPlan")} />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {getPlanLabel(plan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">
                {t("subscriptionInfo")}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || subscriptionPlans.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {subscriptionPlans.length === 0 ? t("noPlansAvailable") : t("addNewPlace")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <MapPlacePicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        onSelect={handleMapSelect}
        initialPosition={
          !cityChanged && formData.latitude && formData.longitude
            ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
            : undefined
        }
        cityCenter={getCityCenter()}
      />
    </Dialog>
  );
};