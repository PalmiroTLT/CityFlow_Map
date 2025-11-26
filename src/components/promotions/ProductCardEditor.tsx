import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/tour-guide/ImageUploader";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductCard {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  hasDiscount: boolean;
  discountPrice?: string;
  buttonText: string;
  buttonUrl: string;
}

interface ProductCardEditorProps {
  value: ProductCard[];
  onChange: (value: ProductCard[]) => void;
}

export const ProductCardEditor = ({ value, onChange }: ProductCardEditorProps) => {
  const addCard = () => {
    const newCard: ProductCard = {
      id: crypto.randomUUID(),
      name: "",
      image: "",
      description: "",
      price: "",
      hasDiscount: false,
      buttonText: "Купить",
      buttonUrl: "",
    };
    onChange([...value, newCard]);
  };

  const updateCard = (id: string, updates: Partial<ProductCard>) => {
    onChange(value.map((card) => (card.id === id ? { ...card, ...updates } : card)));
  };

  const deleteCard = (id: string) => {
    onChange(value.filter((card) => card.id !== id));
  };

  return (
    <div className="space-y-4">
      <Button onClick={addCard} size="sm" className="gap-2">
        <Plus className="w-4 h-4" /> Добавить товар
      </Button>

      {value.map((card) => (
        <Card key={card.id} className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Товар</Label>
            <Button size="sm" variant="ghost" onClick={() => deleteCard(card.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div>
            <Label>Название</Label>
            <Input
              value={card.name}
              onChange={(e) => updateCard(card.id, { name: e.target.value })}
              placeholder="Название товара"
            />
          </div>

          <ImageUploader
            value={card.image}
            onChange={(image) => updateCard(card.id, { image })}
            label="Изображение товара"
          />

          <div>
            <Label>Описание</Label>
            <Textarea
              value={card.description}
              onChange={(e) => updateCard(card.id, { description: e.target.value })}
              placeholder="Описание товара"
              rows={3}
            />
          </div>

          <div>
            <Label>Цена</Label>
            <Input
              value={card.price}
              onChange={(e) => updateCard(card.id, { price: e.target.value })}
              placeholder="1000 руб"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`discount-${card.id}`}
              checked={card.hasDiscount}
              onCheckedChange={(checked) =>
                updateCard(card.id, { hasDiscount: checked as boolean })
              }
            />
            <Label htmlFor={`discount-${card.id}`}>Есть скидка</Label>
          </div>

          {card.hasDiscount && (
            <div>
              <Label>Цена со скидкой</Label>
              <Input
                value={card.discountPrice || ""}
                onChange={(e) => updateCard(card.id, { discountPrice: e.target.value })}
                placeholder="800 руб"
              />
            </div>
          )}

          <div>
            <Label>Текст кнопки</Label>
            <Input
              value={card.buttonText}
              onChange={(e) => updateCard(card.id, { buttonText: e.target.value })}
              placeholder="Купить"
            />
          </div>

          <div>
            <Label>Ссылка на товар</Label>
            <Input
              value={card.buttonUrl}
              onChange={(e) => updateCard(card.id, { buttonUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </Card>
      ))}
    </div>
  );
};
