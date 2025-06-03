
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UserProfileForm } from "@/components/settings/UserProfileForm";

export default function Settings() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Link 
          to="/" 
          className="flex items-center text-[#ff6e00] hover:text-[#cc5800] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32] mb-8">
        Configurações
      </h1>

      <UserProfileForm />
    </div>
  );
}
