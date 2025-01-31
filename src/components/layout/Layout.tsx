import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const Layout = () => {
  const location = useLocation();
  const isTasksPage = location.pathname === "/tarefas";

  return (
    <div className="flex min-h-screen bg-muran-secondary">
      <Sidebar />
      <main className={`flex-1 ${isTasksPage ? "ml-64 p-0" : "ml-64 p-8"}`}>
        <Outlet />
      </main>
    </div>
  );
};