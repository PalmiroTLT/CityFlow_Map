import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import DOMPurify from "dompurify";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourGuidePageProps {
  tour: Tour;
  onBack: () => void;
  onNavigateToPlace?: (placeId: string) => void;
}

interface GuideContent {
  header?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    height?: string;
  };
  blocks?: Array<{
    id: string;
    type: "text" | "image" | "info-card" | "gallery" | "two-column" | "three-column" | "table" | "anchor" | "place-link";
    content: any;
    style?: any;
    order: number;
  }>;
  pageStyle?: {
    backgroundColor?: string;
    fontFamily?: string;
    maxWidth?: string;
  };
}

export const TourGuidePage = ({ tour, onBack, onNavigateToPlace }: TourGuidePageProps) => {
  const { language } = useLanguage();
  const content = (tour.guide_content as GuideContent) || {};
  const { header, blocks = [], pageStyle = {} } = content;
  const [activeAnchor, setActiveAnchor] = useState<string>("");

  const getTourName = () => {
    if (language === "en" && tour.name_en) return tour.name_en;
    if (language === "sr" && tour.name_sr) return tour.name_sr;
    return tour.name;
  };

  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });
  };

  const anchors = blocks
    .filter(block => block.type === "anchor" && block.content.anchorId)
    .map(block => ({ id: block.content.anchorId, label: block.content.anchorLabel || block.content.anchorId }));

  const scrollToAnchor = (anchorId: string) => {
    const element = document.getElementById(`anchor-${anchorId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveAnchor(anchorId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const anchor of anchors) {
        const element = document.getElementById(`anchor-${anchor.id}`);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveAnchor(anchor.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [anchors]);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: pageStyle.backgroundColor || "hsl(var(--background))" }}>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />Назад к карте
          </Button>
        </div>
      </div>

      <div className="flex">
        {anchors.length > 0 && (
          <aside className="hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6">
            <nav className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">Навигация</h3>
              {anchors.map((anchor) => (
                <button key={anchor.id} onClick={() => scrollToAnchor(anchor.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeAnchor === anchor.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {anchor.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <div className="flex-1">
          {header && (
            <div className="relative overflow-hidden" style={{
              backgroundColor: header.backgroundColor || "hsl(var(--primary))",
              backgroundImage: header.backgroundImage ? `url(${header.backgroundImage})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              color: header.textColor || "white", height: header.height || "400px"
            }}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{header.title || getTourName()}</h1>
                {header.subtitle && <p className="text-xl md:text-2xl opacity-90 max-w-2xl">{header.subtitle}</p>}
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 py-8" style={{ maxWidth: pageStyle.maxWidth || "1200px" }}>
            {blocks.sort((a, b) => a.order - b.order).map((block) => (
              <div key={block.id} id={block.type === "anchor" ? `anchor-${block.content.anchorId}` : undefined} className="mb-8">
                {block.type === "text" && <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.html || "") }} />}
                {block.type === "image" && <figure className="my-8"><img src={block.content.url} alt={block.content.alt || ""} className="w-full rounded-lg shadow-lg" /></figure>}
                {block.type === "info-card" && (
                  <div className="p-6 rounded-lg my-6" style={{ backgroundColor: block.content.backgroundColor || "#f3f4f6", color: block.content.textColor || "#1f2937", borderColor: block.content.borderColor || "#e5e7eb", borderWidth: "2px", borderStyle: block.content.borderStyle || "solid" }}>
                    <h3 className="text-xl font-semibold mb-3">{block.content.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.text || "") }} />
                  </div>
                )}
                {block.type === "gallery" && block.content.images?.length > 0 && (
                  <div className="my-8 px-12">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {block.content.images.map((img: any, idx: number) => (
                          <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1"><img src={img.url} alt={img.caption || ""} className="w-full h-64 object-cover rounded-lg shadow-lg" /></div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious /><CarouselNext />
                    </Carousel>
                  </div>
                )}
                {block.type === "two-column" && (
                  <div className="grid md:grid-cols-2 gap-8 my-8">
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.leftColumn || "") }} />
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.rightColumn || "") }} />
                  </div>
                )}
                {block.type === "three-column" && (
                  <div className="grid md:grid-cols-3 gap-6 my-8">
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.leftColumn || "") }} />
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.middleColumn || "") }} />
                    <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.rightColumn || "") }} />
                  </div>
                )}
                {block.type === "table" && block.content.tableData && (
                  <div className="overflow-x-auto my-8">
                    <table className="w-full border-collapse border border-border">
                      <thead><tr className="bg-muted">{block.content.tableData[0]?.map((cell: string, idx: number) => <th key={idx} className="border border-border p-3 text-left font-semibold">{cell}</th>)}</tr></thead>
                      <tbody>{block.content.tableData.slice(1).map((row: string[], rowIdx: number) => <tr key={rowIdx} className="hover:bg-muted/50">{row.map((cell: string, cellIdx: number) => <td key={cellIdx} className="border border-border p-3">{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
                {block.type === "place-link" && <Button onClick={() => onNavigateToPlace?.(block.content.placeId)} className="my-4"><MapPin className="w-4 h-4 mr-2" />{block.content.linkText || "Показать на карте"}</Button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
