import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InfoCardEditorProps {
  value: {
    title: string;
    text: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderStyle?: string;
  };
  onChange: (value: any) => void;
}

export const InfoCardEditor = ({ value, onChange }: InfoCardEditorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Заголовок</Label>
        <Input
          value={value.title || ""}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Заголовок карточки"
        />
      </div>
      
      <div>
        <Label>Текст</Label>
        <RichTextEditor
          value={value.text || ""}
          onChange={(text) => onChange({ ...value, text })}
          placeholder="Текст карточки"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Цвет фона</Label>
          <Input
            type="color"
            value={value.backgroundColor || "#f3f4f6"}
            onChange={(e) => onChange({ ...value, backgroundColor: e.target.value })}
          />
        </div>
        <div>
          <Label>Цвет текста</Label>
          <Input
            type="color"
            value={value.textColor || "#1f2937"}
            onChange={(e) => onChange({ ...value, textColor: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Цвет рамки</Label>
          <Input
            type="color"
            value={value.borderColor || "#e5e7eb"}
            onChange={(e) => onChange({ ...value, borderColor: e.target.value })}
          />
        </div>
        <div>
          <Label>Стиль рамки</Label>
          <Select
            value={value.borderStyle || "solid"}
            onValueChange={(borderStyle) => onChange({ ...value, borderStyle })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Сплошная</SelectItem>
              <SelectItem value="dashed">Пунктирная</SelectItem>
              <SelectItem value="dotted">Точечная</SelectItem>
              <SelectItem value="none">Без рамки</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
