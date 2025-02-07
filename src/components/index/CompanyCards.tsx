
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

export const CompanyCards = () => {
  // Estado para armazenar a API do Embla obtida via Carousel
  const [emblaApi, setEmblaApi] = useState<any>(null);

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

  // Lógica de autoplay: a cada seleção de slide, espera 10 segundos e então avança
  useEffect(() => {
    if (!emblaApi) {
      console.log("Embla API não disponível ainda.");
      return;
    }

    let timeout = setTimeout(() => {
      console.log("Autoplay: chamando emblaApi.scrollNext()");
      emblaApi.scrollNext();
    }, 10000);

    const onSelect = () => {
      // Reinicia o timer sempre que um novo slide for selecionado
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log("Autoplay (onSelect): chamando emblaApi.scrollNext()");
        emblaApi.scrollNext();
      }, 10000);
    };

    emblaApi.on("select", onSelect);

    return () => {
      clearTimeout(timeout);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="h-full flex">
      <Carousel
        className="w-full"
        // Passa a função para capturar a API do Embla
        setApi={setEmblaApi}
        // Define as opções do Embla: alinhamento central, loop ativo e duração da transição reduzida
        opts={{ 
          align: "center", 
          loop: true, 
          duration: 100
        }}
      >
        <CarouselContent>
          {cards.map((card) => (
            <CarouselItem key={card.title} className="h-full">
              <Card className="border-0 shadow-sm h-[320px]">
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
                            <li
                              key={item}
                              className="text-gray-600"
                            >
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
