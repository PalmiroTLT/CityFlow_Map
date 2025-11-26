import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName } from "@/lib/i18n/languageUtils";

type Country = {
  id: string;
  name_sr: string;
  name_en: string;
  name_ru: string;
};

type City = {
  id: string;
  country_id: string;
  name_sr: string;
  name_en: string;
  name_ru: string;
  latitude: number;
  longitude: number;
  zoom_level: number;
};

export const CitiesTab = () => {
  const { t, language } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    country_id: "",
    name_sr: "",
    name_en: "",
    name_ru: "",
    latitude: "",
    longitude: "",
    zoom_level: "13",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetchCountries();
    fetchCities();
  }, []);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("countries")
      .select("*")
      .order("name_sr");
    if (data) setCountries(data);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .order("name_sr");
    if (data) setCities(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cityData = {
      country_id: formData.country_id,
      name_sr: formData.name_sr,
      name_en: formData.name_en,
      name_ru: formData.name_ru,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      zoom_level: parseInt(formData.zoom_level),
    };

    if (editingId) {
      const { error } = await supabase
        .from("cities")
        .update(cityData)
        .eq("id", editingId);

      if (error) {
        toast.error("Error updating city");
        return;
      }
      toast.success(t("cityUpdated"));
    } else {
      const { error } = await supabase.from("cities").insert([cityData]);

      if (error) {
        toast.error("Error creating city");
        return;
      }
      toast.success(t("cityCreated"));
    }

    resetForm();
    fetchCities();
  };

  const resetForm = () => {
    setFormData({
      country_id: "",
      name_sr: "",
      name_en: "",
      name_ru: "",
      latitude: "",
      longitude: "",
      zoom_level: "13",
    });
    setEditingId(null);
  };

  const handleEdit = (city: City) => {
    setFormData({
      country_id: city.country_id,
      name_sr: city.name_sr,
      name_en: city.name_en,
      name_ru: city.name_ru,
      latitude: city.latitude.toString(),
      longitude: city.longitude.toString(),
      zoom_level: city.zoom_level.toString(),
    });
    setEditingId(city.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const translateText = async (text: string, targetLanguage: string) => {
    if (!text.trim()) return "";
    
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text, targetLanguage },
      });

      if (error) throw error;
      return data.translatedText || "";
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Ошибка перевода");
      return "";
    }
  };

  const handleTranslate = async (sourceField: keyof typeof formData, sourceValue: string) => {
    if (!sourceValue.trim() || translating) return;

    setTranslating(true);
    
    // Определяем исходный язык из названия поля (name_sr, name_ru, name_en)
    const currentLang = sourceField.split("_")[1] as "sr" | "ru" | "en";
    const languages = ["sr", "ru", "en"].filter(lang => lang !== currentLang);

    for (const lang of languages) {
      const targetField = `name_${lang}` as keyof typeof formData;
      if (!formData[targetField]) {
        const translated = await translateText(sourceValue, lang);
        if (translated) {
          setFormData((prev) => ({ ...prev, [targetField]: translated }));
        }
      }
    }
    setTranslating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    const { error } = await supabase.from("cities").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting city");
      return;
    }

    toast.success(t("cityDeleted"));
    fetchCities();
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find((c) => c.id === countryId);
    return country ? country.name_sr : "";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? t("editCity") : t("addCity")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Select
                value={formData.country_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, country_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {getLocalizedName(country, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_sr">{t("nameSr")}</Label>
              <Input
                id="name_sr"
                value={formData.name_sr}
                onChange={(e) =>
                  setFormData({ ...formData, name_sr: e.target.value })
                }
                onBlur={(e) => handleTranslate("name_sr", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{t("nameEn")}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                onBlur={(e) => handleTranslate("name_en", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ru">{t("nameRu")}</Label>
              <Input
                id="name_ru"
                value={formData.name_ru}
                onChange={(e) =>
                  setFormData({ ...formData, name_ru: e.target.value })
                }
                onBlur={(e) => handleTranslate("name_ru", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">{t("latitude")}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t("longitude")}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoom_level">{t("zoomLevel")}</Label>
              <Input
                id="zoom_level"
                type="number"
                value={formData.zoom_level}
                onChange={(e) =>
                  setFormData({ ...formData, zoom_level: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={translating}>
              {translating ? "Перевод..." : editingId ? t("update") : t("create")}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("cancel")}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("cities")}</h2>
        {cities.map((city) => (
          <Card key={city.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {getLocalizedName(city, language)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("country")}: {getCountryName(city.country_id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("coordinates")}: {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)} | {t("zoom")}: {city.zoom_level}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(city)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(city.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
