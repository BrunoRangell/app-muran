import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const Layout = () => {
  const location = useLocation();
  const isTasksPage = location.pathname === "/tarefas";
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muran-secondary">
      <Sidebar />
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