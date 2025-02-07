
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";

export const CompanyCards = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (emblaApi) {
      // Auto-play com intervalo de 5 segundos
      const interval = setInterval(() => {
        emblaApi.scrollNext();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [emblaApi]);

  const cards = [
    {
      icon: Target,
      title: "Nossa Missão",
      content:
        "Contribuir para o impulsionamento de negócios no mundo digital, assessorando empreendedores com transparência, leveza e comprometimento e construindo parcerias duradouras.",
    },
    {
      icon: ArrowUpRight,
      title: "Nossa Visão",
      content:
        "Prestar serviços de excelência em marketing digital, contribuindo para a prosperidade de clientes e almejando tornar-se referência no nicho.",
    },
    {
      icon: Users,
      title: "Nossos Valores",
      content: [
        "Agilidade",
        "Colaboração",
        "Comprometimento",
        "Excelência",
        "Flexibilidade",
        "Transparência",
      ],
    },
  ];

  return (
    <Carousel
      ref={emblaRef}
      className="w-full"
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent>
        {cards.map((card) => (
          <CarouselItem key={card.title}>
            <Card className="h-full transform transition-all hover:scale-105 border-0 shadow-sm hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <card.icon className="h-6 w-6 text-muran-primary shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-muran-complementary">
                      {card.title}
                    </h3>
                    {Array.isArray(card.content) ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {card.content.map((item) => (
                          <li key={item} className="transition-all hover:text-muran-primary">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {card.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
