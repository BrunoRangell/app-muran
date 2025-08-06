import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const SidebarLogout = () => {
  const { logout, isLoading } = useAuth();

  return (
    <div className="absolute bottom-4 left-4 right-4">
      <button 
        onClick={logout}
        disabled={isLoading}
        className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-muran-complementary/80 text-gray-300 disabled:opacity-50"
      >
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </div>
  );
};