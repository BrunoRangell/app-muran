import { Card, CardContent } from "@/components/ui/card";

interface QuoteCardProps {
  quote: {
    quote: string;
    author: string;
  };
}

export const QuoteCard = ({ quote }: QuoteCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10">
      <CardContent className="p-6">
        <p className="text-center text-lg text-gray-700 font-medium italic">
          "{quote.quote}" - {quote.author}
        </p>
      </CardContent>
    </Card>
  );
};