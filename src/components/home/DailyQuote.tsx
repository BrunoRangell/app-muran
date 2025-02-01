import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TextQuote } from "lucide-react";

const quotes = [
  {
    text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    author: "Robert Collier"
  },
  {
    text: "A persistência é o caminho do êxito.",
    author: "Charles Chaplin"
  },
  {
    text: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    author: "Albert Einstein"
  },
  {
    text: "Não espere por oportunidades extraordinárias. Agarre as oportunidades comuns e as torne extraordinárias.",
    author: "Orison Swett Marden"
  },
  {
    text: "O segredo do sucesso é a constância do propósito.",
    author: "Benjamin Disraeli"
  },
  {
    text: "Quanto maior a dificuldade, maior a glória.",
    author: "Cícero"
  },
  {
    text: "A excelência não é um ato, mas um hábito.",
    author: "Aristóteles"
  }
];

export const DailyQuote = () => {
  const [quote, setQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % quotes.length;
    setQuote(quotes[quoteIndex]);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <TextQuote className="h-5 w-5 text-muran-primary flex-shrink-0 mt-1" />
          <p className="text-center text-lg text-gray-700 font-medium italic">
            "{quote.text}" - {quote.author}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};