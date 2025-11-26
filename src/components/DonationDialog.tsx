import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getLocalizedField } from "@/lib/i18n/languageUtils";
import { Copy, Heart } from "lucide-react";
import { toast } from "sonner";


interface DonationContent {
  donation_title_sr: string;
  donation_title_ru: string;
  donation_title_en: string;
  donation_description_sr: string;
  donation_description_ru: string;
  donation_description_en: string;
  donation_wallet_address: string | null;
  donation_qr_code_url: string | null;
}

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [content, setContent] = useState<DonationContent | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (open) {
      fetchContent();
    }
  }, [open]);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("donation_content")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error loading donation content:", error);
      toast.error(
        language === "sr"
          ? "Грешка при учитавању података о донацији"
          : language === "ru"
          ? "Ошибка при загрузке данных о пожертвовании"
          : "Error loading donation information"
      );
      return;
    }

    if (!data) {
      toast.error(
        language === "sr"
          ? "Садржај донације није пронађен"
          : language === "ru"
          ? "Содержимое пожертвования не найдено"
          : "Donation content not found"
      );
      return;
    }

    setContent(data);
  };

  const title = getLocalizedField(content, "donation_title", language, "");
  const description = getLocalizedField(content, "donation_description", language, "");

  const copyWalletAddress = () => {
    if (content?.donation_wallet_address) {
      navigator.clipboard.writeText(content.donation_wallet_address);
      toast.success(language === "sr" ? "Адреса копирана" : language === "ru" ? "Адрес скопирован" : "Address copied");
    }
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pr-8">
            <Heart className="w-6 h-6 fill-current" />
            <DialogTitle className="text-2xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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

          <Button onClick={() => onOpenChange(false)} className="w-full mt-4">
            {language === "sr" ? "Затвори" : language === "ru" ? "Закрыть" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};