import { MapPin, LogOut, Settings, Route, Globe, MapPinned, User as UserIcon, Menu, Navigation, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useLanguage, Language } from "@/lib/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PushNotificationButton } from "@/components/PushNotificationButton";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { RegisterBenefitsDialog } from "@/components/RegisterBenefitsDialog";
import { DonationDialog } from "@/components/DonationDialog";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

type Country = Database["public"]["Tables"]["countries"]["Row"];

interface HeaderProps {
  user: User | null;
  isAdmin: boolean;
  onSignOut: () => void;
  tours: Tour[];
  activeTour: Tour | null;
  onTourSelect: (tour: Tour | null) => void;
  selectedCity: City | null;
  onCityChange: (cityId: string) => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  onMyLocation: () => void;
  wishlistMode?: boolean;
  onExitWishlistMode?: () => void;
}

export const Header = ({ 
  user, 
  isAdmin, 
  onSignOut, 
  tours, 
  activeTour, 
  onTourSelect,
  selectedCity,
  onCityChange,
  onMenuClick,
  showMenuButton = false,
  onMyLocation,
  wishlistMode = false,
  onExitWishlistMode
}: HeaderProps) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [freeTours, setFreeTours] = useState<Tour[]>([]);
  const [purchasedTourIds, setPurchasedTourIds] = useState<string[]>([]);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);

  useEffect(() => {
    fetchCountries();
    const savedCountryId = localStorage.getItem("selectedCountry");
    if (savedCountryId) {
      setSelectedCountry(savedCountryId);
      fetchCities(savedCountryId);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCities(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCity) {
      fetchFreeTours();
      fetchPurchasedTours();
    }
  }, [selectedCity]);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("countries")
      .select("*")
      .order("name_sr");
    if (data) setCountries(data);
  };

  const fetchCities = async (countryId: string) => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .eq("country_id", countryId)
      .order("name_sr");
    if (data) {
      setCities(data);
    } else {
      setCities([]);
    }
  };

  const fetchFreeTours = async () => {
    if (!selectedCity) return;
    
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("price", 0)
      .eq("is_active", true)
      .eq("city_id", selectedCity.id);
    if (data) setFreeTours(data);
  };

  const fetchPurchasedTours = async () => {
    if (!selectedCity || !user) return;
    
    const { data } = await supabase
      .from("purchased_tours")
      .select("tour_id")
      .eq("user_id", user.id);
    if (data) setPurchasedTourIds(data.map(p => p.tour_id));
  };

  const getCityName = (city: City) => {
    if (language === "sr") return city.name_sr;
    if (language === "ru") return city.name_ru;
    return city.name_en;
  };

  const getCountryName = (country: Country) => {
    if (language === "sr") return country.name_sr;
    if (language === "ru") return country.name_ru;
    return country.name_en;
  };

  const handleCountryChange = async (countryId: string) => {
    setSelectedCountry(countryId);
    localStorage.setItem("selectedCountry", countryId);
    
    // Save to user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ country_id: countryId, city_id: null })
        .eq("id", user.id);
    }
  };

  const availableTours = [
    ...freeTours,
    ...tours.filter(t => purchasedTourIds.includes(t.id) && t.city_id === selectedCity?.id)
  ].filter((tour, index, self) => 
    index === self.findIndex(t => t.id === tour.id)
  );

  return (
    <header className="h-12 sm:h-14 md:h-16 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm flex items-center px-2 sm:px-4 gap-1 sm:gap-2 sticky top-0 z-50">
      {showMenuButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="min-w-0 hidden xs:block">
          <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{t("map")}</h1>
        </div>
      </div>

      {wishlistMode && (
        <div className="flex items-center gap-2 bg-primary/10 px-2 sm:px-3 py-1.5 rounded-md">
          <span className="text-xs sm:text-sm font-medium text-primary">
            Режим вишлиста
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExitWishlistMode}
            className="h-6 w-6 hover:bg-primary/20"
          >
            <X className="h-3 w-3 text-primary" />
          </Button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* Install PWA Button (desktop only) */}
        <div className="hidden sm:block">
          <InstallPWAButton />
        </div>
        
        {/* Push Notifications (available on all devices) */}
        <div>
          <PushNotificationButton />
        </div>
        
        {/* My Location Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onMyLocation}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title="Где я"
        >
          <Navigation className="h-4 w-4" />
        </Button>

        {/* Donation Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDonationDialog(true)}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title={language === "sr" ? "Подржите пројекат" : language === "ru" ? "Поддержите проект" : "Support project"}
        >
          <Heart className="h-4 w-4 text-primary" />
        </Button>
        
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 z-[999] bg-popover border-border">
            <DropdownMenuItem onClick={() => setLanguage("sr")} className="cursor-pointer">
              Српски
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("ru")} className="cursor-pointer">
              Русский
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("en")} className="cursor-pointer">
              English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Country selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 max-h-[300px] overflow-y-auto z-[999] bg-popover border-border">
            {countries.map((country) => (
              <DropdownMenuItem 
                key={country.id}
                onClick={() => handleCountryChange(country.id)}
                className="cursor-pointer"
              >
                {getCountryName(country)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* City selector */}
        {cities.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <MapPinned className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 max-h-[300px] overflow-y-auto z-[999] bg-popover border-border">
              {cities.map((city) => (
                <DropdownMenuItem 
                  key={city.id}
                  onClick={() => onCityChange(city.id)}
                  className="cursor-pointer"
                >
                  {getCityName(city)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Tours dropdown */}
        {selectedCity && availableTours.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={activeTour ? "default" : "ghost"} 
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <Route className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto z-[999] bg-popover border-border">
              <DropdownMenuItem 
                onClick={() => {
                  if (!user) {
                    setShowRegisterDialog(true);
                  } else {
                    onTourSelect(null);
                  }
                }} 
                className="cursor-pointer"
              >
                <span className="font-medium">{t("allPlaces")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {availableTours.map((tour) => (
                <DropdownMenuItem
                  key={tour.id}
                  onClick={() => {
                    if (!user) {
                      setShowRegisterDialog(true);
                    } else {
                      onTourSelect(tour);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="truncate">{tour.name}</span>
                    {tour.price === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        FREE
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <UserIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[999] bg-popover border-border">
              <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>{t("personalAccount")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/tours")} className="cursor-pointer">
                <Route className="mr-2 h-4 w-4" />
                <span>{t("tours")}</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("adminPanel")}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("signOut")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                <UserIcon className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{language === "sr" ? "Улогуј се" : language === "ru" ? "Войти" : "Sign In"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[999] bg-popover border-border">
              <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>{language === "sr" ? "Улогуј се" : language === "ru" ? "Войти" : "Sign In"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRegisterDialog(true)} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>{language === "sr" ? "Зашто се регистровати?" : language === "ru" ? "Зачем регистрироваться?" : "Why register?"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <RegisterBenefitsDialog 
        open={showRegisterDialog} 
        onOpenChange={setShowRegisterDialog}
      />
      
      <DonationDialog
        open={showDonationDialog}
        onOpenChange={setShowDonationDialog}
      />
    </header>
  );
};
