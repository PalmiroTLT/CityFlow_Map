import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

interface WishlistViewerDialogProps {
  placeId: string | null;
  placeName: string;
  onClose: () => void;
}

interface WishlistUser {
  id: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

export const WishlistViewerDialog = ({ placeId, placeName, onClose }: WishlistViewerDialogProps) => {
  const [users, setUsers] = useState<WishlistUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (placeId) {
      fetchWishlistUsers();
    }
  }, [placeId]);

  const fetchWishlistUsers = async () => {
    if (!placeId) return;

    setLoading(true);
    
    // Get user_places entries for this place
    const { data: userPlaces, error: userPlacesError } = await supabase
      .from("user_places")
      .select("id, created_at, user_id")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (userPlacesError || !userPlaces) {
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const userIds = userPlaces.map(up => up.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    // Combine data
    const enrichedUsers: WishlistUser[] = userPlaces.map(up => {
      const profile = profiles?.find(p => p.id === up.user_id);
      return {
        id: up.id,
        created_at: up.created_at,
        profiles: profile || null,
      };
    });

    setUsers(enrichedUsers);
    setLoading(false);
  };

  return (
    <Dialog open={!!placeId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Хотят посетить: {placeName}</span>
            <Badge variant="secondary">{users.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-sm">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Пока никто не добавил это место в список желаний</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-start gap-3 p-3 border rounded-sm hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {user.profiles?.full_name || "Без имени"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.profiles?.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Добавлено: {format(new Date(user.created_at), "dd.MM.yyyy HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
