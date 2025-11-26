import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CheckCircle2, Heart, ShoppingBag, MapPin, Star, Trophy } from "lucide-react";

interface RegisterBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegisterBenefitsDialog = ({ open, onOpenChange }: RegisterBenefitsDialogProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const benefits = [
    {
      icon: ShoppingBag,
      title: {
        sr: "Куповина тура",
        ru: "Покупка туров",
        en: "Purchase Tours"
      },
      description: {
        sr: "Приступите готовим турама и истражујте град као локалац",
        ru: "Получите доступ к готовым турам и исследуйте город как местный житель",
        en: "Access ready-made tours and explore the city like a local"
      }
    },
    {
      icon: Heart,
      title: {
        sr: "Листа жеља",
        ru: "Список желаний",
        en: "Wishlist"
      },
      description: {
        sr: "Сачувајте омиљена места и планирајте своје посете",
        ru: "Сохраняйте любимые места и планируйте свои визиты",
        en: "Save your favorite places and plan your visits"
      }
    },
    {
      icon: MapPin,
      title: {
        sr: "Своја места",
        ru: "Свои места",
        en: "Your Places"
      },
      description: {
        sr: "Додајте своја места и промовишите свој бизнис",
        ru: "Добавляйте свои места и продвигайте свой бизнес",
        en: "Add your places and promote your business"
      }
    },
    {
      icon: Star,
      title: {
        sr: "Премијум статус",
        ru: "Премиум статус",
        en: "Premium Status"
      },
      description: {
        sr: "Истакните своја места са премијум статусом",
        ru: "Выделите свои места премиум статусом",
        en: "Highlight your places with premium status"
      }
    },
    {
      icon: Trophy,
      title: {
        sr: "Статистика",
        ru: "Статистика",
        en: "Statistics"
      },
      description: {
        sr: "Пратите посећеност и популарност својих места",
        ru: "Отслеживайте посещаемость и популярность ваших мест",
        en: "Track visits and popularity of your places"
      }
    }
  ];

  const getTitle = () => {
    switch (language) {
      case "sr": return "Региструјте се и добијте више могућности";
      case "ru": return "Зарегистрируйтесь и получите больше возможностей";
      case "en": return "Register and get more features";
      default: return "Региструјте се и добијте више могућности";
    }
  };

  const getDescription = () => {
    switch (language) {
      case "sr": return "Отворите све функције и искористите све предности наше платформе";
      case "ru": return "Откройте все функции и воспользуйтесь всеми преимуществами нашей платформы";
      case "en": return "Unlock all features and take advantage of our platform";
      default: return "Отворите све функције и искористите све предности наше платформе";
    }
  };

  const getRegisterButtonText = () => {
    switch (language) {
      case "sr": return "Региструј се";
      case "ru": return "Зарегистрироваться";
      case "en": return "Register";
      default: return "Региструј се";
    }
  };

  const getLoginButtonText = () => {
    switch (language) {
      case "sr": return "Већ имам налог";
      case "ru": return "У меня уже есть аккаунт";
      case "en": return "I already have an account";
      default: return "Већ имам налог";
    }
  };

  const handleRegister = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    {benefit.title[language]}
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description[language]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleRegister}
            className="flex-1 h-12 text-base font-semibold"
          >
            {getRegisterButtonText()}
          </Button>
          <Button 
            onClick={handleRegister}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            {getLoginButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
