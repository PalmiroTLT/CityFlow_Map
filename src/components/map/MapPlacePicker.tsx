import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { reverseGeocode } from "@/lib/geocoding";
import { MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface MapPlacePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (data: { latitude: number; longitude: number; address: string }) => void;
  initialPosition?: [number, number];
  cityCenter?: [number, number];
}

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const MapPlacePicker = ({ open, onOpenChange, onSelect, initialPosition, cityCenter }: MapPlacePickerProps) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = cityCenter || [44.787197, 20.457273]; // Belgrade by default
  const center = position || initialPosition || defaultCenter;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPosition(initialPosition || null);
      setAddress("");
      setLoading(false);
    }
  }, [open, initialPosition]);

  // Center map when it's ready and dialog is open
  useEffect(() => {
    if (open && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          if (initialPosition) {
            mapRef.current.setView(initialPosition, 13);
          } else if (cityCenter) {
            mapRef.current.setView(cityCenter, 13);
          }
        }
      }, 100);
    }
  }, [open, initialPosition, cityCenter]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setLoading(true);
    
    const fetchedAddress = await reverseGeocode(lat, lng);
    if (fetchedAddress) {
      setAddress(fetchedAddress);
    }
    
    setLoading(false);
  };

  const handleConfirm = () => {
    if (position) {
      onSelect({
        latitude: position[0],
        longitude: position[1],
        address: address || "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("selectLocationOnMap")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t("clickOnMapToSelectLocation")}
          </div>
          
          <div className="relative h-[500px] rounded-lg overflow-hidden border">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              ref={(map) => {
                if (map) {
                  mapRef.current = map;
                  // Center on initial position or city center
                  if (initialPosition) {
                    map.setView(initialPosition, 13);
                  } else if (cityCenter) {
                    map.setView(cityCenter, 13);
                  }
                }
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker onLocationSelect={handleLocationSelect} />
              {(position || initialPosition) && <Marker position={position || initialPosition!} icon={markerIcon} />}
            </MapContainer>
          </div>

          {position && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mt-1" />
                ) : (
                  <MapPin className="w-4 h-4 mt-1" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{t("selectedCoordinates")}:</div>
                  <div className="text-sm text-muted-foreground">
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </div>
                  {address && (
                    <>
                      <div className="text-sm font-medium mt-2">{t("address")}:</div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full text-sm bg-background border border-border rounded px-2 py-1 mt-1"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!position || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("confirmLocation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
