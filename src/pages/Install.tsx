import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("installApp") || "Установить приложение"}</CardTitle>
          <CardDescription>
            {t("installDescription") || "Установите приложение на свой телефон для быстрого доступа"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-secondary mx-auto" />
              <p className="text-lg font-medium text-foreground">
                {t("alreadyInstalled") || "Приложение уже установлено!"}
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                {t("openApp") || "Открыть приложение"}
              </Button>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstallClick} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              {t("install") || "Установить"}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t("installInstructions") || "Чтобы установить приложение:"}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-bold">iOS:</span>
                  <span className="text-muted-foreground">
                    Safari → Поделиться → "На экран Домой"
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold">Android:</span>
                  <span className="text-muted-foreground">
                    Chrome → Меню → "Установить приложение"
                  </span>
                </div>
              </div>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                {t("backToMap") || "Вернуться на карту"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
