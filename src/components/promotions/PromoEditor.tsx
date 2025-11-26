import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, MoveUp, MoveDown, Type, Image, LayoutGrid, Link, CreditCard, Tag } from "lucide-react";
import { RichTextEditor } from "@/components/tour-guide/RichTextEditor";
import { ImageUploader } from "@/components/tour-guide/ImageUploader";
import { InfoCardEditor } from "@/components/tour-guide/InfoCardEditor";
import { GalleryEditor } from "@/components/tour-guide/GalleryEditor";
import { ProductCardEditor } from "./ProductCardEditor";
import { PromoCodeBlockEditor } from "./PromoCodeBlockEditor";

interface Block {
  id: string;
  type: "text" | "image" | "info-card" | "gallery" | "link" | "button" | "product-cards" | "promo-code";
  content: any;
  order: number;
}

interface PromoEditorProps {
  value: any;
  onChange: (value: any) => void;
}

export const PromoEditor = ({ value, onChange }: PromoEditorProps) => {
  const [blocks, setBlocks] = useState<Block[]>(value?.blocks || []);
  const [isActive, setIsActive] = useState(value?.isActive !== undefined ? value.isActive : true);
  const [startDate, setStartDate] = useState(value?.startDate || "");
  const [endDate, setEndDate] = useState(value?.endDate || "");

  useEffect(() => {
    onChange({ 
      blocks,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null
    });
  }, [blocks, isActive, startDate, endDate]);

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      order: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultContent = (type: Block["type"]) => {
    switch (type) {
      case "text":
        return { html: "<p>Введите текст...</p>" };
      case "image":
        return { url: "", alt: "", caption: "" };
      case "info-card":
        return { title: "", text: "<p>Текст карточки...</p>", backgroundColor: "#f3f4f6", textColor: "#1f2937", borderColor: "#e5e7eb", borderStyle: "solid" };
      case "gallery":
        return { images: [] };
      case "link":
        return { text: "Ссылка", url: "" };
      case "button":
        return { text: "Кнопка", url: "" };
      case "product-cards":
        return { cards: [] };
      case "promo-code":
        return { code: "", description: "" };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const index = newBlocks.findIndex((b) => b.id === blockId);
    
    if (direction === "up" && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === "down" && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }

    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label>Активна</Label>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Начало показа (опционально)</Label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Окончание показа (опционально)</Label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => addBlock("text")} className="gap-2">
          <Type className="w-4 h-4" /> Текст
        </Button>
        <Button size="sm" onClick={() => addBlock("image")} className="gap-2">
          <Image className="w-4 h-4" /> Изображение
        </Button>
        <Button size="sm" onClick={() => addBlock("info-card")} className="gap-2">
          <CreditCard className="w-4 h-4" /> Инфо-карта
        </Button>
        <Button size="sm" onClick={() => addBlock("gallery")} className="gap-2">
          <LayoutGrid className="w-4 h-4" /> Галерея
        </Button>
        <Button size="sm" onClick={() => addBlock("link")} className="gap-2">
          <Link className="w-4 h-4" /> Ссылка
        </Button>
        <Button size="sm" onClick={() => addBlock("button")} className="gap-2">
          <Link className="w-4 h-4" /> Кнопка
        </Button>
        <Button size="sm" onClick={() => addBlock("product-cards")} className="gap-2">
          <CreditCard className="w-4 h-4" /> Товары
        </Button>
        <Button size="sm" onClick={() => addBlock("promo-code")} className="gap-2">
          <Tag className="w-4 h-4" /> Промокод
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card key={block.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold capitalize">{block.type}</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveBlock(block.id, "up")}
                    disabled={index === 0}
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveBlock(block.id, "down")}
                    disabled={index === blocks.length - 1}
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBlock(block.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {block.type === "text" && (
                <RichTextEditor
                  value={block.content.html || ""}
                  onChange={(html) =>
                    updateBlock(block.id, {
                      content: { ...block.content, html },
                    })
                  }
                  placeholder="Введите текст..."
                />
              )}

              {block.type === "image" && (
                <div className="space-y-3">
                  <ImageUploader
                    value={block.content.url || ""}
                    onChange={(url) =>
                      updateBlock(block.id, {
                        content: { ...block.content, url },
                      })
                    }
                    label="Изображение"
                  />
                  <Input
                    value={block.content.alt || ""}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        content: { ...block.content, alt: e.target.value },
                      })
                    }
                    placeholder="Описание (alt текст)"
                  />
                  <Input
                    value={block.content.caption || ""}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        content: { ...block.content, caption: e.target.value },
                      })
                    }
                    placeholder="Подпись под изображением"
                  />
                </div>
              )}

              {block.type === "info-card" && (
                <InfoCardEditor
                  value={block.content}
                  onChange={(content) =>
                    updateBlock(block.id, {
                      content,
                    })
                  }
                />
              )}

              {block.type === "gallery" && (
                <GalleryEditor
                  value={block.content.images || []}
                  onChange={(images) =>
                    updateBlock(block.id, {
                      content: { images },
                    })
                  }
                />
              )}

              {block.type === "link" && (
                <div className="space-y-3">
                  <div>
                    <Label>Текст ссылки</Label>
                    <Input
                      value={block.content.text || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, text: e.target.value },
                        })
                      }
                      placeholder="Текст ссылки"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={block.content.url || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, url: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {block.type === "button" && (
                <div className="space-y-3">
                  <div>
                    <Label>Текст кнопки</Label>
                    <Input
                      value={block.content.text || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, text: e.target.value },
                        })
                      }
                      placeholder="Текст кнопки"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={block.content.url || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, url: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {block.type === "product-cards" && (
                <ProductCardEditor
                  value={block.content.cards || []}
                  onChange={(cards) =>
                    updateBlock(block.id, {
                      content: { cards },
                    })
                  }
                />
              )}

              {block.type === "promo-code" && (
                <PromoCodeBlockEditor
                  value={block.content}
                  onChange={(content) =>
                    updateBlock(block.id, {
                      content,
                    })
                  }
                />
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
