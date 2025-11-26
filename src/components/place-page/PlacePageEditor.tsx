import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, MoveUp, MoveDown, Image, Type, LayoutGrid, Columns, Info, Crown, AlertCircle, Table } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { RichTextEditor } from "@/components/tour-guide/RichTextEditor";
import { ImageUploader } from "@/components/tour-guide/ImageUploader";
import { InfoCardEditor } from "@/components/tour-guide/InfoCardEditor";
import { GalleryEditor } from "@/components/tour-guide/GalleryEditor";
import { TableEditor } from "@/components/tour-guide/TableEditor";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface PlacePageEditorProps {
  place: Place;
  onSave: () => void;
}

interface Block {
  id: string;
  type: "text" | "image" | "info-card" | "gallery" | "two-column" | "table";
  content: any;
  style?: any;
  order: number;
}

export const PlacePageEditor = ({ place, onSave }: PlacePageEditorProps) => {
  const [content, setContent] = useState<any>({
    header: {},
    blocks: [],
    pageStyle: {},
  });
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Load existing content when place changes
    if (place.custom_page_content) {
      setContent(place.custom_page_content);
    } else {
      setContent({
        header: {},
        blocks: [],
        pageStyle: {},
      });
    }
  }, [place.id, place.custom_page_content]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      order: content.blocks?.length || 0,
    };

    setContent({
      ...content,
      blocks: [...(content.blocks || []), newBlock],
    });
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
      case "two-column":
        return { leftColumn: "<p>Левая колонка</p>", rightColumn: "<p>Правая колонка</p>" };
      case "table":
        return { data: [["", ""], ["", ""]] };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setContent({
      ...content,
      blocks: content.blocks?.map((b: Block) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    setContent({
      ...content,
      blocks: content.blocks?.filter((b: Block) => b.id !== blockId),
    });
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const blocks = [...(content.blocks || [])];
    const index = blocks.findIndex((b) => b.id === blockId);
    
    if (direction === "up" && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === "down" && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }

    blocks.forEach((b, i) => (b.order = i));
    setContent({ ...content, blocks });
  };

  const handleSave = async () => {
    // Check if place is premium or user is admin
    if (!place.is_premium && !isAdmin) {
      toast.error("Кастомные страницы доступны только для премиум-мест");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Необходима авторизация");
        setSaving(false);
        return;
      }

      // Verify ownership by checking place owner_id
      const { data: placeCheck, error: checkError } = await supabase
        .from("places")
        .select("owner_id")
        .eq("id", place.id)
        .single();

      if (checkError || !placeCheck) {
        console.error("Error checking place ownership:", checkError);
        toast.error("Ошибка проверки прав доступа");
        setSaving(false);
        return;
      }

      // Verify user is owner or admin
      if (placeCheck.owner_id !== user.id && !isAdmin) {
        console.error("Ownership check failed:", {
          placeOwnerId: placeCheck.owner_id,
          userId: user.id,
          isAdmin
        });
        toast.error("Вы не являетесь владельцем этого места");
        setSaving(false);
        return;
      }

      // Update the place
      const { error } = await supabase
        .from("places")
        .update({
          has_custom_page: true,
          custom_page_content: content,
        })
        .eq("id", place.id);

      if (error) {
        console.error("Save error:", error);
        toast.error(`Ошибка сохранения: ${error.message}`);
        setSaving(false);
        return;
      }

      toast.success("Страница сохранена");
      onSave();
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Ошибка сохранения страницы");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!place.is_premium && !isAdmin && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Кастомные страницы доступны только для премиум-мест. Активируйте премиум-статус, чтобы сохранить изменения.
          </AlertDescription>
        </Alert>
      )}
      
      {!place.is_premium && isAdmin && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Это место не имеет премиум-статуса. Вы можете редактировать страницу как администратор, 
            но владелец не сможет изменять её без активации премиум.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header">Хедер</TabsTrigger>
          <TabsTrigger value="blocks">Контент</TabsTrigger>
          <TabsTrigger value="style">Стили</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Заголовок</Label>
                <Input
                  value={content.header?.title || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, title: e.target.value },
                    })
                  }
                  placeholder={place.name}
                />
              </div>
              <div>
                <Label>Подзаголовок</Label>
                <Input
                  value={content.header?.subtitle || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, subtitle: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Фоновое изображение (URL)</Label>
                  <Input
                    value={content.header?.backgroundImage || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, backgroundImage: e.target.value },
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Цвет фона</Label>
                  <Input
                    type="color"
                    value={content.header?.backgroundColor || "#3b82f6"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, backgroundColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Цвет текста</Label>
                  <Input
                    type="color"
                    value={content.header?.textColor || "#ffffff"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, textColor: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Высота (px)</Label>
                  <Input
                    value={content.header?.height || "400px"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, height: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => addBlock("text")} className="gap-2">
              <Type className="w-4 h-4" /> Текст
            </Button>
            <Button size="sm" onClick={() => addBlock("image")} className="gap-2">
              <Image className="w-4 h-4" /> Изображение
            </Button>
            <Button size="sm" onClick={() => addBlock("info-card")} className="gap-2">
              <Info className="w-4 h-4" /> Инфо-карта
            </Button>
            <Button size="sm" onClick={() => addBlock("gallery")} className="gap-2">
              <LayoutGrid className="w-4 h-4" /> Галерея
            </Button>
            <Button size="sm" onClick={() => addBlock("two-column")} className="gap-2">
              <Columns className="w-4 h-4" /> Две колонки
            </Button>
            <Button size="sm" onClick={() => addBlock("table")} className="gap-2">
              <Table className="w-4 h-4" /> Таблица
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {content.blocks?.map((block: Block, index: number) => (
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
                        disabled={index === content.blocks.length - 1}
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

                  {block.type === "two-column" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-2 block">Левая колонка</Label>
                        <RichTextEditor
                          value={block.content.leftColumn || ""}
                          onChange={(leftColumn) =>
                            updateBlock(block.id, {
                              content: { ...block.content, leftColumn },
                            })
                          }
                          placeholder="Содержимое левой колонки..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-2 block">Правая колонка</Label>
                        <RichTextEditor
                          value={block.content.rightColumn || ""}
                          onChange={(rightColumn) =>
                            updateBlock(block.id, {
                              content: { ...block.content, rightColumn },
                            })
                          }
                          placeholder="Содержимое правой колонки..."
                        />
                      </div>
                    </div>
                  )}

                  {block.type === "table" && (
                    <TableEditor
                      value={block.content.data || [["", ""], ["", ""]]}
                      onChange={(data) =>
                        updateBlock(block.id, {
                          content: { data },
                        })
                      }
                    />
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Цвет фона страницы</Label>
                <Input
                  type="color"
                  value={content.pageStyle?.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, backgroundColor: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Шрифт</Label>
                <Input
                  value={content.pageStyle?.fontFamily || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, fontFamily: e.target.value },
                    })
                  }
                  placeholder="Arial, sans-serif"
                />
              </div>
              <div>
                <Label>Максимальная ширина контента</Label>
                <Input
                  value={content.pageStyle?.maxWidth || "1200px"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, maxWidth: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить страницу"}
        </Button>
      </div>
    </div>
  );
};
