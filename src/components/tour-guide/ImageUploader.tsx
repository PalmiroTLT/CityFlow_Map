import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageUploader = ({ value, onChange, label = "Изображение" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("tour-guide-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("tour-guide-images")
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Изображение загружено");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Ошибка загрузки изображения");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput);
      toast.success("URL изображения сохранён");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Загрузить</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {value && (
            <div className="mt-2">
              <img src={value} alt="Preview" className="max-h-32 rounded border" />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="url" className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <Button onClick={handleUrlSubmit} size="sm">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
          {value && (
            <div className="mt-2">
              <img src={value} alt="Preview" className="max-h-32 rounded border" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
