import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName } from "@/lib/i18n/languageUtils";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export const CategoriesTab = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_sr: "",
    name_ru: "",
    name_en: "",
    color: "#3B82F6",
  });
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Ошибка загрузки категорий");
      return;
    }

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update(formData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка обновления категории");
        return;
      }

      toast.success("Категория обновлена");
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({
          name: formData.name_sr || formData.name_ru || formData.name_en,
          name_sr: formData.name_sr,
          name_ru: formData.name_ru,
          name_en: formData.name_en,
          color: formData.color,
          display_order: categories.length,
        });

      if (error) {
        toast.error("Ошибка создания категории");
        return;
      }

      toast.success("Категория создана");
    }

    setFormData({ name_sr: "", name_ru: "", name_en: "", color: "#3B82F6" });
    setEditingId(null);
    fetchCategories();
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

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name_sr: category.name_sr || "",
      name_ru: category.name_ru || "",
      name_en: category.name_en || "",
      color: category.color,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту категорию?")) {
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления категории");
      return;
    }

    toast.success("Категория удалена");
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Редактировать" : "Создать"} категорию</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_sr">Название (SR)</Label>
                <Input
                  id="name_sr"
                  value={formData.name_sr}
                  onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
                  onBlur={(e) => handleTranslate("name_sr", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ru">Название (RU)</Label>
                <Input
                  id="name_ru"
                  value={formData.name_ru}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                  onBlur={(e) => handleTranslate("name_ru", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">Название (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  onBlur={(e) => handleTranslate("name_en", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Цвет</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={translating}>
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {translating ? "Перевод..." : editingId ? "Обновить" : "Создать"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name_sr: "", name_ru: "", name_en: "", color: "#3B82F6" });
                  }}
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <h3 className="font-medium">{getLocalizedName(category, language)}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {category.name_ru && <p>RU: {category.name_ru}</p>}
                      {category.name_en && <p>EN: {category.name_en}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
