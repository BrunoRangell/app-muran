
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export const CompanyCards = () => {
  const [autoPlay, setAutoPlay] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "center",
    loop: true 
  });

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

  useEffect(() => {
    if (!autoPlay || !emblaApi) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, emblaApi]);

  return (
    <div className="h-full flex">
      <Carousel className="w-full">
        <CarouselContent ref={emblaRef} className="h-full">
          {cards.map((card) => (
            <CarouselItem key={card.title} className="h-full basis-full">
              <Card className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col p-6">
                <CardContent className="h-[420px] p-0">
                  <div className="flex items-start gap-4 h-full">
                    <card.icon className="h-6 w-6 text-muran-primary shrink-0" />
                    <div className="space-y-2 flex-1">
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
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};
