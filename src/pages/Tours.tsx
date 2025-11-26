import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, MapPin, Check, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { RegisterBenefitsDialog } from "@/components/RegisterBenefitsDialog";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourWithCityAndCountry extends Tour {
  cities?: { 
    name_sr: string; 
    name_en: string; 
    name_ru: string;
    id: string;
    countries?: {
      name_sr: string;
      name_en: string;
      name_ru: string;
      id: string;
    } | null;
  } | null;
}

interface GroupedTours {
  [countryId: string]: {
    countryName: { sr: string; en: string; ru: string };
    cities: {
      [cityId: string]: {
        cityName: { sr: string; en: string; ru: string };
        tours: TourWithCityAndCountry[];
      };
    };
  };
}

export default function Tours() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [tours, setTours] = useState<TourWithCityAndCountry[]>([]);
  const [groupedTours, setGroupedTours] = useState<GroupedTours>({});
  const [purchasedTours, setPurchasedTours] = useState<string[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourWithCityAndCountry | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [purchasingTourId, setPurchasingTourId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setUserId(session.user.id);
      await fetchPurchasedTours(session.user.id);
    }

    await fetchTours();
    setLoading(false);
  };

  const fetchTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select(`
        *,
        cities (
          id,
          name_sr,
          name_en,
          name_ru,
          countries (
            id,
            name_sr,
            name_en,
            name_ru
          )
        )
      `)
      .eq("is_active", true)
      .gt("price", 0)
      .order("display_order");
    
    if (data) {
      setTours(data);
      groupToursByCountryAndCity(data);
    }
  };

  const groupToursByCountryAndCity = (tours: TourWithCityAndCountry[]) => {
    const grouped: GroupedTours = {};

    tours.forEach(tour => {
      if (!tour.cities || !tour.cities.countries) return;

      const countryId = tour.cities.countries.id;
      const cityId = tour.cities.id;

      if (!grouped[countryId]) {
        grouped[countryId] = {
          countryName: {
            sr: tour.cities.countries.name_sr,
            en: tour.cities.countries.name_en,
            ru: tour.cities.countries.name_ru
          },
          cities: {}
        };
      }

      if (!grouped[countryId].cities[cityId]) {
        grouped[countryId].cities[cityId] = {
          cityName: {
            sr: tour.cities.name_sr,
            en: tour.cities.name_en,
            ru: tour.cities.name_ru
          },
          tours: []
        };
      }

      grouped[countryId].cities[cityId].tours.push(tour);
    });

    setGroupedTours(grouped);
  };

  const fetchPurchasedTours = async (userId: string) => {
    const { data } = await supabase
      .from("purchased_tours")
      .select("tour_id")
      .eq("user_id", userId);
    
    setPurchasedTours(data?.map(pt => pt.tour_id) || []);
  };

  const handlePurchase = async (tourId: string, tourPrice: number) => {
    if (!userId) {
      setShowRegisterDialog(true);
      return;
    }

    if (purchasingTourId) return; // Prevent multiple clicks

    try {
      setPurchasingTourId(tourId);
      
      // Check user credits first
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (!profile || profile.credits < tourPrice) {
        setShowInsufficientCredits(true);
        return;
      }

      // Call edge function to purchase tour
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("purchase-tour", {
        body: { tourId },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (error) throw error;

      setPurchasedTours([...purchasedTours, tourId]);
      toast.success(t("tourPurchased"));
      await fetchData(); // Refresh to update credits
    } catch (error: any) {
      console.error("Error purchasing tour:", error);
      toast.error(error.message || t("errorPurchasingTour"));
    } finally {
      setPurchasingTourId(null);
    }
  };

  const getTourName = (tour: TourWithCityAndCountry) => {
    if (language === "en" && tour.name_en) return tour.name_en;
    return tour.name;
  };

  const getTourDescription = (tour: TourWithCityAndCountry) => {
    if (language === "en" && tour.description_en) return tour.description_en;
    return tour.description || "";
  };

  const getCityName = (tour: TourWithCityAndCountry) => {
    if (!tour.cities) return "";
    if (language === "en") return tour.cities.name_en;
    if (language === "ru") return tour.cities.name_ru;
    return tour.cities.name_sr;
  };

  const getCountryName = (countryNames: { sr: string; en: string; ru: string }) => {
    if (language === "en") return countryNames.en;
    if (language === "ru") return countryNames.ru;
    return countryNames.sr;
  };

  const getCityNameFromGroup = (cityNames: { sr: string; en: string; ru: string }) => {
    if (language === "en") return cityNames.en;
    if (language === "ru") return cityNames.ru;
    return cityNames.sr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("map")}</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "sr" ? "Туре" : language === "ru" ? "Туры" : "Tours"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "sr" ? "Изаберите туру за истраживање" : language === "ru" ? "Выберите тур для исследования" : "Choose a tour to explore"}
            </p>
          </div>
        </div>

        {!userId && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium">
                    {language === "sr" 
                      ? "За куповину и коришћење тура морате се регистровати" 
                      : language === "ru" 
                      ? "Для покупки и использования туров необходимо зарегистрироваться" 
                      : "To purchase and use tours you must register"}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={() => navigate("/auth")} className="flex-1 sm:flex-none">
                    {language === "sr" ? "Регистрација" : language === "ru" ? "Регистрация" : "Sign Up"}
                  </Button>
                  <Button 
                    onClick={() => setShowRegisterDialog(true)} 
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    {language === "sr" ? "Сазнај више" : language === "ru" ? "Узнать больше" : "Learn More"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedTours)}>
          {Object.entries(groupedTours).map(([countryId, countryData]) => (
            <AccordionItem 
              key={countryId} 
              value={countryId}
              className="border border-border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    {getCountryName(countryData.countryName)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-8 mt-4">
                  {Object.entries(countryData.cities).map(([cityId, cityData]) => (
                    <div key={cityId}>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-secondary" />
                        <h3 className="text-xl font-semibold text-foreground">
                          {getCityNameFromGroup(cityData.cityName)}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({cityData.tours.length} {language === "sr" ? "тура" : language === "ru" ? "туров" : "tours"})
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cityData.tours.map((tour) => {
                          const isPurchased = purchasedTours.includes(tour.id);
                          const isFree = !tour.price || tour.price === 0;

                          return (
                            <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                              {tour.image_url && (
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                  <img 
                                    src={tour.image_url} 
                                    alt={getTourName(tour)}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                  <CardTitle className="text-xl">{getTourName(tour)}</CardTitle>
                                  {isPurchased && (
                                    <Badge variant="default" className="bg-green-500">
                                      <Check className="w-3 h-3 mr-1" />
                                      {language === "sr" ? "Купљено" : language === "ru" ? "Куплено" : "Owned"}
                                    </Badge>
                                  )}
                                </div>
                                
                                <CardDescription className="line-clamp-2">
                                  {getTourDescription(tour)}
                                </CardDescription>
                              </CardHeader>

                              <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold">
                                    {isFree 
                                      ? (language === "sr" ? "Бесплатно" : language === "ru" ? "Бесплатно" : "Free")
                                      : `${tour.price} ${language === "sr" ? "кредита" : language === "ru" ? "кредитов" : "credits"}`
                                    }
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setSelectedTour(tour)}
                                  >
                                    {language === "sr" ? "Шта је укључено" : language === "ru" ? "Что входит" : "What's included"}
                                  </Button>
                                  
                                  {!isPurchased && (
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handlePurchase(tour.id, tour.price || 10)}
                                      disabled={purchasingTourId === tour.id}
                                    >
                                      {purchasingTourId === tour.id 
                                        ? (language === "sr" ? "Куповина..." : language === "ru" ? "Покупка..." : "Purchasing...") 
                                        : (language === "sr" ? "Купити" : language === "ru" ? "Купить" : "Purchase")
                                      }
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Tour Details Dialog */}
      <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedTour && getTourName(selectedTour)}
            </DialogTitle>
            <DialogDescription>
              {selectedTour && getTourDescription(selectedTour)}
            </DialogDescription>
          </DialogHeader>

          {selectedTour?.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img 
                src={selectedTour.image_url} 
                alt={getTourName(selectedTour)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            {selectedTour?.tour_content && typeof selectedTour.tour_content === 'object' && (
              <>
                {(selectedTour.tour_content as any).includes && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === "sr" ? "Шта је укључено:" : language === "ru" ? "Что входит:" : "What's included:"}
                    </h3>
                    <ul className="space-y-2">
                      {((selectedTour.tour_content as any).includes as string[]).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedTour.tour_content as any).details && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === "sr" ? "Детаљи:" : language === "ru" ? "Детали:" : "Details:"}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {(selectedTour.tour_content as any).details}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient Credits Dialog */}
      <Dialog open={showInsufficientCredits} onOpenChange={setShowInsufficientCredits}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("insufficientCreditsTitle")}</DialogTitle>
            <DialogDescription>
              {t("insufficientCreditsMessage")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowInsufficientCredits(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowInsufficientCredits(false);
                toast.info(t("topUpComingSoon"));
              }}
            >
              {t("topUpBalance")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Benefits Dialog */}
      <RegisterBenefitsDialog 
        open={showRegisterDialog} 
        onOpenChange={setShowRegisterDialog}
      />
    </div>
  );
}
