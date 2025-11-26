import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryEditorProps {
  value: GalleryImage[];
  onChange: (value: GalleryImage[]) => void;
}

export const GalleryEditor = ({ value, onChange }: GalleryEditorProps) => {
  const [images, setImages] = useState<GalleryImage[]>(value.length > 0 ? value : []);

  const addImage = () => {
    const newImages = [...images, { url: "", caption: "" }];
    setImages(newImages);
    onChange(newImages);
  };

  const updateImage = (index: number, url: string) => {
    const newImages = images.map((img, idx) =>
      idx === index ? { ...img, url } : img
    );
    setImages(newImages);
    onChange(newImages);
  };

  const deleteImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {images.map((image, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <ImageUploader
              value={image.url}
              onChange={(url) => updateImage(index, url)}
              label={`Изображение ${index + 1}`}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteImage(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      <Button onClick={addImage} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Добавить изображение
      </Button>
    </div>
  );
};
