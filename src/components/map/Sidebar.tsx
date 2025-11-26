import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Crown, ExternalLink, MapPinned, FileText, Search, Tag } from "lucide-react";
import { SharePlaceButton } from "./SharePlaceButton";
import { PromoDialog } from "@/components/promotions/PromoDialog";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface SidebarProps {
  categories: Category[];
  places: Place[];
  selectedCategories: string[];
  selectedPlace: string | null;
  maxDistance: number;
  userLocation: [number, number] | null;
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryToggle: (categoryId: string) => void;
  onPlaceSelect: (placeId: string | null) => void;
  onDistanceChange: (distance: number) => void;
  onPlacePageOpen: (place: Place) => void;
  onTourSelect?: (tourId: string) => void;
  onTourGuideOpen?: () => void;
  showTourGuideButton?: boolean;
}

export const Sidebar = ({
  categories,
  places,
  selectedCategories,
  selectedPlace,
  maxDistance,
  userLocation,
  isMobile,
  open,
  onOpenChange,
  onCategoryToggle,
  onPlaceSelect,
  onDistanceChange,
  onPlacePageOpen,
  onTourSelect,
  onTourGuideOpen,
  showTourGuideButton = false,
}: SidebarProps) => {
  const { t, language } = useLanguage();
  const placeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedPromoPlace, setSelectedPromoPlace] = useState<Place | null>(null);

  // Автоматический скролл к выбранному месту
  useEffect(() => {
    if (selectedPlace && placeRefs.current[selectedPlace]) {
      placeRefs.current[selectedPlace]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedPlace]);

  // Транслитерация кириллицы в латиницу и наоборот
  const transliterate = (text: string): string[] => {
    const cyrToLat: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ђ': 'dj', 'ј': 'j', 'љ': 'lj',
      'њ': 'nj', 'ћ': 'c', 'џ': 'dz', 'ѓ': 'gj', 'ќ': 'kj'
    };
    
    const latToCyr: { [key: string]: string } = {
      'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'zh': 'ж', 'z': 'з',
      'i': 'и', 'j': 'ј', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р',
      's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'ц', 'ch': 'ч', 'sh': 'ш',
      'y': 'и', 'w': 'в', 'dj': 'ђ', 'lj': 'љ', 'nj': 'њ', 'dz': 'џ'
    };

    const variants = [text];
    
    // Кириллица -> Латиница
    let translitLat = '';
    for (const char of text.toLowerCase()) {
      translitLat += cyrToLat[char] || char;
    }
    if (translitLat !== text.toLowerCase()) {
      variants.push(translitLat);
    }

    // Латиница -> Кириллица
    let translitCyr = text.toLowerCase();
    // Сначала заменяем длинные комбинации
    translitCyr = translitCyr.replace(/shch/g, 'щ').replace(/zh/g, 'ж').replace(/ch/g, 'ч')
      .replace(/sh/g, 'ш').replace(/yu/g, 'ю').replace(/ya/g, 'я').replace(/dj/g, 'ђ')
      .replace(/lj/g, 'љ').replace(/nj/g, 'њ').replace(/dz/g, 'џ');
    // Затем одиночные символы
    translitCyr = translitCyr.split('').map(char => latToCyr[char] || char).join('');
    if (translitCyr !== text.toLowerCase()) {
      variants.push(translitCyr);
    }

    return variants;
  };

  // Фильтрация мест по поисковому запросу с транслитерацией
  const filteredPlaces = places.filter(place => {
    if (!searchQuery.trim()) return true;
    
    const searchVariants = transliterate(searchQuery);
    const fieldsToSearch = [
      place.name,
      place.name_en,
      place.name_sr,
      place.address,
      place.description,
      place.description_en,
      place.description_sr
    ].filter(Boolean).map(f => f!.toLowerCase());

    return searchVariants.some(variant =>
      fieldsToSearch.some(field => field.includes(variant))
    );
  });
  
  const sidebarContent = (
    <>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-base text-foreground">{t("categories")}</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (selectedCategories.length === 0) {
                // Включить все категории
                categories.forEach(category => {
                  if (!selectedCategories.includes(category.id)) {
                    onCategoryToggle(category.id);
                  }
                });
              } else {
                // Отключить все категории
                selectedCategories.forEach(categoryId => onCategoryToggle(categoryId));
              }
            }}
          >
            {selectedCategories.length === 0 ? t("selectAll") : t("deselectAll")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 text-xs px-2.5 py-1"
              style={{
                backgroundColor: selectedCategories.includes(category.id)
                  ? category.color
                  : "transparent",
                borderColor: category.color,
                color: selectedCategories.includes(category.id) ? "white" : category.color,
                boxShadow: selectedCategories.includes(category.id) 
                  ? `0 2px 8px ${category.color}40` 
                  : "none",
              }}
              onClick={() => onCategoryToggle(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {userLocation && (
        <div className="p-3 border-b border-border">
          <h3 className="font-bold mb-2 text-sm text-foreground">
            {t("distance")}
          </h3>
          <div className="space-y-2">
            <Slider
              value={[maxDistance]}
              onValueChange={([value]) => onDistanceChange(value)}
              max={10000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground text-center">
              {maxDistance >= 10000 ? t("allPlaces") : `${(maxDistance / 1000).toFixed(1)} км`}
            </p>
          </div>
        </div>
      )}

      {showTourGuideButton && onTourGuideOpen && (
        <div className="p-3 border-b border-border">
          <Button
            onClick={onTourGuideOpen}
            className="w-full gap-2"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            <span className="font-semibold">Путеводитель</span>
          </Button>
        </div>
      )}

      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaces")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <h2 className="font-bold mb-3 text-base text-foreground">
            {t("placesCount").replace("{count}", filteredPlaces.length.toString())}
          </h2>
          {filteredPlaces.map((place) => {
            const category = categories.find(c => c.id === place.category_id);
            return (
              <div
                key={place.id}
                ref={(el) => {
                  placeRefs.current[place.id] = el;
                }}
                className={`group p-3 rounded-md border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                  selectedPlace === place.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                } ${place.is_premium ? "ring-1 ring-primary/20" : ""}`}
                onClick={() => {
                  onPlaceSelect(place.id);
                  if (isMobile) {
                    setTimeout(() => onOpenChange(false), 300);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {place.name}
                      </h3>
                      {place.is_premium && (
                        <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {place.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {place.description}
                      </p>
                    )}
                    {place.address && (
                      <p className="text-xs text-muted-foreground mb-1">
                        📍 {place.address}
                      </p>
                    )}
                    {place.phone && (
                      <p className="text-xs text-muted-foreground mb-1">
                        📞 <a href={`tel:${place.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {place.phone}
                        </a>
                      </p>
                    )}
                    {place.website && (
                      <p className="text-xs text-muted-foreground mb-2">
                        🌐 <a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {place.website}
                        </a>
                      </p>
                    )}
                    {category && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: category.color,
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <SharePlaceButton 
                    place={place}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[100px] text-xs h-8"
                  />
                  {place.promotions && place.is_premium && (() => {
                    const promo = place.promotions as any;
                    if (promo.isActive === false) return null;
                    
                    const now = new Date();
                    if (promo.startDate && now < new Date(promo.startDate)) return null;
                    if (promo.endDate && now > new Date(promo.endDate)) return null;
                    
                    return (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 min-w-[100px] text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPromoPlace(place);
                          setPromoDialogOpen(true);
                        }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        Акции
                      </Button>
                    );
                  })()}
                  {place.google_maps_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.google_maps_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Maps
                    </Button>
                  )}
                  {place.has_custom_page && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlacePageOpen(place);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {t("details")}
                    </Button>
                  )}
                  {place.custom_button_url && place.custom_button_text && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.custom_button_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {place.custom_button_text}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[85vh] bg-background border-t">
            {sidebarContent}
          </DrawerContent>
        </Drawer>
        {selectedPromoPlace && (
          <PromoDialog
            open={promoDialogOpen}
            onOpenChange={setPromoDialogOpen}
            promotions={selectedPromoPlace.promotions}
            placeName={selectedPromoPlace.name}
          />
        )}
      </>
    );
  }

  return (
    <>
      <aside className="w-80 border-r bg-card flex flex-col h-full overflow-hidden">
        {sidebarContent}
      </aside>
      {selectedPromoPlace && (
        <PromoDialog
          open={promoDialogOpen}
          onOpenChange={setPromoDialogOpen}
          promotions={selectedPromoPlace.promotions}
          placeName={selectedPromoPlace.name}
        />
      )}
    </>
  );
};
