import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface TourContent {
  includes?: string[];
  details?: string;
}

interface TourContentEditorProps {
  value: TourContent;
  onChange: (value: TourContent) => void;
}

export function TourContentEditor({ value, onChange }: TourContentEditorProps) {
  const [content, setContent] = useState<TourContent>(value || { includes: [], details: "" });

  const handleAddItem = () => {
    const newIncludes = [...(content.includes || []), ""];
    const newContent = { ...content, includes: newIncludes };
    setContent(newContent);
    onChange(newContent);
  };

  const handleRemoveItem = (index: number) => {
    const newIncludes = (content.includes || []).filter((_, i) => i !== index);
    const newContent = { ...content, includes: newIncludes };
    setContent(newContent);
    onChange(newContent);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newIncludes = [...(content.includes || [])];
    newIncludes[index] = value;
    const newContent = { ...content, includes: newIncludes };
    setContent(newContent);
    onChange(newContent);
  };

  const handleDetailsChange = (details: string) => {
    const newContent = { ...content, details };
    setContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            What's Included
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(content.includes || []).map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => handleUpdateItem(index, e.target.value)}
                placeholder="Enter item description"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {(content.includes || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No items added yet</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Additional Details</Label>
        <Textarea
          value={content.details || ""}
          onChange={(e) => handleDetailsChange(e.target.value)}
          placeholder="Enter additional tour details..."
          rows={6}
        />
      </div>
    </div>
  );
}
