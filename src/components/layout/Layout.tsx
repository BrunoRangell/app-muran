
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Layout = () => {
  const location = useLocation();
  const isTasksPage = location.pathname === "/tarefas";
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muran-secondary">
      {isMobile ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onMobileItemClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Sidebar />
      )}
      
      <main 
        className={`
          flex-1 
          ${isTasksPage ? "p-0" : "p-4 md:p-8"} 
          ${isMobile ? "mt-16" : "md:ml-64"}
          transition-all 
          duration-300 
          ease-in-out
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};
