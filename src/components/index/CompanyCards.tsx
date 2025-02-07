
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "center",
  });

  const [autoplay, setAutoplay] = useState(true);
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);

  const clearAutoplayInterval = useCallback(() => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      setAutoplayInterval(null);
    }
  }, [autoplayInterval]);

  const startAutoplay = useCallback(() => {
    if (!emblaApi || !autoplay) return;

    clearAutoplayInterval();

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
        console.log("Avançando slide automaticamente");
      } else {
        emblaApi.scrollTo(0);
        console.log("Voltando para o primeiro slide");
      }
    }, 5000);

    setAutoplayInterval(interval);
    console.log("Iniciando novo intervalo de autoplay");
  }, [emblaApi, autoplay, clearAutoplayInterval]);

  // Reinicia o autoplay quando o usuário interage com o carrossel
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    startAutoplay();
    console.log("Slide selecionado manualmente - reiniciando autoplay");
  }, [emblaApi, startAutoplay]);

  // Inicializa o autoplay quando o componente monta
  useEffect(() => {
    if (!emblaApi) return;
    
    console.log("Embla API inicializada");
    emblaApi.on("select", onSelect);
    startAutoplay();

    return () => {
      console.log("Limpando recursos do carrossel");
      emblaApi.off("select", onSelect);
      clearAutoplayInterval();
    };
  }, [emblaApi, onSelect, startAutoplay, clearAutoplayInterval]);

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
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};
