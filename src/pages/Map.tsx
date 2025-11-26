import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapView } from "@/components/map/MapContainer";
import { Sidebar } from "@/components/map/Sidebar";
import { Header } from "@/components/map/Header";
import { PlacePage } from "@/components/place-page/PlacePage";
import { TourGuidePage } from "@/components/tour-guide/TourGuidePage";
import { InitialSetup } from "@/components/InitialSetup";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type Tour = Database["public"]["Tables"]["tours"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

const Map = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tourId = searchParams.get("tour");
  const placeIdParam = searchParams.get("placeId");
  const wishlistModeParam = searchParams.get("wishlistMode");
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10000);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewingPlacePage, setViewingPlacePage] = useState<Place | null>(null);
  const [viewingTourGuide, setViewingTourGuide] = useState<boolean>(false);
  const [wishlistMode, setWishlistMode] = useState<boolean>(false);
  const [userWishlistPlaceIds, setUserWishlistPlaceIds] = useState<string[]>([]);
  const [flyToUserLocationTrigger, setFlyToUserLocationTrigger] = useState<number>(0);
  const [previousSelectedPlace, setPreviousSelectedPlace] = useState<Place | null>(null);
  const [skipMapAnimation, setSkipMapAnimation] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          checkAdminStatus(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  useEffect(() => {
    checkInitialSetup();
    getUserLocation();
  }, []);

  // CRITICAL: Refresh places when returning to Map page from other pages (like Account)
  useEffect(() => {
    if (selectedCity) {
      console.log('Map mounted or city changed, refreshing places...');
      fetchPlaces();
    }
  }, [selectedCity]);

  // Also refresh when page becomes visible (user switches browser tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedCity) {
        console.log('Page visible, refreshing places...');
        fetchPlaces();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedCity]);

  useEffect(() => {
    if (selectedCity) {
      fetchCategories();
      fetchPlaces();
      fetchTours();
    }
  }, [selectedCity]);

  useEffect(() => {
    if (tourId) {
      loadTour(tourId);
    }
  }, [tourId]);

  useEffect(() => {
    if (wishlistModeParam === "true") {
      setWishlistMode(true);
      fetchUserWishlist();
    } else {
      setWishlistMode(false);
    }
  }, [wishlistModeParam]);

  useEffect(() => {
    if (placeIdParam) {
      handlePlaceNavigation(placeIdParam);
    }
  }, [placeIdParam]);

  const handlePlaceNavigation = async (placeId: string) => {
    try {
      // Fetch the place to get its city
      const { data: place, error } = await supabase
        .from("places")
        .select("*, cities(*)")
        .eq("id", placeId)
        .single();

      if (error || !place) {
        toast.error("Место не найдено");
        return;
      }

      // If place is in a different city, load that city
      if (place.city_id && (!selectedCity || selectedCity.id !== place.city_id)) {
        await handleCityChange(place.city_id);
      }

      // Select the place and open sidebar
      setSelectedPlace(placeId);
      setSidebarOpen(true);
    } catch (error) {
      console.error("Error navigating to place:", error);
      toast.error("Ошибка при переходе к месту");
    }
  };

  const checkInitialSetup = async () => {
    // Try to get city from user profile first
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("city_id, country_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.city_id) {
        await loadCity(profile.city_id);
        localStorage.setItem("selectedCity", profile.city_id);
        if (profile.country_id) {
          localStorage.setItem("selectedCountry", profile.country_id);
        }
        setShowInitialSetup(false);
        return;
      }
    }
    
    // Fallback to localStorage
    const savedCityId = localStorage.getItem("selectedCity");
    if (savedCityId) {
      await loadCity(savedCityId);
      setShowInitialSetup(false);
    } else {
      setShowInitialSetup(true);
    }
  };

  const loadCity = async (cityId: string) => {
    const { data: city } = await supabase
      .from("cities")
      .select("*")
      .eq("id", cityId)
      .single();

    if (city) {
      setSelectedCity(city);
    }
  };

  const handleCityChange = async (cityId: string) => {
    await loadCity(cityId);
    localStorage.setItem("selectedCity", cityId);
    
    // Save to user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get city's country_id
      const { data: city } = await supabase
        .from("cities")
        .select("country_id")
        .eq("id", cityId)
        .single();
      
      if (city) {
        localStorage.setItem("selectedCountry", city.country_id);
        await supabase
          .from("profiles")
          .update({
            city_id: cityId,
            country_id: city.country_id,
          })
          .eq("id", user.id);
      }
    }
    
    setActiveTour(null);
    setSelectedPlace(null);
  };

  const handleInitialSetupComplete = async (cityId: string) => {
    await loadCity(cityId);
    setShowInitialSetup(false);
  };

  const handlePlaceClick = (placeId: string) => {
    setSelectedPlace(placeId);
    setSidebarOpen(true);
    setPreviousSelectedPlace(null);
    setSkipMapAnimation(false);
  };

  const handleViewPlace = (place: Place) => {
    const currentPlace = places.find(p => p.id === selectedPlace);
    setPreviousSelectedPlace(currentPlace || null);
    setViewingPlacePage(place);
    setSidebarOpen(false);
  };

  const handleBackFromPlace = () => {
    setViewingPlacePage(null);
    if (previousSelectedPlace) {
      setSkipMapAnimation(true);
      setSelectedPlace(previousSelectedPlace.id);
      setSidebarOpen(true);
      setTimeout(() => setSkipMapAnimation(false), 100);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          toast.success("Геолокация включена");
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Не удалось получить ваше местоположение";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Разрешите доступ к геолокации в настройках браузера";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Информация о местоположении недоступна";
              break;
            case error.TIMEOUT:
              errorMessage = "Время ожидания геолокации истекло";
              break;
          }
          
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast.error("Геолокация не поддерживается вашим браузером");
    }
  };

  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Геолокация не поддерживается вашим браузером");
      return;
    }

    toast.info(t("detectingLocation"));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Устанавливаем координаты пользователя и увеличиваем счетчик для полета к ним
        setUserLocation([latitude, longitude]);
        setFlyToUserLocationTrigger(prev => prev + 1);
        toast.success("Геолокация определена");
      },
      async (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Не удалось получить доступ к вашему местоположению";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Разрешите доступ к геолокации в настройках браузера";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Информация о местоположении недоступна";
            break;
          case error.TIMEOUT:
            errorMessage = "Время ожидания геолокации истекло";
            break;
        }
        
        toast.error(errorMessage);
        
        // Если GPS не работает, пытаемся определить город
        // Получаем все города и страны из базы
        const { data: allCities, error: citiesError } = await supabase
          .from("cities")
          .select("*, countries!inner(*)");

        if (citiesError || !allCities || allCities.length === 0) {
          toast.error(t("countryNotInList"));
          return;
        }

        // Показываем пользователю выбор города вместо автоопределения
        toast.info("Пожалуйста, выберите город вручную");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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
    setSelectedCategories(data?.map(c => c.id) || []);
  };

  const fetchPlaces = async () => {
    if (!selectedCity) return;
    
    let query = supabase
      .from("places")
      .select("*")
      .eq("city_id", selectedCity.id);
    
    // Обычные пользователи не видят скрытые места
    if (!isAdmin) {
      query = query.eq("is_hidden", false);
    }
    
    const { data, error } = await query;

    if (error) {
      toast.error("Ошибка загрузки мест");
      return;
    }

    setPlaces(data || []);
  };

  const fetchTours = async () => {
    if (!selectedCity) return;
    
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .eq("city_id", selectedCity.id)
      .order("display_order");

    if (error) {
      toast.error("Ошибка загрузки туров");
      return;
    }

    setTours(data || []);
  };

  const fetchUserWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_places")
      .select("place_id")
      .eq("user_id", user.id);

    if (data) {
      setUserWishlistPlaceIds(data.map(up => up.place_id));
    }
  };

  const handleExitWishlistMode = () => {
    setWishlistMode(false);
    setUserWishlistPlaceIds([]);
    navigate("/");
  };

  const loadTour = async (id: string) => {
    const { data: tour } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();

    if (tour) {
      setActiveTour(tour);
      
      const { data: tourPlaces } = await supabase
        .from("tour_places")
        .select("place_id")
        .eq("tour_id", id);

      if (tourPlaces) {
        const placeIds = tourPlaces.map(tp => tp.place_id);
        const { data: places } = await supabase
          .from("places")
          .select("*")
          .in("id", placeIds)
          .eq("is_hidden", false); // Only show visible places
        
        if (places) {
          setPlaces(places);
          const categoryIds = [...new Set(places.map(p => p.category_id).filter(Boolean))];
          setSelectedCategories(categoryIds as string[]);
        }
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredPlaces = places.filter(place => {
    // If in wishlist mode, only show wishlist places
    if (wishlistMode && userWishlistPlaceIds.length > 0) {
      if (!userWishlistPlaceIds.includes(place.id)) {
        return false;
      }
    }

    if (!place.category_id || !selectedCategories.includes(place.category_id)) {
      return false;
    }

    if (userLocation && maxDistance < 10000) {
      const distance = getDistance(
        userLocation[0],
        userLocation[1],
        place.latitude,
        place.longitude
      );
      if (distance > maxDistance) {
        return false;
      }
    }

    return true;
  });

  if (showInitialSetup) {
    return null;
  }

  // Show initial setup if needed
  if (showInitialSetup) {
    return <InitialSetup onComplete={handleInitialSetupComplete} />;
  }

  // If no city is selected yet, show loading
  if (!selectedCity) {
    return null;
  }

  // If viewing a tour guide, show it instead of the map
  if (viewingTourGuide && activeTour) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TourGuidePage
          tour={activeTour}
          onBack={() => setViewingTourGuide(false)}
          onNavigateToPlace={(placeId) => {
            setViewingTourGuide(false);
            setSelectedPlace(placeId);
            setSidebarOpen(true);
          }}
        />
      </div>
    );
  }

  // If viewing a place page, show it instead of the map
  if (viewingPlacePage) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <PlacePage
          place={viewingPlacePage}
          onBack={handleBackFromPlace}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        tours={tours}
        activeTour={activeTour}
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        onTourSelect={(tour) => {
          if (tour) {
            navigate(`/?tour=${tour.id}`);
          } else {
            navigate("/");
            setActiveTour(null);
            fetchPlaces();
            fetchCategories();
          }
        }}
        onMenuClick={() => setSidebarOpen(true)}
        showMenuButton={isMobile}
        onMyLocation={handleMyLocation}
        wishlistMode={wishlistMode}
        onExitWishlistMode={handleExitWishlistMode}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          categories={categories}
          places={filteredPlaces}
          selectedCategories={selectedCategories}
          selectedPlace={selectedPlace}
          maxDistance={maxDistance}
          userLocation={userLocation}
          isMobile={isMobile}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          onCategoryToggle={(categoryId) => {
            setSelectedCategories(prev =>
              prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
            );
          }}
          onPlaceSelect={handlePlaceClick}
          onDistanceChange={setMaxDistance}
          onPlacePageOpen={handleViewPlace}
          onTourGuideOpen={() => setViewingTourGuide(true)}
          showTourGuideButton={!!activeTour}
        />
        
        <MapView
          places={filteredPlaces}
          categories={categories}
          selectedPlace={selectedPlace}
          onPlaceSelect={handlePlaceClick}
          userLocation={userLocation}
          onPlacePageOpen={handleViewPlace}
          cityCenter={[selectedCity.latitude, selectedCity.longitude]}
          cityZoom={selectedCity.zoom_level}
          userId={user?.id || null}
          flyToUserLocationTrigger={flyToUserLocationTrigger}
          skipAnimation={skipMapAnimation}
        />
      </div>

      <WelcomeDialog />
    </div>
  );
};

export default Map;
