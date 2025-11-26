import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { RegisterBenefitsDialog } from "@/components/RegisterBenefitsDialog";

interface WishlistButtonProps {
  placeId: string;
  userId: string | null;
}

export const WishlistButton = ({ placeId, userId }: WishlistButtonProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  useEffect(() => {
    if (userId) {
      checkWishlistStatus();
    }
  }, [placeId, userId]);

  const checkWishlistStatus = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("user_places")
      .select("id")
      .eq("user_id", userId)
      .eq("place_id", placeId)
      .maybeSingle();

    if (data) {
      setIsInWishlist(true);
      setWishlistId(data.id);
    } else {
      setIsInWishlist(false);
      setWishlistId(null);
    }
  };

  const toggleWishlist = async () => {
    if (!userId) {
      setShowRegisterDialog(true);
      return;
    }

    setLoading(true);

    if (isInWishlist && wishlistId) {
      // Remove from wishlist
      const { error } = await supabase
        .from("user_places")
        .delete()
        .eq("id", wishlistId);

      if (error) {
        toast.error("Ошибка удаления из списка");
      } else {
        toast.success("Удалено из списка желаний");
        setIsInWishlist(false);
        setWishlistId(null);
      }
    } else {
      // Add to wishlist
      const { data, error } = await supabase
        .from("user_places")
        .insert({
          user_id: userId,
          place_id: placeId,
        })
        .select()
        .single();

      if (error) {
        toast.error("Ошибка добавления в список");
      } else {
        toast.success("Добавлено в список желаний");
        setIsInWishlist(true);
        setWishlistId(data.id);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant={isInWishlist ? "default" : "outline"}
        className="w-full justify-start"
        onClick={toggleWishlist}
        disabled={loading}
      >
        <Heart
          className={`w-4 h-4 mr-2 ${isInWishlist ? "fill-current" : ""}`}
        />
        {isInWishlist ? "В избранном" : "Хочу посетить"}
      </Button>

      <RegisterBenefitsDialog 
        open={showRegisterDialog} 
        onOpenChange={setShowRegisterDialog}
      />
    </>
  );
};
