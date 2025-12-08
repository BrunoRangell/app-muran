import { ReactNode } from "react";

interface ClientPortalLayoutProps {
  children: ReactNode;
  clientName?: string;
}

export function ClientPortalLayout({ children, clientName }: ClientPortalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Muran */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-muran-primary to-muran-primary-glow flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-lg hidden sm:block">Muran</span>
            </div>
            
            {/* Separator */}
            {clientName && (
              <>
                <div className="h-6 w-px bg-border" />
                <h1 className="font-medium text-foreground">
                  {clientName}
                </h1>
              </>
            )}
          </div>

          {/* Badge de relatório */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muran-primary/10 text-muran-primary text-sm font-medium">
            <span className="hidden sm:inline">Relatório de Performance</span>
            <span className="sm:hidden">Relatório</span>
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
