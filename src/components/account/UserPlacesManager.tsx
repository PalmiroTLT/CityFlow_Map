import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Crown, Plus, Loader2, Trash2, Pencil, FileText, Map, BarChart3, Tag } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AddPlaceDialog } from "./AddPlaceDialog";
import { EditPlaceDialog } from "./EditPlaceDialog";
import { PlacePageEditor } from "@/components/place-page/PlacePageEditor";
import { PromoEditor } from "@/components/promotions/PromoEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlacePageStatistics } from "./PlacePageStatistics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Place {
  id: string;
  name: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  cancel_at_period_end?: boolean;
  has_custom_page: boolean | null;
}

interface SubscriptionInfo {
  placeId: string;
  cancelAtPeriodEnd: boolean;
}

interface UserPlacesManagerProps {
  places: Place[];
  credits: number;
  subscriptions: SubscriptionInfo[];
  onRefresh: () => void;
}

export const UserPlacesManager = ({ places, credits, subscriptions, onRefresh }: UserPlacesManagerProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<any>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [pageEditingPlace, setPageEditingPlace] = useState<Place | null>(null);
  const [showStatistics, setShowStatistics] = useState<string | null>(null);

  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [premiumPlace, setPremiumPlace] = useState<Place | null>(null);

  const [editPromotionsDialogOpen, setEditPromotionsDialogOpen] = useState(false);
  const [promotionsEditingPlace, setPromotionsEditingPlace] = useState<any>(null);

  // Check if place premium is cancelled
  const isPlacePremiumCancelled = (placeId: string) => {
    const subscription = subscriptions.find(s => s.placeId === placeId);
    return subscription?.cancelAtPeriodEnd || false;
  };

  const openPremiumDialog = (place: Place) => {
    if (place.is_premium) {
      // Show cancellation dialog
      setPremiumPlace(place);
      setPremiumDialogOpen(true);
    } else {
      // Enable premium directly
      handleTogglePremium(place);
    }
  };

  const handleTogglePremium = async (place: Place, skipDialog = false) => {
    const isCancelled = isPlacePremiumCancelled(place.id);
    
    // If premium is active and not cancelled, show cancellation dialog
    if (place.is_premium && !isCancelled && !skipDialog) {
      openPremiumDialog(place);
      return;
    }

    setToggleLoading(place.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("toggle-premium", {
        body: {
          placeId: place.id,
          isPremium: !place.is_premium || isCancelled,
        },
      });

      if (response.error) throw response.error;

      const data = response.data as any;

      toast({
        title: t("success"),
        description: place.is_premium && !isCancelled
          ? t("premiumCancelledAtPeriodEnd")
          : t("premiumEnabled"),
      });

      setPremiumDialogOpen(false);
      setPremiumPlace(null);
      onRefresh();
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToUpdatePremium"),
        variant: "destructive",
      });
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDeletePlace = async () => {
    if (!deletingPlace) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("places")
        .delete()
        .eq("id", deletingPlace.id);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("placeDeleted"),
      });

      onRefresh();
      setDeleteDialogOpen(false);
      setDeletingPlace(null);
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToDeletePlace"),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (place: Place) => {
    setDeletingPlace(place);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = async (place: Place) => {
    // Fetch full place data
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("id", place.id)
      .single();
    
    if (error || !data) {
      toast({
        title: t("error"),
        description: t("failedToLoadPlace"),
        variant: "destructive",
      });
      return;
    }
    
    setEditingPlace(data);
    setEditDialogOpen(true);
  };

  const openPageEditor = (place: Place) => {
    setPageEditingPlace(place);
    setPageEditorOpen(true);
  };

  const openPromotionsEditor = async (place: Place) => {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("id", place.id)
      .single();
    
    if (error || !data) {
      toast({
        title: t("error"),
        description: t("failedToLoadPlace"),
        variant: "destructive",
      });
      return;
    }
    
    setPromotionsEditingPlace(data);
    setEditPromotionsDialogOpen(true);
  };

  const handleUpdatePromotions = async (placeId: string, promotions: any) => {
    try {
      const { error } = await supabase
        .from("places")
        .update({ promotions })
        .eq("id", placeId);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("promotionsUpdated"),
      });

      onRefresh();
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToUpdatePromotions"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("myPlaces")}</CardTitle>
              <CardDescription>{t("managePlaces")}</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addNewPlace")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Crown className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("customPagePremiumInfo")}
            </AlertDescription>
          </Alert>
          {places.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {t("noPlacesYet")}
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("addFirstPlace")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {places.map((place) => (
                <div 
                  key={place.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.location.href = `/?placeId=${place.id}`}
                      title={t("viewOnMap")}
                    >
                      <Map className="w-4 h-4" />
                    </Button>
                    <div>
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(place.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {place.is_premium && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </Badge>
                      )}
                      {place.has_custom_page && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {t("customPage")}
                        </Badge>
                      )}
                    </div>
                    {isPlacePremiumCancelled(place.id) && place.premium_expires_at && (
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {t("premiumCancelledUntil")} {new Date(place.premium_expires_at).toLocaleDateString()}. {t("noChargeNextPeriod")}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(place)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {t("edit")}
                      </Button>
                      {place.is_premium && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPageEditor(place)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {t("editCustomPage")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPromotionsEditor(place)}
                          >
                            <Tag className="w-4 h-4 mr-2" />
                            {t("editPromotions")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStatistics(showStatistics === place.id ? null : place.id)}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            {t("viewStatistics")}
                          </Button>
                        </>
                      )}
                      <Button
                        variant={place.is_premium && !isPlacePremiumCancelled(place.id) ? "outline" : "default"}
                        size="sm"
                        onClick={() => isPlacePremiumCancelled(place.id) ? handleTogglePremium(place, true) : openPremiumDialog(place)}
                        disabled={toggleLoading === place.id || (!place.is_premium && !isPlacePremiumCancelled(place.id) && credits < 8)}
                      >
                        {toggleLoading === place.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Crown className="w-4 h-4 mr-2" />
                        )}
                        {isPlacePremiumCancelled(place.id) 
                          ? t("activatePremium") 
                          : place.is_premium 
                            ? t("cancelPremium") 
                            : t("enablePremium")
                        }
                        {!place.is_premium && !isPlacePremiumCancelled(place.id) && ` (8 ${t("credits")})`}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(place)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {showStatistics === place.id && (
                      <div className="mt-4">
                        <PlacePageStatistics placeId={place.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPlaceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={onRefresh}
      />

      <EditPlaceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onRefresh}
        place={editingPlace}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeletePlace")}: {deletingPlace?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlace}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelPremiumTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelPremiumDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleLoading !== null}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => premiumPlace && handleTogglePremium(premiumPlace, true)}
              disabled={toggleLoading !== null}
            >
              {toggleLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("agree")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pageEditingPlace && (
        <AlertDialog open={pageEditorOpen} onOpenChange={setPageEditorOpen}>
          <AlertDialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("editCustomPage")}: {pageEditingPlace.name}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex-1 overflow-y-auto">
              <PlacePageEditor
                place={pageEditingPlace as any}
                onSave={() => {
                  setPageEditorOpen(false);
                  setPageEditingPlace(null);
                  onRefresh();
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPageEditorOpen(false);
                setPageEditingPlace(null);
              }}>
                {t("close")}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={editPromotionsDialogOpen} onOpenChange={setEditPromotionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editPromotions")} - {promotionsEditingPlace?.name}</DialogTitle>
          </DialogHeader>
          <PromoEditor
            value={promotionsEditingPlace?.promotions || { blocks: [] }}
            onChange={(promotions) => {
              if (promotionsEditingPlace) {
                handleUpdatePromotions(promotionsEditingPlace.id, promotions);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
