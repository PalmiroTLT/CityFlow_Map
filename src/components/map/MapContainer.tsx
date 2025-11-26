import { useEffect, useRef, useState } from "react";
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Crown, ExternalLink, MapPinned, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "./WishlistButton";
import { SharePlaceButton } from "./SharePlaceButton";
import { PromoDialog } from "@/components/promotions/PromoDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface MapContainerProps {
  places: Place[];
  categories: Category[];
  selectedPlace: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  userLocation: [number, number] | null;
  onPlacePageOpen: (place: Place) => void;
  cityCenter: [number, number];
  cityZoom: number;
  userId: string | null;
  flyToUserLocationTrigger?: number;
  skipAnimation?: boolean;
}

const MapUpdater = ({ 
  selectedPlace, 
  places, 
  cityCenter,
  cityZoom,
  userLocation,
  flyToUserLocationTrigger,
  skipAnimation = false,
}: { 
  selectedPlace: string | null; 
  places: Place[]; 
  cityCenter: [number, number];
  cityZoom: number;
  userLocation: [number, number] | null;
  flyToUserLocationTrigger?: number;
  skipAnimation?: boolean;
}) => {
  const map = useMap();
  const lastFlyTrigger = useRef<number>(0);

  useEffect(() => {
    if (selectedPlace) {
      const place = places.find(p => p.id === selectedPlace);
      if (place) {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const targetLat = place.latitude;
        const targetLng = place.longitude;
        
        // Check if already centered on this place at proper zoom
        const isAlreadyCentered = 
          Math.abs(currentCenter.lat - targetLat) < 0.0001 &&
          Math.abs(currentCenter.lng - targetLng) < 0.0001 &&
          currentZoom >= 16;
        
        if (!isAlreadyCentered && !skipAnimation) {
          map.flyTo([targetLat, targetLng], 18, {
            duration: 1.5,
            easeLinearity: 0.25,
          });
        } else if (isAlreadyCentered || skipAnimation) {
          // Just set view without animation
          map.setView([targetLat, targetLng], currentZoom >= 16 ? currentZoom : 18, { animate: false });
        }
      }
    }
  }, [selectedPlace, places, map]);

  useEffect(() => {
    // Летим к местоположению пользователя при изменении trigger
    if (flyToUserLocationTrigger && flyToUserLocationTrigger > lastFlyTrigger.current && userLocation) {
      lastFlyTrigger.current = flyToUserLocationTrigger;
      map.flyTo(userLocation, 18, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [flyToUserLocationTrigger, userLocation, map]);

  useEffect(() => {
    // Летим к центру города только если не выбрано конкретное место и не было недавнего полета к пользователю
    if (!selectedPlace && (!flyToUserLocationTrigger || flyToUserLocationTrigger === 0)) {
      map.flyTo(cityCenter, cityZoom, {
        duration: 1.5,
      });
    }
  }, [cityCenter, cityZoom, map, selectedPlace, flyToUserLocationTrigger]);

  return null;
};

const createCustomIcon = (color: string, isPremium: boolean) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        ${isPremium ? `
          <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
          </linearGradient>
        ` : ''}
      </defs>
      <path 
        d="M16,2 C9.4,2 4,7.4 4,14 C4,23 16,38 16,38 C16,38 28,23 28,14 C28,7.4 22.6,2 16,2 Z" 
        fill="${isPremium ? 'url(#premiumGradient)' : color}"
        filter="url(#shadow)"
        stroke="${isPremium ? '#FFD700' : '#ffffff'}"
        stroke-width="2"
      />
      <circle cx="16" cy="14" r="6" fill="white" opacity="0.9"/>
      ${isPremium ? '<path d="M16,10 L17,13 L20,13 L18,15 L19,18 L16,16 L13,18 L14,15 L12,13 L15,13 Z" fill="#FFD700"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

export const MapView = ({
  places,
  categories,
  selectedPlace,
  onPlaceSelect,
  userLocation,
  onPlacePageOpen,
  cityCenter,
  cityZoom,
  userId,
  flyToUserLocationTrigger,
  skipAnimation = false,
}: MapContainerProps) => {
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const { t } = useLanguage();
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedPromoPlace, setSelectedPromoPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (selectedPlace && markerRefs.current[selectedPlace]) {
      markerRefs.current[selectedPlace].openPopup();
    }
  }, [selectedPlace, places]);

  return (
    <div className="flex-1 relative">
      <LeafletMap
        center={cityCenter}
        zoom={cityZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
              className: "user-location-marker",
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>Вы здесь</Popup>
          </Marker>
        )}

        {places.map((place) => {
          const category = categories.find(c => c.id === place.category_id);
          const markerColor = category?.color || "#3B82F6";
          
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(markerColor, place.is_premium)}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[place.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onPlaceSelect(place.id),
              }}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-base flex-1">{place.name}</h3>
                    {place.is_premium && (
                      <Crown className="w-5 h-5 text-premium flex-shrink-0" />
                    )}
                  </div>
                  
                  {place.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {place.description}
                    </p>
                  )}

                  {place.address && (
                    <p className="text-xs text-muted-foreground mb-3">
                      📍 {place.address}
                    </p>
                  )}

                  {place.phone && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📞 <a href={`tel:${place.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {place.phone}
                      </a>
                    </p>
                  )}

                  {place.website && (
                    <p className="text-xs text-muted-foreground mb-3">
                      🌐 <a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {place.website}
                      </a>
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <WishlistButton placeId={place.id} userId={userId} />
                    <SharePlaceButton 
                      place={place} 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                    />
                    {place.promotions && place.is_premium && (() => {
                      const promo = place.promotions as any;
                      if (promo.isActive === false) return null;
                      
                      const now = new Date();
                      if (promo.startDate && now < new Date(promo.startDate)) return null;
                      if (promo.endDate && now > new Date(promo.endDate)) return null;
                      
                      return (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full justify-start bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          onClick={() => {
                            setSelectedPromoPlace(place);
                            setPromoDialogOpen(true);
                          }}
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Акции и предложения
                        </Button>
                      );
                    })()}
                    {place.has_custom_page && place.is_premium && (
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full justify-start"
                        onClick={() => onPlacePageOpen(place)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {t("moreAboutPlace")}
                      </Button>
                    )}
                    {place.google_maps_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(place.google_maps_url!, "_blank")}
                      >
                        <MapPinned className="w-4 h-4 mr-2" />
                        Открыть в Google Maps
                      </Button>
                    )}
                    {place.custom_button_url && place.custom_button_text && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(place.custom_button_url!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {place.custom_button_text}
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater 
          selectedPlace={selectedPlace}
          places={places}
          cityCenter={cityCenter}
          cityZoom={cityZoom}
          userLocation={userLocation}
          flyToUserLocationTrigger={flyToUserLocationTrigger}
          skipAnimation={skipAnimation}
        />
      </LeafletMap>
      
      {selectedPromoPlace && (
        <PromoDialog
          open={promoDialogOpen}
          onOpenChange={setPromoDialogOpen}
          promotions={selectedPromoPlace.promotions}
          placeName={selectedPromoPlace.name}
        />
      )}
    </div>
  );
};
