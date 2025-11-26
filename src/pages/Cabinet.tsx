import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { PlacesTab } from "@/components/admin/PlacesTab";
import { ToursTab } from "@/components/admin/ToursTab";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Cabinet = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Вернуться к карте
              </Button>
              <h1 className="text-2xl font-bold">Личный кабинет</h1>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="places">Места</TabsTrigger>
            <TabsTrigger value="tours">Туры</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="places" className="space-y-4">
            <PlacesTab />
          </TabsContent>

          <TabsContent value="tours" className="space-y-4">
            <ToursTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Cabinet;