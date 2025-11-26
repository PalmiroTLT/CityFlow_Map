import { useState } from "react";
import { Share2, MessageCircle, Send, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface SharePlaceButtonProps {
  place: Place;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const SharePlaceButton = ({
  place,
  variant = "outline",
  size = "sm",
  className = "",
}: SharePlaceButtonProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const shareUrl = `${window.location.origin}?placeId=${place.id}`;
  const shareTitle = place.name;
  const shareText = place.description || `Посмотрите это место: ${place.name}`;

  const handleShare = async () => {
    // Try native share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        // Track successful native share
        await trackShare("native");
        toast.success("Место успешно отправлено");
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          setShowShareDialog(true);
        }
      }
    } else {
      // Fallback to custom share dialog
      setShowShareDialog(true);
    }
  };

  const trackShare = async (platform: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("share_statistics").insert({
        place_id: place.id,
        platform,
        user_id: session?.user?.id || null,
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  const shareToWhatsApp = () => {
    trackShare("whatsapp");
    const text = encodeURIComponent(`${shareTitle}\n${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareDialog(false);
  };

  const shareToTelegram = () => {
    trackShare("telegram");
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    setShowShareDialog(false);
  };

  const shareToFacebook = () => {
    trackShare("facebook");
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    setShowShareDialog(false);
  };

  const copyToClipboard = () => {
    trackShare("link");
    navigator.clipboard.writeText(shareUrl);
    toast.success("Ссылка скопирована в буфер обмена");
    setShowShareDialog(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Поделиться
      </Button>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поделиться местом</DialogTitle>
            <DialogDescription>
              {place.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={shareToWhatsApp}
            >
              <MessageCircle className="w-6 h-6 text-green-600" />
              <span className="text-sm">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={shareToTelegram}
            >
              <Send className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={shareToFacebook}
            >
              <Facebook className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={copyToClipboard}
            >
              <Share2 className="w-6 h-6" />
              <span className="text-sm">Копировать ссылку</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
