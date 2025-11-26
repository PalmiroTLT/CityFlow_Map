import { useState, useEffect } from "react";
import { useLanguage, Language } from "@/lib/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Country = Database["public"]["Tables"]["countries"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

interface InitialSetupProps {
  onComplete: (cityId: string) => void;
}

export const InitialSetup = ({ onComplete }: InitialSetupProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [step, setStep] = useState<"language" | "location">("language");
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCities(selectedCountry);
    }
  }, [selectedCountry]);

  const fetchCountries = async () => {
    const { data } = await supabase.from("countries").select("*");
    if (data) setCountries(data);
  };

  const fetchCities = async (countryId: string) => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .eq("country_id", countryId);
    if (data) setCities(data);
  };

  const handleLanguageNext = () => {
    setStep("location");
  };

  const handleComplete = async () => {
    // Save to localStorage
    localStorage.setItem("selectedCity", selectedCity);
    localStorage.setItem("selectedCountry", selectedCountry);
    
    // Save to user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          country_id: selectedCountry,
          city_id: selectedCity,
        })
        .eq("id", user.id);
    }
    
    onComplete(selectedCity);
  };

  const getCountryName = (country: Country) => {
    if (language === "sr") return country.name_sr;
    if (language === "ru") return country.name_ru;
    return country.name_en;
  };

  const getCityName = (city: City) => {
    if (language === "sr") return city.name_sr;
    if (language === "ru") return city.name_ru;
    return city.name_en;
  };

  if (step === "language") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t("welcome")}</CardTitle>
            <CardDescription className="text-center">{t("selectLanguage")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {(["sr", "ru", "en"] as Language[]).map((lang) => (
                <Button
                  key={lang}
                  variant={language === lang ? "default" : "outline"}
                  onClick={() => setLanguage(lang)}
                  className="w-full"
                >
                  {lang === "sr" && "Српски"}
                  {lang === "ru" && "Русский"}
                  {lang === "en" && "English"}
                </Button>
              ))}
            </div>
            <Button onClick={handleLanguageNext} className="w-full mt-4">
              {t("continue")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("selectYourCity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("country")}</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {getCountryName(country)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCountry && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("city")}</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {getCityName(city)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleComplete}
            disabled={!selectedCity}
            className="w-full mt-4"
          >
            {t("continue")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
