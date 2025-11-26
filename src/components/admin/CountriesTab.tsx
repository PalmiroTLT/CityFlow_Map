import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName } from "@/lib/i18n/languageUtils";

type Country = {
  id: string;
  code: string;
  name_sr: string;
  name_en: string;
  name_ru: string;
};

export const CountriesTab = () => {
  const { t, language } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name_sr: "",
    name_en: "",
    name_ru: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("countries")
      .select("*")
      .order("name_sr");
    if (data) setCountries(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from("countries")
        .update(formData)
        .eq("id", editingId);

      if (error) {
        toast.error("Error updating country");
        return;
      }
      toast.success(t("countryUpdated"));
    } else {
      const { error } = await supabase.from("countries").insert([formData]);

      if (error) {
        toast.error("Error creating country");
        return;
      }
      toast.success(t("countryCreated"));
    }

    resetForm();
    fetchCountries();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name_sr: "",
      name_en: "",
      name_ru: "",
    });
    setEditingId(null);
  };

  const handleEdit = (country: Country) => {
    setFormData({
      code: country.code,
      name_sr: country.name_sr,
      name_en: country.name_en,
      name_ru: country.name_ru,
    });
    setEditingId(country.id);
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

    const { error } = await supabase.from("countries").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting country");
      return;
    }

    toast.success(t("countryDeleted"));
    fetchCountries();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? t("editCountry") : t("addCountry")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("countryCode")}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="RS, RU, US..."
                required
              />
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
        <h2 className="text-xl font-semibold">{t("countries")}</h2>
        {countries.map((country) => (
          <Card key={country.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {getLocalizedName(country, language)}
                </p>
                <p className="text-sm text-muted-foreground">{t("code")}: {country.code}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(country)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(country.id)}
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
