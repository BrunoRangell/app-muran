
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export const IntegrationsSection = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#321e32] mb-2">APIs e Integrações</h3>
        <p className="text-gray-600">Gerencie suas integrações com serviços externos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Ads */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Ads</CardTitle>
                  <CardDescription className="text-xs">
                    Integração com campanhas
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Conectado para análise de campanhas e orçamentos diários.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Meta Ads */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Meta Ads</CardTitle>
                  <CardDescription className="text-xs">
                    Facebook e Instagram Ads
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Conectado para revisões diárias e análise de performance.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Supabase */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Supabase</CardTitle>
                  <CardDescription className="text-xs">
                    Banco de dados e auth
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Sistema de autenticação e banco de dados principal.
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Sistema Principal
            </Button>
          </CardContent>
        </Card>

        {/* Nova Integração */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <ExternalLink className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-600 mb-2">Nova Integração</h4>
            <p className="text-sm text-gray-500 mb-4">
              Adicione uma nova integração ao sistema
            </p>
            <Button variant="outline" size="sm">
              Adicionar Integração
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">🔐 Segurança das Integrações</h4>
        <p className="text-blue-700 text-sm">
          Todas as integrações são protegidas com tokens seguros e criptografia. 
          Monitore regularmente o status das conexões para garantir o funcionamento adequado.
        </p>
      </div>
    </div>
  );
};
