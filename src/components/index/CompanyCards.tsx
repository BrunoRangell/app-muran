import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

export const CompanyCards = () => {
  const [autoPlay, setAutoPlay] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "center",
    duration: 20
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

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    console.log('Avançando para o próximo slide automaticamente');
  }, [emblaApi]);

  // Reset autoplay timer when user interacts
  const handleManualNavigation = useCallback(() => {
    if (!autoPlay) return;
    console.log('Navegação manual detectada, reiniciando timer');
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 100);
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay || !emblaApi) return;

    console.log('Iniciando autoplay');
    const interval = setInterval(scrollNext, 5000);

    return () => {
      console.log('Limpando intervalo do autoplay');
      clearInterval(interval);
    };
  }, [autoPlay, emblaApi, scrollNext]);

  return (
    <div className="h-full flex">
      <Carousel className="w-full">
        <CarouselContent ref={emblaRef}>
          {cards.map((card) => (
            <CarouselItem key={card.title} className="h-full">
              <Card className="transform transition-all hover:scale-105 border-0 shadow-sm hover:shadow-md h-[320px]">
                <CardContent className="flex flex-col p-6 h-full">
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
        <CarouselPrevious 
          className="hidden md:flex -left-4" 
          onClick={handleManualNavigation}
        />
        <CarouselNext 
          className="hidden md:flex -right-4" 
          onClick={handleManualNavigation}
        />
      </Carousel>
    </div>
  );
};