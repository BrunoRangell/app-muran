import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  UserCog,
  Shield,
  LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Shield, label: "Admin", path: "/admin" },
];

const regularMenuItems = [
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: Users, label: "Equipe", path: "/gestores" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('role')
            .eq('email', session.user.email)
            .single();

          setIsAdmin(teamMember?.role === 'admin');
        }
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Iniciando processo de logout...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erro ao fazer logout:", error);
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: "Não foi possível fazer logout. Tente novamente.",
        });
        return;
      }

      console.log("Logout realizado com sucesso");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    }
  };

  const menuItems = isAdmin 
    ? [...adminMenuItems, ...regularMenuItems]
    : regularMenuItems;

  return (
    <div className="h-screen w-64 bg-muran-complementary text-white p-4 fixed left-0 top-0">
      <div className="flex items-center justify-center mb-8">
        <img 
          src="/lovable-uploads/397f32ec-90a7-4d37-b618-cae2c3cef585.png" 
          alt="Muran" 
          className="h-12"
        />
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-muran-primary text-white" 
                  : "hover:bg-muran-complementary/80 text-gray-300"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-muran-complementary/80 text-gray-300"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};