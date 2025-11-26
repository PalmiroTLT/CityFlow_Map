import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Crown, FileText, UserCircle, CreditCard, Eye, EyeOff, Heart, MapPin, Loader2, Map, Tag } from "lucide-react";
import { toast } from "sonner";
import { PlacePageEditor } from "@/components/place-page/PlacePageEditor";
import { PromoEditor } from "@/components/promotions/PromoEditor";
import { WishlistViewerDialog } from "./WishlistViewerDialog";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedName, getLocalizedDescription } from "@/lib/i18n/languageUtils";
import { geocodeAddress } from "@/lib/geocoding";
import { MapPlacePicker } from "@/components/map/MapPlacePicker";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

type PlaceWithCity = Place & {
  cities?: { name_sr: string; name_en: string; name_ru: string } | null;
  owner_profile?: { email: string; full_name: string | null } | null;
  active_subscriptions?: number;
  wishlist_count?: number;
};

export const PlacesTab = () => {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<PlaceWithCity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPagePlace, setEditingPagePlace] = useState<Place | null>(null);
  const [editingPromoPlace, setEditingPromoPlace] = useState<Place | null>(null);
  const [promotionsData, setPromotionsData] = useState<any>(null);
  const [viewingWishlistPlace, setViewingWishlistPlace] = useState<{ id: string; name: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [formData, setFormData] = useState({
    category_id: "",
    city_id: "",
    name: "",
    name_sr: "",
    name_en: "",
    description: "",
    description_sr: "",
    description_en: "",
    latitude: "",
    longitude: "",
    address: "",
    phone: "",
    website: "",
    is_premium: false,
    custom_button_text: "",
    custom_button_url: "",
    google_maps_url: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchCities();
    fetchPlaces();
  }, []);

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

  const fetchPlaces = async () => {
    const { data: placesData } = await supabase
      .from("places")
      .select("*, cities(name_sr, name_en, name_ru)")
      .order("created_at", { ascending: false });
    
    if (!placesData) {
      setPlaces([]);
      return;
    }

    // Get owner profiles for places that have owners
    const ownerIds = placesData
      .filter(p => p.owner_id)
      .map(p => p.owner_id)
      .filter((id): id is string => id !== null);

    const { data: profiles } = ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", ownerIds)
      : { data: null };

    // Get active subscriptions count for places
    const placeIds = placesData.map(p => p.id);
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("place_id, is_active")
      .in("place_id", placeIds)
      .eq("is_active", true);

    // Get wishlist count for places
    const { data: wishlists } = await supabase
      .from("user_places")
      .select("place_id")
      .in("place_id", placeIds);

    // Combine data
    const enrichedPlaces: PlaceWithCity[] = placesData.map(place => {
      const owner = profiles?.find(p => p.id === place.owner_id);
      const activeSubsCount = subscriptions?.filter(s => s.place_id === place.id).length || 0;
      const wishlistCount = wishlists?.filter(w => w.place_id === place.id).length || 0;
      
      return {
        ...place,
        owner_profile: owner ? { email: owner.email, full_name: owner.full_name } : null,
        active_subscriptions: activeSubsCount,
        wishlist_count: wishlistCount,
      };
    });

    setPlaces(enrichedPlaces);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id) {
      toast.error("Пожалуйста, выберите категорию");
      return;
    }

    const placeData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      category_id: formData.category_id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("places")
        .update(placeData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка обновления места");
        return;
      }

      toast.success("Место обновлено");
    } else {
      const { error } = await supabase
        .from("places")
        .insert(placeData);

      if (error) {
        toast.error("Ошибка создания места");
        return;
      }

      toast.success("Место создано");
    }

    resetForm();
    fetchPlaces();
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

  const handleTranslate = async (sourceField: string, sourceValue: string) => {
    if (!sourceValue.trim() || translating) return;

    setTranslating(true);
    
    // Определяем тип поля и исходный язык
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

  const determineCityFromCoordinates = async (lat: number, lng: number) => {
    if (!cities.length) return;

    const distances = cities.map(city => ({
      city,
      distance: Math.sqrt(
        Math.pow(city.latitude - lat, 2) + Math.pow(city.longitude - lng, 2)
      )
    }));

    const closest = distances.reduce((prev, curr) => 
      curr.distance < prev.distance ? curr : prev
    );

    if (closest.distance < 1) {
      setFormData(prev => ({ ...prev, city_id: closest.city.id }));
    }
  };

  const handleAddressBlur = async () => {
    if (!formData.address.trim() || formData.latitude || formData.longitude || geocoding) return;
    
    setGeocoding(true);
    const result = await geocodeAddress(formData.address);
    setGeocoding(false);
    
    if (result) {
      setFormData({
        ...formData,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
      });
      await determineCityFromCoordinates(result.latitude, result.longitude);
      toast.success(t("coordinatesAutoFilled"));
    }
  };

  const handleCoordinatesChange = async (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      await determineCityFromCoordinates(latitude, longitude);
    }
  };

  const handleMapSelect = async (data: { latitude: number; longitude: number; address: string }) => {
    setFormData({
      ...formData,
      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),
      address: data.address,
    });
    await determineCityFromCoordinates(data.latitude, data.longitude);
    toast.success(t("locationSelectedFromMap"));
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
      name_sr: "",
      name_en: "",
      description: "",
      description_sr: "",
      description_en: "",
      latitude: "",
      longitude: "",
      address: "",
      phone: "",
      website: "",
      is_premium: false,
      custom_button_text: "",
      custom_button_url: "",
      google_maps_url: "",
    });
    setEditingId(null);
  };

  const handleEdit = (place: Place) => {
    setEditingId(place.id);
    setFormData({
      category_id: place.category_id || "",
      city_id: place.city_id || "",
      name: place.name,
      name_sr: (place as any).name_sr || "",
      name_en: place.name_en || "",
      description: place.description || "",
      description_sr: (place as any).description_sr || "",
      description_en: place.description_en || "",
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      address: place.address || "",
      phone: place.phone || "",
      website: place.website || "",
      is_premium: place.is_premium || false,
      custom_button_text: place.custom_button_text || "",
      custom_button_url: place.custom_button_url || "",
      google_maps_url: place.google_maps_url || "",
    });
  };

  const handleEditPromo = (place: Place) => {
    setEditingPromoPlace(place);
    setPromotionsData(place.promotions || null);
  };

  const handleSavePromotions = async () => {
    if (!editingPromoPlace) return;

    try {
      const { error } = await supabase
        .from("places")
        .update({ promotions: promotionsData })
        .eq("id", editingPromoPlace.id);

      if (error) throw error;

      toast.success("Акции сохранены");
      setEditingPromoPlace(null);
      fetchPlaces();
    } catch (error) {
      console.error("Error saving promotions:", error);
      toast.error("Ошибка сохранения акций");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это место?")) {
      return;
    }

    const { error } = await supabase
      .from("places")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления места");
      return;
    }

    toast.success("Место удалено");
    fetchPlaces();
  };

  const toggleHidden = async (id: string, currentHidden: boolean) => {
    const { error } = await supabase
      .from("places")
      .update({ is_hidden: !currentHidden })
      .eq("id", id);

    if (error) {
      toast.error(t("error"));
      return;
    }

    toast.success(currentHidden ? t("placeRestored") : t("placeHidden"));
    fetchPlaces();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Редактировать" : "Создать"} место</CardTitle>
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

            <div className="space-y-2">
              <Label htmlFor="category">Категория *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => {
                    setFormData({ ...formData, latitude: e.target.value });
                    handleCoordinatesChange(e.target.value, formData.longitude);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => {
                    setFormData({ ...formData, longitude: e.target.value });
                    handleCoordinatesChange(formData.latitude, e.target.value);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+381..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Сайт</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_maps_url">Ссылка на Google Maps</Label>
              <Input
                id="google_maps_url"
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom_button_text">Текст кнопки</Label>
                <Input
                  id="custom_button_text"
                  value={formData.custom_button_text}
                  onChange={(e) => setFormData({ ...formData, custom_button_text: e.target.value })}
                  placeholder="Забронировать"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_button_url">Ссылка кнопки</Label>
                <Input
                  id="custom_button_url"
                  type="url"
                  value={formData.custom_button_url}
                  onChange={(e) => setFormData({ ...formData, custom_button_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_premium: checked as boolean })
                }
              />
              <Label htmlFor="is_premium" className="cursor-pointer">
                Премиум место (с короной)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={translating}>
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {translating ? "Перевод..." : editingId ? "Обновить" : "Создать"}
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

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold">Список мест</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Badge 
                variant={visibilityFilter === "visible" ? "default" : "secondary"} 
                className="gap-1 cursor-pointer"
                onClick={() => setVisibilityFilter(visibilityFilter === "visible" ? "all" : "visible")}
              >
                <Eye className="w-3 h-3" />
                {t("visiblePlaces")}: {places.filter(p => !p.is_hidden).length}
              </Badge>
              <Badge 
                variant={visibilityFilter === "hidden" ? "default" : "destructive"} 
                className="gap-1 cursor-pointer"
                onClick={() => setVisibilityFilter(visibilityFilter === "hidden" ? "all" : "hidden")}
              >
                <EyeOff className="w-3 h-3" />
                {t("hiddenPlaces")}: {places.filter(p => p.is_hidden).length}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {t("totalPlaces")}: {places.length}
              </Badge>
            </div>
            {visibilityFilter !== "all" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisibilityFilter("all")}
              >
                {t("resetFilter")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
        {places
          .filter(place => {
            if (visibilityFilter === "visible") return !place.is_hidden;
            if (visibilityFilter === "hidden") return place.is_hidden;
            return true;
          })
          .map((place) => {
          const category = categories.find(c => c.id === place.category_id);
          const hasActiveSubscription = (place.active_subscriptions || 0) > 0;
          const ownerName = place.owner_profile?.full_name || place.owner_profile?.email || 'Неизвестный';
          
          return (
            <Card key={place.id} className={place.is_hidden ? 'border-muted-foreground/30 bg-muted/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-medium ${place.is_hidden ? 'text-muted-foreground' : ''}`}>
                        {getLocalizedName(place, language)}
                      </h3>
                      {place.is_premium && <Crown className="w-4 h-4 text-premium" />}
                      {place.is_hidden && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <EyeOff className="w-3 h-3" />
                          {t("hiddenFromUsers")}
                        </Badge>
                      )}
                    </div>
                    {getLocalizedDescription(place, language) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {getLocalizedDescription(place, language)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {place.cities && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                          {getLocalizedName(place.cities, language)}
                        </div>
                      )}
                      {category && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getLocalizedName(category, language)}
                        </div>
                      )}
                    </div>
                    {place.owner_id && (
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Badge variant="outline" className="gap-1">
                          <UserCircle className="w-3 h-3" />
                          {ownerName}
                        </Badge>
                        {hasActiveSubscription && (
                          <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                            <CreditCard className="w-3 h-3" />
                            По подписке
                          </Badge>
                        )}
                      </div>
                    )}
                    {(place.wishlist_count || 0) > 0 && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="gap-1 bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20">
                          <Heart className="w-3 h-3" />
                          Хотят посетить: {place.wishlist_count}
                        </Badge>
                      </div>
                    )}
                   </div>
                   <div className="flex gap-2">
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={() => window.location.href = `/?placeId=${place.id}`}
                       title={t("viewOnMap")}
                     >
                       <Map className="w-4 h-4" />
                     </Button>
                     {(place.wishlist_count || 0) > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingWishlistPlace({ id: place.id, name: place.name })}
                        title="Посмотреть кто хочет посетить"
                      >
                        <Heart className="w-4 h-4 text-pink-500" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={place.is_hidden ? "default" : "ghost"}
                      onClick={() => toggleHidden(place.id, place.is_hidden || false)}
                      title={place.is_hidden ? t("restorePlace") : t("hidePlace")}
                      className={place.is_hidden ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                      {place.is_hidden ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          {t("restorePlace")}
                        </>
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPagePlace(place)}
                      title="Редактировать страницу"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditPromo(place)}
                      title="Редактировать акции"
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(place)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(place.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Page Editor Dialog */}
      <Dialog open={!!editingPagePlace} onOpenChange={() => setEditingPagePlace(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать страницу: {editingPagePlace?.name}</DialogTitle>
          </DialogHeader>
          {editingPagePlace && !editingPagePlace.is_premium && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Предупреждение:</strong> Это место не имеет премиум-статуса. 
                Кастомные страницы доступны только для премиум-мест. 
                Как администратор вы можете редактировать страницу, но владелец не сможет увидеть или изменить её 
                без активации премиум-статуса.
              </div>
            </div>
          )}
          {editingPagePlace && (
            <PlacePageEditor
              place={editingPagePlace}
              onSave={() => {
                setEditingPagePlace(null);
                fetchPlaces();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Wishlist Viewer Dialog */}
      <WishlistViewerDialog
        placeId={viewingWishlistPlace?.id || null}
        placeName={viewingWishlistPlace?.name || ""}
        onClose={() => setViewingWishlistPlace(null)}
      />

      {/* Promotions Editor Dialog */}
      <Dialog open={!!editingPromoPlace} onOpenChange={() => setEditingPromoPlace(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Акции и предложения: {editingPromoPlace?.name}</DialogTitle>
          </DialogHeader>
          {editingPromoPlace && !editingPromoPlace.is_premium && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Предупреждение:</strong> Акции доступны только для премиум-мест.
              </div>
            </div>
          )}
          {editingPromoPlace && (
            <>
              <PromoEditor value={promotionsData} onChange={setPromotionsData} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditingPromoPlace(null)}>
                  Отмена
                </Button>
                <Button onClick={handleSavePromotions}>
                  Сохранить акции
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Place Picker */}
      <MapPlacePicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        onSelect={handleMapSelect}
        initialPosition={
          formData.latitude && formData.longitude
            ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
            : undefined
        }
        cityCenter={getCityCenter()}
      />
    </div>
  );
};
