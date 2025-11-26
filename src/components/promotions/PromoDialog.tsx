import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface PromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotions: any;
  placeName: string;
}

export const PromoDialog = ({ open, onOpenChange, promotions, placeName }: PromoDialogProps) => {
  const blocks = promotions?.blocks || [];
  
  // Check if promotion is active and within date range
  const isPromotionActive = () => {
    if (promotions?.isActive === false) return false;
    
    const now = new Date();
    
    if (promotions?.startDate) {
      const startDate = new Date(promotions.startDate);
      if (now < startDate) return false;
    }
    
    if (promotions?.endDate) {
      const endDate = new Date(promotions.endDate);
      if (now > endDate) return false;
    }
    
    return true;
  };
  
  if (!isPromotionActive()) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Промокод скопирован");
  };

  const renderBlock = (block: any) => {
    switch (block.type) {
      case "text":
        return (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content.html) }}
          />
        );

      case "image":
        return (
          <div className="space-y-2">
            <img
              src={block.content.url}
              alt={block.content.alt || ""}
              className="w-full rounded-lg"
            />
            {block.content.caption && (
              <p className="text-sm text-muted-foreground text-center">{block.content.caption}</p>
            )}
          </div>
        );

      case "info-card":
        return (
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: block.content.backgroundColor,
              color: block.content.textColor,
              border: `2px ${block.content.borderStyle} ${block.content.borderColor}`,
            }}
          >
            {block.content.title && (
              <h3 className="text-lg font-semibold mb-2">{block.content.title}</h3>
            )}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content.text) }}
            />
          </div>
        );

      case "gallery":
        return (
          <Carousel className="w-full">
            <CarouselContent>
              {block.content.images.map((img: any, idx: number) => (
                <CarouselItem key={idx}>
                  <img src={img.url} alt={img.alt || ""} className="w-full rounded-lg" />
                  {img.caption && (
                    <p className="text-sm text-muted-foreground text-center mt-2">{img.caption}</p>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        );

      case "link":
        return (
          <a
            href={block.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {block.content.text}
          </a>
        );

      case "button":
        return (
          <Button asChild className="w-full">
            <a href={block.content.url} target="_blank" rel="noopener noreferrer">
              {block.content.text}
            </a>
          </Button>
        );

      case "product-cards":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {block.content.cards.map((card: any) => (
              <div key={card.id} className="border rounded-lg p-4 space-y-3">
                {card.image && (
                  <img src={card.image} alt={card.name} className="w-full h-48 object-cover rounded" />
                )}
                <h4 className="font-semibold text-lg">{card.name}</h4>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <div className="flex items-center gap-2">
                  {card.hasDiscount && card.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-primary">{card.discountPrice}</span>
                      <span className="text-sm line-through text-muted-foreground">{card.price}</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">{card.price}</span>
                  )}
                </div>
                {card.buttonUrl && (
                  <Button asChild className="w-full">
                    <a href={card.buttonUrl} target="_blank" rel="noopener noreferrer">
                      {card.buttonText || "Купить"}
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        );

      case "promo-code":
        return (
          <div className="border-2 border-dashed border-primary rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground">{block.content.description}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-2 rounded font-mono text-lg font-bold">
                {block.content.code}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(block.content.code)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Акции и предложения - {placeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {blocks.map((block: any) => (
            <div key={block.id}>{renderBlock(block)}</div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
