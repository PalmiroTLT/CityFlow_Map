import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Crown, AlertCircle, MapPin, Tag } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PlacePageEditor } from "@/components/place-page/PlacePageEditor";
import { PromoEditor } from "@/components/promotions/PromoEditor";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";
import { MapPlacePicker } from "@/components/map/MapPlacePicker";
import { getLocalizedName } from "@/lib/i18n/languageUtils";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface EditPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  place: Place | null;
}

export const EditPlaceDialog = ({ open, onOpenChange, onSuccess, place }: EditPlaceDialogProps) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [cityChanged, setCityChanged] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingCustomPage, setEditingCustomPage] = useState(false);
  const [editingPromotions, setEditingPromotions] = useState(false);
  const [promotionsData, setPromotionsData] = useState<any>(null);
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
    google_maps_url: "",
    phone: "",
    website: "",
  });

  useEffect(() => {
    if (open && place) {
      const loadData = async () => {
        await Promise.all([fetchCategories(), fetchCities()]);
        
        // Set form data with explicit values to prevent reset
        setFormData({
          category_id: place.category_id || "",
          city_id: place.city_id || "",
          name: place.name || "",
          name_en: place.name_en || "",
          name_sr: place.name_sr || "",
          description: place.description || "",
          description_en: place.description_en || "",
          description_sr: place.description_sr || "",
          latitude: place.latitude?.toString() || "",
          longitude: place.longitude?.toString() || "",
          address: place.address || "",
          google_maps_url: place.google_maps_url || "",
          phone: place.phone || "",
          website: place.website || "",
        });
        
        setPromotionsData(place.promotions || null);
      };
      
      loadData();
    }
  }, [open, place]);

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

  const determineCityFromCoordinates = async (lat: number, lng: number) => {
    try {
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

  const handleAddressBlur = async () => {
    if (!formData.address.trim()) return;

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

  const handleTranslate = async (
    sourceField: "name" | "name_sr" | "name_en" | "description" | "description_sr" | "description_en",
    value: string,
  ) => {
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
    setFormData(prev => ({
      ...prev,
      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),
      address: data.address,
    }));
    setCityChanged(false); // Reset city changed flag after selecting location
    toast({
      title: t("success"),
      description: t("locationSelectedFromMap"),
    });
  };

  const getCityCenter = (): [number, number] | undefined => {
    if (!formData.city_id) return undefined;
    const city = cities.find(c => c.id === formData.city_id);
    return city ? [city.latitude, city.longitude] : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;

    // Validate category
    if (!formData.category_id) {
      toast({
        title: t("error"),
        description: "Пожалуйста, выберите категорию",
        variant: "destructive",
      });
      return;
    }

    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: t("error"),
        description: t("invalidCoordinates"),
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: t("error"),
        description: t("coordinatesOutOfRange"),
        variant: "destructive",
      });
      return;
    }

    // Validate phone format (simplified - allow any reasonable phone format)
    if (formData.phone && formData.phone.trim() && !formData.phone.match(/^[+\d\s\-\(\)]+$/)) {
      toast({
        title: t("error"),
        description: "Телефон может содержать только цифры, пробелы, +, -, ( )",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format (simplified - just check it's not empty if provided)
    if (formData.website && formData.website.trim() && formData.website.length < 4) {
      toast({
        title: t("error"),
        description: "Введите корректный URL сайта",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("places")
        .update({
          category_id: formData.category_id || null,
          city_id: formData.city_id || null,
          name: formData.name,
          name_en: formData.name_en || null,
          name_sr: formData.name_sr || null,
          description: formData.description || null,
          description_en: formData.description_en || null,
          description_sr: formData.description_sr || null,
          latitude: lat,
          longitude: lng,
          address: formData.address || null,
          google_maps_url: formData.google_maps_url || null,
          phone: formData.phone || null,
          website: formData.website || null,
          is_hidden: false, // Ensure place remains visible after editing
        })
        .eq("id", place.id);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("placeUpdated"),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToUpdatePlace"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromotions = async () => {
    if (!place) return;
    
    try {
      const { error } = await supabase
        .from("places")
        .update({ promotions: promotionsData })
        .eq("id", place.id);
        
      if (error) throw error;
      
      toast({
        title: t("success"),
        description: "Акции сохранены",
      });
      
      setEditingPromotions(false);
      onSuccess();
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : "Ошибка сохранения акций",
        variant: "destructive",
      });
    }
  };

  if (editingCustomPage && place) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование страницы: {place.name}</DialogTitle>
          </DialogHeader>
          {!place.is_premium && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Предупреждение:</strong> Это место не имеет премиум-статуса. 
                Кастомные страницы доступны только для премиум-мест. 
                Вы можете редактировать страницу, но она не будет отображаться для пользователей 
                без активации премиум-статуса.
              </div>
            </div>
          )}
          <PlacePageEditor
            place={place}
            onSave={() => {
              setEditingCustomPage(false);
              onSuccess();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }
  
  if (editingPromotions && place) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Акции и предложения: {place.name}</DialogTitle>
          </DialogHeader>
          {!place.is_premium && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Предупреждение:</strong> Акции доступны только для премиум-мест.
              </div>
            </div>
          )}
          <PromoEditor value={promotionsData} onChange={setPromotionsData} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingPromotions(false)}>
              Отмена
            </Button>
            <Button onClick={handleSavePromotions}>
              Сохранить акции
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editPlace")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Основное</TabsTrigger>
            <TabsTrigger value="promotions">
              <Tag className="w-4 h-4 mr-2" />
              Акции
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">{t("category")} *</Label>
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

            <div>
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
            <div>
              <Label htmlFor="name">{t("placeNameRu")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onBlur={(e) => handleTranslate("name", e.target.value)}
                placeholder={t("enterPlaceName")}
                required
              />
            </div>
            <div>
              <Label htmlFor="name_sr">{t("placeNameSr")}</Label>
              <Input
                id="name_sr"
                value={formData.name_sr}
                onChange={(e) => setFormData(prev => ({ ...prev, name_sr: e.target.value }))}
                onBlur={(e) => handleTranslate("name_sr", e.target.value)}
                placeholder={t("enterPlaceNameSr")}
              />
            </div>
            <div>
              <Label htmlFor="name_en">{t("placeNameEn")}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                onBlur={(e) => handleTranslate("name_en", e.target.value)}
                placeholder={t("enterPlaceNameEn")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description">{t("descriptionRu")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                onBlur={(e) => handleTranslate("description", e.target.value)}
                placeholder={t("enterDescription")}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description_sr">{t("descriptionSr")}</Label>
              <Textarea
                id="description_sr"
                value={formData.description_sr}
                onChange={(e) => setFormData(prev => ({ ...prev, description_sr: e.target.value }))}
                onBlur={(e) => handleTranslate("description_sr", e.target.value)}
                placeholder={t("enterDescriptionSr")}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description_en">{t("descriptionEn")}</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                onBlur={(e) => handleTranslate("description_en", e.target.value)}
                placeholder={t("enterDescriptionEn")}
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              onBlur={handleAddressBlur}
              placeholder={t("enterAddress")}
              disabled={geocoding}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {geocoding ? t("searchingCoordinates") : t("enterAddressForAutoCoordinates")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">{t("latitude")} *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleCoordinatesChange("latitude", e.target.value)}
                placeholder="42.123456"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("latitudeRange")} (-90 to 90)
              </p>
            </div>

            <div>
              <Label htmlFor="longitude">{t("longitude")} *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleCoordinatesChange("longitude", e.target.value)}
                placeholder="21.123456"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("longitudeRange")} (-180 to 180)
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setMapPickerOpen(true)}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t("selectOnMap")}
          </Button>

          <div>
            <Label htmlFor="google_maps_url">{t("googleMapsUrl")}</Label>
            <Input
              id="google_maps_url"
              type="url"
              value={formData.google_maps_url}
              onChange={(e) => setFormData(prev => ({ ...prev, google_maps_url: e.target.value }))}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("googleMapsUrlHint")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+381 11 234 5678"
              />
            </div>
            <div>
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

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading || translating}>
              {(loading || translating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>

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
      </TabsContent>

      <TabsContent value="promotions">
        <div className="space-y-4">
          {!place?.is_premium && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Акции и предложения доступны только для премиум-мест.
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={() => setEditingPromotions(true)}
            className="w-full gap-2"
          >
            <Tag className="w-4 h-4" />
            Редактировать акции
          </Button>
        </div>
      </TabsContent>
    </Tabs>
      </DialogContent>
    </Dialog>
  );
};
