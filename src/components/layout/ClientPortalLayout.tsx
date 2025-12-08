import { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientPortalLayoutProps {
  children: ReactNode;
  clientName?: string;
  showEditButton?: boolean;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function ClientPortalLayout({ 
  children, 
  clientName,
  showEditButton = false,
  isEditing = false,
  onEditClick
}: ClientPortalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header - Fundo escuro para logo com texto branco */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#321e32]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Muran Completa */}
            <img 
              src="/images/muran-logo-complete.png" 
              alt="Muran - Soluções em Marketing Digital" 
              className="h-10 w-auto"
            />
            
            {/* Separator */}
            {clientName && (
              <>
                <div className="h-6 w-px bg-white/30" />
                <h1 className="font-medium text-white">
                  {clientName}
                </h1>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Badge de relatório */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muran-primary/20 text-muran-primary text-sm font-medium">
              <span className="hidden sm:inline">Relatório de Performance</span>
              <span className="sm:hidden">Relatório</span>
            </div>

            {/* Botão Editar (apenas para team members logados) */}
            {showEditButton && (
              <Button
                variant={isEditing ? "default" : "secondary"}
                size="sm"
                onClick={onEditClick}
                className={isEditing 
                  ? "bg-muran-primary hover:bg-muran-primary/90 text-white" 
                  : "bg-white/10 hover:bg-white/20 text-white border-0"
                }
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? "Editando" : "Editar"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            Relatório gerado por{" "}
            <a 
              href="https://muran.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muran-primary hover:underline font-medium"
            >
              Muran Marketing
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
