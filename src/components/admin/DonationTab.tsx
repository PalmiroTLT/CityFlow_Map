import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface DonationContent {
  id: string;
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

export const DonationTab = () => {
  const [content, setContent] = useState<DonationContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("donation_content")
      .select("*")
      .single();

    if (error) {
      toast.error("Ошибка загрузки данных");
      console.error(error);
    } else if (data) {
      setContent(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!content) return;

    setSaving(true);
    const { error } = await supabase
      .from("donation_content")
      .update({
        welcome_title_sr: content.welcome_title_sr,
        welcome_title_ru: content.welcome_title_ru,
        welcome_title_en: content.welcome_title_en,
        welcome_description_sr: content.welcome_description_sr,
        welcome_description_ru: content.welcome_description_ru,
        welcome_description_en: content.welcome_description_en,
        donation_title_sr: content.donation_title_sr,
        donation_title_ru: content.donation_title_ru,
        donation_title_en: content.donation_title_en,
        donation_description_sr: content.donation_description_sr,
        donation_description_ru: content.donation_description_ru,
        donation_description_en: content.donation_description_en,
        donation_wallet_address: content.donation_wallet_address,
        donation_qr_code_url: content.donation_qr_code_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", content.id);

    if (error) {
      toast.error("Ошибка сохранения");
      console.error(error);
    } else {
      toast.success("Сохранено успешно");
    }
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `qr-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tour-images")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Ошибка загрузки файла");
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("tour-images")
      .getPublicUrl(fileName);

    setContent(prev => prev ? { ...prev, donation_qr_code_url: publicUrl } : null);
    toast.success("QR код загружен");
    setUploading(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!content) {
    return <div className="p-8 text-center">Данные не найдены</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="welcome">
        <TabsList>
          <TabsTrigger value="welcome">Приветственное окно</TabsTrigger>
          <TabsTrigger value="donation">Донат</TabsTrigger>
        </TabsList>

        <TabsContent value="welcome" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Приветственное окно</CardTitle>
              <CardDescription>Контент, который видят пользователи при первом входе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Заголовок (Српски)</Label>
                <Input
                  value={content.welcome_title_sr}
                  onChange={e => setContent({ ...content, welcome_title_sr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (Русский)</Label>
                <Input
                  value={content.welcome_title_ru}
                  onChange={e => setContent({ ...content, welcome_title_ru: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (English)</Label>
                <Input
                  value={content.welcome_title_en}
                  onChange={e => setContent({ ...content, welcome_title_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (Српски)</Label>
                <Textarea
                  value={content.welcome_description_sr || ""}
                  onChange={e => setContent({ ...content, welcome_description_sr: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (Русский)</Label>
                <Textarea
                  value={content.welcome_description_ru || ""}
                  onChange={e => setContent({ ...content, welcome_description_ru: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (English)</Label>
                <Textarea
                  value={content.welcome_description_en || ""}
                  onChange={e => setContent({ ...content, welcome_description_en: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о донате</CardTitle>
              <CardDescription>Контент для кнопки "Помочь проекту"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Заголовок (Српски)</Label>
                <Input
                  value={content.donation_title_sr}
                  onChange={e => setContent({ ...content, donation_title_sr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (Русский)</Label>
                <Input
                  value={content.donation_title_ru}
                  onChange={e => setContent({ ...content, donation_title_ru: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (English)</Label>
                <Input
                  value={content.donation_title_en}
                  onChange={e => setContent({ ...content, donation_title_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (Српски)</Label>
                <Textarea
                  value={content.donation_description_sr || ""}
                  onChange={e => setContent({ ...content, donation_description_sr: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (Русский)</Label>
                <Textarea
                  value={content.donation_description_ru || ""}
                  onChange={e => setContent({ ...content, donation_description_ru: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (English)</Label>
                <Textarea
                  value={content.donation_description_en || ""}
                  onChange={e => setContent({ ...content, donation_description_en: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Адрес кошелька</Label>
                <Input
                  value={content.donation_wallet_address || ""}
                  onChange={e => setContent({ ...content, donation_wallet_address: e.target.value })}
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-2">
                <Label>QR код</Label>
                {content.donation_qr_code_url && (
                  <div className="mb-2">
                    <img 
                      src={content.donation_qr_code_url} 
                      alt="QR Code"
                      className="w-32 h-32 border-2 border-border rounded"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="qr-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("qr-upload")?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Загрузить QR код
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
};