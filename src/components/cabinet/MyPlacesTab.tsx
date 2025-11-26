import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

type Place = {
  id: string;
  name: string;
  subscribed_until: string | null;
  premium_until: string | null;
  is_premium: boolean;
};

type Category = { id: string; name: string };
type City = { id: string; name_ru: string };

type MyPlacesTabProps = {
  user: User | null;
};

export const MyPlacesTab = ({ user }: MyPlacesTabProps) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlaceId, setUpgradingPlaceId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState({ name: '', description: '', latitude: '', longitude: '', category_id: '', city_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlaces();
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    const [categoriesRes, citiesRes] = await Promise.all([
      supabase.from('categories').select('id, name'),
      supabase.from('cities').select('id, name_ru')
    ]);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (citiesRes.data) setCities(citiesRes.data);
  };

  const fetchPlaces = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("id, name, subscribed_until, premium_until, is_premium")
      .eq("owner_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      toast.error("Не удалось загрузить список ваших мест.");
    } else {
      setPlaces(data as Place[]);
    }
    setLoading(false);
  };

  const handleUpgrade = async (placeId: string) => {
    setUpgradingPlaceId(placeId);
    const { data, error } = await supabase.rpc('upgrade_place_to_premium', { place_id_input: placeId });
    if (error || !data.success) {
      toast.error(data?.message || "Ошибка при обновлении до премиум.");
    } else {
      toast.success(data.message);
      fetchPlaces();
    }
    setUpgradingPlaceId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { name, description, latitude, longitude, category_id, city_id } = formState;
    
    if (!name || !latitude || !longitude || !category_id || !city_id) {
        toast.error("Пожалуйста, заполните все обязательные поля.");
        setIsSubmitting(false);
        return;
    }

    const { data, error } = await supabase.rpc('add_place', {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id,
        city_id
    });

    if (error || !data.success) {
        toast.error(data?.message || "Ошибка при добавлении места.");
    } else {
        toast.success(data.message);
        fetchPlaces();
        setIsDialogOpen(false);
        setFormState({ name: '', description: '', latitude: '', longitude: '', category_id: '', city_id: '' });
    }
    setIsSubmitting(false);
  };

  const isSubscriptionActive = (date: string | null) => date ? new Date(date) > new Date() : false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Мои места</CardTitle>
          <CardDescription>Управление вашими точками на карте.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="w-4 h-4 mr-2" />Добавить место</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новое место</DialogTitle>
              <DialogDescription>
                Добавление нового места на карту стоит 10 единиц с вашего баланса.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input id="name" name="name" value={formState.name} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" value={formState.description} onChange={handleFormChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Широта</Label>
                  <Input id="latitude" name="latitude" type="number" value={formState.latitude} onChange={handleFormChange} required />
                </div>
                <div>
                  <Label htmlFor="longitude">Долгота</Label>
                  <Input id="longitude" name="longitude" type="number" value={formState.longitude} onChange={handleFormChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="category_id">Категория</Label>
                <Select name="category_id" onValueChange={(value) => handleSelectChange('category_id', value)} required>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city_id">Город</Label>
                <Select name="city_id" onValueChange={(value) => handleSelectChange('city_id', value)} required>
                  <SelectTrigger><SelectValue placeholder="Выберите город" /></SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ru}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Добавление...' : 'Добавить и оплатить'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <p>Загрузка...</p> : (
          <div className="space-y-4">
            {places.length > 0 ? places.map((place) => (
              <Card key={place.id} className="flex items-center justify-between p-4 bg-muted/50">
                <div>
                  <h3 className="font-semibold">{place.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {isSubscriptionActive(place.subscribed_until) ? (
                      <Badge variant="secondary">Активно до {new Date(place.subscribed_until!).toLocaleDateString()}</Badge>
                    ) : (
                      <Badge variant="destructive">Подписка истекла</Badge>
                    )}
                    {isSubscriptionActive(place.premium_until) && (
                      <Badge className="bg-yellow-500 text-white">Премиум до {new Date(place.premium_until!).toLocaleDateString()}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  {!isSubscriptionActive(place.premium_until) && (
                     <Button size="sm" onClick={() => handleUpgrade(place.id)} disabled={upgradingPlaceId === place.id}>
                       {upgradingPlaceId === place.id ? 'Обновление...' : 'Сделать Премиум'}
                     </Button>
                  )}
                </div>
              </Card>
            )) : <p className="text-center text-muted-foreground">У вас еще нет добавленных мест.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};