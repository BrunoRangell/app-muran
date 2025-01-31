import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  UserCog,
  Shield,
  LogOut
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: Users, label: "Equipe", path: "/gestores" },
  { icon: Shield, label: "Admin", path: "/admin" },
];

export const Sidebar = () => {
  const location = useLocation();

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
        <button className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-muran-complementary/80 text-gray-300">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};