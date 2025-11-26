import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, MapPin, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { TourContentEditor } from "./TourContentEditor";
import { TourGuideEditor } from "@/components/tour-guide/TourGuideEditor";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName, getLocalizedDescription } from "@/lib/i18n/languageUtils";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

type TourWithCity = Tour & {
  cities?: { name_sr: string; name_en: string; name_ru: string } | null;
};

export const ToursTab = () => {
  const { language } = useLanguage();
  const [tours, setTours] = useState<TourWithCity[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [translating, setTranslating] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Tour | null>(null);
  const [formData, setFormData] = useState<{
    city_id: string;
    name: string;
    name_sr: string;
    name_en: string;
    description: string;
    description_sr: string;
    description_en: string;
    price: string;
    image_url: string;
    tour_content: { includes?: string[]; details?: string };
    is_active: boolean;
  }>({
    city_id: "",
    name: "",
    name_sr: "",
    name_en: "",
    description: "",
    description_sr: "",
    description_en: "",
    price: "0",
    image_url: "",
    tour_content: { includes: [], details: "" },
    is_active: true,
  });

  useEffect(() => {
    fetchTours();
    fetchPlaces();
    fetchCities();
  }, []);

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

  const handleTranslate = async (sourceField: string, sourceValue: string) => {
    if (!sourceValue.trim() || translating) return;

    setTranslating(true);
    
    const isNameField = sourceField.includes("name");
    const fieldBase = isNameField ? "name" : "description";
    
    // Маппинг полей: name = SR, name_sr = RU, name_en = EN
    let currentLang: string;
    let targetFields: { lang: string; field: string }[];
    
    if (sourceField === fieldBase) {
      // Поле без суффикса = сербский
      currentLang = "sr";
      targetFields = [
        { lang: "ru", field: `${fieldBase}_sr` },
        { lang: "en", field: `${fieldBase}_en` }
      ];
    } else if (sourceField === `${fieldBase}_sr`) {
      // Поле с _sr = русский
      currentLang = "ru";
      targetFields = [
        { lang: "sr", field: fieldBase },
        { lang: "en", field: `${fieldBase}_en` }
      ];
    } else {
      // Поле с _en = английский
      currentLang = "en";
      targetFields = [
        { lang: "sr", field: fieldBase },
        { lang: "ru", field: `${fieldBase}_sr` }
      ];
    }

    for (const { lang, field } of targetFields) {
      const currentValue = (formData as any)[field];
      if (!currentValue || !currentValue.trim()) {
        const translated = await translateText(sourceValue, lang);
        if (translated) {
          setFormData((prev) => ({ ...prev, [field]: translated }));
        }
      }
    }
    setTranslating(false);
  };

  const fetchTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select("*, cities(name_sr, name_en, name_ru)")
      .order("display_order");
    setTours(data || []);
  };

  const fetchPlaces = async () => {
    const { data } = await supabase
      .from("places")
      .select("*")
      .order("name");
    setPlaces(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*");
    setCities(data || []);
  };

  const fetchTourPlaces = async (tourId: string) => {
    const { data } = await supabase
      .from("tour_places")
      .select("place_id")
      .eq("tour_id", tourId);
    
    return data?.map(tp => tp.place_id) || [];
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tour-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tour-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Изображение загружено");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Ошибка загрузки изображения");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (formData.image_url) {
      try {
        const urlParts = formData.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from('tour-images')
          .remove([fileName]);
        
        setFormData({ ...formData, image_url: "" });
        setImageFile(null);
        toast.success("Изображение удалено");
      } catch (error) {
        console.error("Error removing image:", error);
        toast.error("Ошибка удаления изображения");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Если выбрано новое изображение, сначала загружаем его
    if (imageFile) {
      await handleImageUpload(imageFile);
      setImageFile(null);
    }

    const submitData = {
      ...formData,
      image_url: formData.image_url,
      price: parseFloat(formData.price) || 0,
      tour_content: formData.tour_content,
    };

    if (editingId) {
      const { error } = await supabase
        .from("tours")
        .update(submitData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка обновления тура");
        return;
      }

      // Update tour places
      await supabase.from("tour_places").delete().eq("tour_id", editingId);
      
      if (selectedPlaces.length > 0) {
        const tourPlaces = selectedPlaces.map((placeId, index) => ({
          tour_id: editingId,
          place_id: placeId,
          display_order: index,
        }));

        await supabase.from("tour_places").insert(tourPlaces);
      }

      toast.success("Тур обновлен");
    } else {
      const { data: newTour, error } = await supabase
        .from("tours")
        .insert({
          ...submitData,
          display_order: tours.length,
        })
        .select()
        .single();

      if (error || !newTour) {
        toast.error("Ошибка создания тура");
        return;
      }

      if (selectedPlaces.length > 0) {
        const tourPlaces = selectedPlaces.map((placeId, index) => ({
          tour_id: newTour.id,
          place_id: placeId,
          display_order: index,
        }));

        await supabase.from("tour_places").insert(tourPlaces);
      }

      toast.success("Тур создан");
    }

    resetForm();
    fetchTours();
  };

  const resetForm = () => {
    setFormData({
      city_id: "",
      name: "",
      name_sr: "",
      name_en: "",
      description: "",
      description_sr: "",
      description_en: "",
      price: "0",
      image_url: "",
      tour_content: { includes: [], details: "" },
      is_active: true,
    });
    setSelectedPlaces([]);
    setImageFile(null);
    setEditingId(null);
  };

  const handleEdit = async (tour: Tour) => {
    setEditingId(tour.id);
    setFormData({
      city_id: tour.city_id || "",
      name: tour.name,
      name_sr: (tour as any).name_sr || "",
      name_en: tour.name_en || "",
      description: tour.description || "",
      description_sr: (tour as any).description_sr || "",
      description_en: tour.description_en || "",
      price: tour.price?.toString() || "0",
      image_url: tour.image_url || "",
      tour_content: (tour.tour_content as any) || { includes: [], details: "" },
      is_active: tour.is_active,
    });
    
    const placeIds = await fetchTourPlaces(tour.id);
    setSelectedPlaces(placeIds);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тур?")) {
      return;
    }

    const { error } = await supabase
      .from("tours")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления тура");
      return;
    }

    toast.success("Тур удален");
    fetchTours();
  };

  const togglePlace = (placeId: string) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const filteredPlaces = formData.city_id
    ? places.filter(place => place.city_id === formData.city_id)
    : places;

  // If editing guide, show the guide editor
  if (editingGuide) {
    const tourPlaces = places
      .filter(place => 
        selectedPlaces.includes(place.id) || 
        (editingGuide.id && places.some(p => p.id === place.id))
      )
      .map(place => ({
        place_id: place.id,
        place_name: place.name,
      }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Редактор путеводителя: {editingGuide.name}</CardTitle>
              <Button variant="ghost" onClick={() => setEditingGuide(null)}>
                Назад к турам
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TourGuideEditor
              tour={editingGuide}
              onSave={() => {
                fetchTours();
                setEditingGuide(null);
              }}
              tourPlaces={tourPlaces}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Редактировать" : "Создать"} тур</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city_id">Город *</Label>
              <Select
                value={formData.city_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, city_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название (SR) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={(e) => handleTranslate("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_sr">Название (RU)</Label>
                <Input
                  id="name_sr"
                  value={formData.name_sr}
                  onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
                  onBlur={(e) => handleTranslate("name_sr", e.target.value)}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Описание (SR)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onBlur={(e) => handleTranslate("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_sr">Описание (RU)</Label>
                <Textarea
                  id="description_sr"
                  value={formData.description_sr}
                  onChange={(e) => setFormData({ ...formData, description_sr: e.target.value })}
                  onBlur={(e) => handleTranslate("description_sr", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">Описание (EN)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  onBlur={(e) => handleTranslate("description_en", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Цена (0 = бесплатно)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Изображение тура</Label>
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Tour preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleImageRemove}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingImage ? "Загрузка..." : "Нажмите для загрузки изображения"}
                    </span>
                  </Label>
                </div>
              )}
            </div>

            <div>
              <Label>Контент попапа</Label>
              <TourContentEditor
                value={formData.tour_content}
                onChange={(content) => setFormData({ ...formData, tour_content: content })}
              />
            </div>

            <div className="space-y-2">
              <Label>Места в туре</Label>
              {!formData.city_id ? (
                <p className="text-sm text-muted-foreground">Сначала выберите город</p>
              ) : (
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {filteredPlaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет мест в выбранном городе</p>
                  ) : (
                    filteredPlaces.map((place) => (
                      <div key={place.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`place-${place.id}`}
                          checked={selectedPlaces.includes(place.id)}
                          onCheckedChange={() => togglePlace(place.id)}
                        />
                        <Label
                          htmlFor={`place-${place.id}`}
                          className="cursor-pointer flex-1"
                        >
                          {place.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Выбрано мест: {selectedPlaces.length}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Активный тур
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploadingImage || translating}>
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {uploadingImage ? "Загрузка..." : translating ? "Перевод..." : editingId ? "Обновить" : "Создать"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tours.map((tour) => (
          <Card key={tour.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{getLocalizedName(tour, language)}</h3>
                    {!tour.is_active && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">Неактивен</span>
                    )}
                  </div>
                  {getLocalizedDescription(tour, language) && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {getLocalizedDescription(tour, language)}
                    </p>
                  )}
                  {tour.cities && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                      {getLocalizedName(tour.cities, language)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingGuide(tour)}>
                    Путеводитель
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tour)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tour.id)}>
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
