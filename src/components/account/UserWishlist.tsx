import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Trash2, ExternalLink, Map } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Database } from "@/integrations/supabase/types";

type Place = Database["public"]["Tables"]["places"]["Row"];

type UserPlace = {
  id: string;
  created_at: string;
  place: Place;
};

export const UserWishlist = () => {
  const navigate = useNavigate();
  const [userPlaces, setUserPlaces] = useState<UserPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    fetchUserPlaces();
  }, []);

  const fetchUserPlaces = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userPlacesData } = await supabase
      .from("user_places")
      .select("id, created_at, place_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!userPlacesData) {
      setLoading(false);
      return;
    }

    // Get places details
    const placeIds = userPlacesData.map(up => up.place_id);
    if (placeIds.length === 0) {
      setUserPlaces([]);
      setLoading(false);
      return;
    }

    const { data: places } = await supabase
      .from("places")
      .select("*")
      .in("id", placeIds);

    const enrichedUserPlaces: UserPlace[] = userPlacesData.map(up => {
      const place = places?.find(p => p.id === up.place_id);
      return {
        id: up.id,
        created_at: up.created_at,
        place: place!,
      };
    }).filter(up => up.place);

    setUserPlaces(enrichedUserPlaces);
    setLoading(false);
  };

  const removeFromWishlist = async (id: string) => {
    const { error } = await supabase
      .from("user_places")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления из списка");
      return;
    }

    toast.success("Удалено из списка желаний");
    fetchUserPlaces();
  };

  const getPlaceName = (place: Place) => {
    if (language === "en" && place.name_en) return place.name_en;
    if (language === "sr" && place.name_sr) return place.name_sr;
    return place.name;
  };

  const getPlaceDescription = (place: Place) => {
    if (language === "en" && place.description_en) return place.description_en;
    if (language === "sr" && place.description_sr) return place.description_sr;
    return place.description;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Хочу посетить
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Хочу посетить
            <Badge variant="secondary">{userPlaces.length}</Badge>
          </CardTitle>
          {userPlaces.length > 0 && (
            <Button
              onClick={() => navigate("/?wishlistMode=true")}
              variant="default"
              size="sm"
            >
              <Map className="w-4 h-4 mr-2" />
              Посмотреть все на карте
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {userPlaces.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Вы пока не добавили места в список желаний</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userPlaces.map((userPlace) => (
              <Card 
                key={userPlace.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/?placeId=${userPlace.place.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">
                        {getPlaceName(userPlace.place)}
                      </h3>
                      {getPlaceDescription(userPlace.place) && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {getPlaceDescription(userPlace.place)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {userPlace.place.latitude.toFixed(4)}, {userPlace.place.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {userPlace.place.google_maps_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(userPlace.place.google_maps_url!, "_blank");
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(userPlace.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
