import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, ArrowUpRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export const CompanyCards = () => {
  // Inicializa o Embla Carousel com loop habilitado e duração ajustada
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "center",
    loop: true,
    duration: 300, // duração em ms para transição suave
    // Certifique-se de não incluir "dragFree" se você deseja um comportamento de snap
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

  // Efeito de Autoplay: assim que emblaApi estiver disponível, inicia um intervalo que chama scrollNext a cada 5 segundos
  useEffect(() => {
    if (!emblaApi) {
      console.log("Embla API não está disponível ainda.");
      return;
    }
    console.log("Embla API disponível, iniciando autoplay.");
    const interval = setInterval(() => {
      console.log("Autoplay: chamando emblaApi.scrollNext()");
      emblaApi.scrollNext();
    }, 5000);

    // Limpa o intervalo quando o componente desmontar ou emblaApi mudar
    return () => {
      console.log("Limpando intervalo de autoplay.");
      clearInterval(interval);
    };
  }, [emblaApi]);

  return (
    <div className="h-full flex">
      <Carousel className="w-full">
        {/* 
          Atenção: verifique se o componente CarouselContent encaminha o ref (emblaRef) para um elemento DOM real.
          O container deve ter estilos como display: flex e overflow: hidden para que o Embla funcione corretamente.
        */}
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
