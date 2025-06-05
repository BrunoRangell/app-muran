
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Shield, 
  Share2, 
  Briefcase,
  Check
} from "lucide-react";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: "profile",
    label: "Perfil Pessoal",
    icon: User,
    description: "Informações básicas e foto"
  },
  {
    id: "security",
    label: "Conta e Segurança",
    icon: Shield,
    description: "Email e configurações de segurança"
  },
  {
    id: "social",
    label: "Redes Sociais",
    icon: Share2,
    description: "Links profissionais"
  },
  {
    id: "professional",
    label: "Configurações Profissionais",
    icon: Briefcase,
    description: "Cargo e permissões"
  }
];

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSave: () => void;
  isLoading: boolean;
  hasChanges: boolean;
}

export const SettingsLayout = ({ 
  children, 
  activeSection, 
  onSectionChange, 
  onSave, 
  isLoading, 
  hasChanges 
}: SettingsLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header da Sidebar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#ff6e00] rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#321e32]">Configurações</h1>
                <p className="text-sm text-gray-600">Gerencie sua conta</p>
              </div>
            </div>
          </div>

          {/* Menu de Navegação */}
          <div className="flex-1 p-4 space-y-2">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? "bg-[#ff6e00] text-white shadow-md" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${
                      isActive ? "text-white" : "text-[#ff6e00]"
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{section.label}</div>
                      <div className={`text-xs mt-1 ${
                        isActive ? "text-orange-100" : "text-gray-500"
                      }`}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-gray-200">
            <Button 
              onClick={onSave}
              disabled={!hasChanges || isLoading}
              className="w-full bg-[#ff6e00] hover:bg-[#e56200] text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            
            {hasChanges && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                Você tem alterações não salvas
              </p>
            )}
          </div>
        </div>

        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header da Área Principal */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#321e32]">
                  {settingsSections.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="text-gray-600 mt-1">
                  {settingsSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <Card>
                <CardContent className="p-6">
                  {children}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
