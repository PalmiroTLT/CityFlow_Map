import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PromoCodeBlockEditorProps {
  value: {
    code: string;
    description: string;
  };
  onChange: (value: { code: string; description: string }) => void;
}

export const PromoCodeBlockEditor = ({ value, onChange }: PromoCodeBlockEditorProps) => {
  return (
    <div className="space-y-3">
      <div>
        <Label>Промокод</Label>
        <Input
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          placeholder="PROMO2024"
        />
      </div>
      <div>
        <Label>Описание</Label>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Описание акции"
          rows={3}
        />
      </div>
    </div>
  );
};
