import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Copy, Heart } from "lucide-react";
import { toast } from "sonner";

interface DonationContent {
  welcome_title_sr: string;
  welcome_title_ru: string;
  welcome_title_en: string;
  welcome_description_sr: string;
  welcome_description_ru: string;
  welcome_description_en: string;
  donation_title_sr: string;
  donation_title_ru: string;
  donation_title_en: string;
  donation_description_sr: string;
  donation_description_ru: string;
  donation_description_en: string;
  donation_wallet_address: string | null;
  donation_qr_code_url: string | null;
}

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<DonationContent | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      fetchContent();
      setOpen(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase
      .from("donation_content")
      .select("*")
      .single();
    if (data) setContent(data);
  };

  const getTitle = () => {
    if (!content) return "";
    if (language === "sr") return content.welcome_title_sr;
    if (language === "ru") return content.welcome_title_ru;
    return content.welcome_title_en;
  };

  const getDescription = () => {
    if (!content) return "";
    if (language === "sr") return content.welcome_description_sr;
    if (language === "ru") return content.welcome_description_ru;
    return content.welcome_description_en;
  };

  const getDonationTitle = () => {
    if (!content) return "";
    if (language === "sr") return content.donation_title_sr;
    if (language === "ru") return content.donation_title_ru;
    return content.donation_title_en;
  };

  const getDonationDescription = () => {
    if (!content) return "";
    if (language === "sr") return content.donation_description_sr;
    if (language === "ru") return content.donation_description_ru;
    return content.donation_description_en;
  };

  const copyWalletAddress = () => {
    if (content?.donation_wallet_address) {
      navigator.clipboard.writeText(content.donation_wallet_address);
      toast.success(language === "sr" ? "Адреса копирана" : language === "ru" ? "Адрес скопирован" : "Address copied");
    }
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-8">{getTitle()}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-5 h-5 fill-current" />
              <h3 className="text-xl font-bold">{getDonationTitle()}</h3>
            </div>
            
            <p className="text-muted-foreground">{getDonationDescription()}</p>

            {content.donation_qr_code_url && (
              <div className="flex justify-center py-4">
                <img 
                  src={content.donation_qr_code_url} 
                  alt="Donation QR Code"
                  className="w-48 h-48 border-2 border-border rounded-lg"
                />
              </div>
            )}

            {content.donation_wallet_address && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === "sr" ? "Адреса новчаника:" : language === "ru" ? "Адрес кошелька:" : "Wallet address:"}
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                    {content.donation_wallet_address}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyWalletAddress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={() => setOpen(false)} className="w-full mt-4">
              {language === "sr" ? "Затвори" : language === "ru" ? "Закрыть" : "Close"}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};