import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourDetailsProps {
  tour: Tour;
  user: User | null;
  purchasedTourIds: string[];
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export const TourDetails = ({ tour, user, purchasedTourIds, onClose, onPurchaseSuccess }: TourDetailsProps) => {
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isPurchased = purchasedTourIds.includes(tour.id);

  const handlePurchase = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsPurchasing(true);
    const { data, error } = await supabase.rpc('purchase_tour', { tour_id_input: tour.id });

    if (error || !data.success) {
      toast.error(data?.message || "Ошибка при покупке тура.");
      console.error("Purchase error:", error);
    } else {
      toast.success(data.message);
      onPurchaseSuccess(); // Callback to refresh user's purchased tours
    }
    setIsPurchasing(false);
  };

  return (
    <Card className="absolute bottom-4 left-4 w-96 bg-card/80 backdrop-blur-sm z-10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{tour.name}</CardTitle>
            <CardDescription>Информация о туре</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>X</Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{tour.description || "Описание отсутствует."}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-lg font-semibold">{tour.price ?? 0} валюты</p>
        {user ? (
          <Button onClick={handlePurchase} disabled={isPurchased || isPurchasing}>
            {isPurchasing ? "Покупка..." : isPurchased ? "Куплено" : "Купить"}
          </Button>
        ) : (
          <Button onClick={() => navigate("/auth")}>Войти чтобы купить</Button>
        )}
      </CardFooter>
    </Card>
  );
};
