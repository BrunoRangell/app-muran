
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface QuoteCardProps {
  quote: {
    quote: string;
    author: string;
  };
}

export const QuoteCard = ({ quote }: QuoteCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-muran-primary/5 to-muran-complementary/5 border-0 shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Quote className="h-8 w-8 text-muran-primary/50 shrink-0" />
          <p className="text-base md:text-lg text-gray-700 font-medium italic flex-1">
            "{quote.quote}" 
            <span className="text-sm md:text-base font-normal text-gray-600 ml-2 block md:inline">
              - {quote.author}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
