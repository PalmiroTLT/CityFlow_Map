import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Crown, Smartphone, Globe, Sparkles, TrendingUp, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
            {/* Badge */}
            <div className="mb-6 md:mb-8 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-sm border border-primary/20">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold uppercase text-sm tracking-wide">Новое поколение</span>
            </div>
            
            {/* Main Title */}
            <h1 className="mb-6 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Открой город <br />
              <span className="text-primary">по-новому</span>
            </h1>
            
            <p className="mb-8 text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                variant="default"
                onClick={() => navigate("/map")}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t("startGame")}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Star className="mr-2 h-5 w-5" />
                {t("joinNow")}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-2xl mx-auto">
              {[
                { value: "500+", label: t("placesCount2") },
                { value: "50+", label: t("toursCount") },
                { value: "1000+", label: t("playersCount") },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="p-4 sm:p-6 bg-card border border-border rounded-md hover:shadow-md transition-all"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">
              Возможности
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Все что нужно для идеального путешествия
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: MapPin,
                title: "Интерактивная карта",
                description: "Сотни проверенных мест с подробными описаниями",
              },
              {
                icon: Crown,
                title: "Премиум контент",
                description: "Эксклюзивные локации и детальные путеводители",
              },
              {
                icon: Globe,
                title: "Готовые туры",
                description: "Лучшие маршруты, составленные экспертами",
              },
              {
                icon: Smartphone,
                title: "Мобильное приложение",
                description: "Пользуйтесь картой где угодно со смартфона",
              },
              {
                icon: TrendingUp,
                title: "Для бизнеса",
                description: "Разместите свою точку на карте города",
              },
              {
                icon: Zap,
                title: "Быстро и удобно",
                description: "Молниеносная работа без лишних действий",
              },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border"
              >
                <div className="mb-4 inline-flex p-3 bg-primary/10 text-primary rounded-md">
                  <feature.icon className="h-6 w-6" />
                </div>
                
                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 max-w-4xl mx-auto">
            <div className="p-8 sm:p-12 md:p-16 text-center">
              <div className="mb-6 inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-sm">
                <Crown className="h-5 w-5" />
                <span className="font-bold uppercase text-sm">Premium</span>
              </div>
              
              <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">
                Готовы начать?
              </h2>
              
              <p className="mb-8 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Присоединяйтесь к тысячам путешественников и откройте город заново
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="default"
                  onClick={() => navigate("/map")}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  Начать бесплатно
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  Узнать больше
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 City Explorer. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
