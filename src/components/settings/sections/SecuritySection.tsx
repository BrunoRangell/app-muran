
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SecuritySectionProps {
  currentEmail: string;
}

export const SecuritySection = ({ currentEmail }: SecuritySectionProps) => {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleEmailUpdate = async () => {
    if (!newEmail) return;
    
    try {
      setIsUpdatingEmail(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast({
        title: "Email de confirmação enviado",
        description: "Verifique sua caixa de entrada para confirmar o novo email.",
      });
      
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar email",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "Verifique se os campos estão preenchidos corretamente.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alteração de Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-[#ff6e00]" />
            <CardTitle className="text-lg">Email da Conta</CardTitle>
          </div>
          <CardDescription>
            Altere o email associado à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Atual</Label>
            <Input 
              value={currentEmail} 
              disabled 
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <Label>Novo Email</Label>
            <Input 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="novo@email.com"
              className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
            />
          </div>
          
          <Button 
            onClick={handleEmailUpdate}
            disabled={!newEmail || isUpdatingEmail}
            className="bg-[#ff6e00] hover:bg-[#e56200]"
          >
            {isUpdatingEmail ? "Atualizando..." : "Atualizar Email"}
          </Button>
        </CardContent>
      </Card>

      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-[#ff6e00]" />
            <CardTitle className="text-lg">Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Senha Atual</Label>
            <Input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
            />
          </div>
          
          <div>
            <Label>Nova Senha</Label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
            />
          </div>
          
          <div>
            <Label>Confirmar Nova Senha</Label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="focus:ring-[#ff6e00] focus:border-[#ff6e00]"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">As senhas não coincidem</p>
            )}
          </div>
          
          <Button 
            onClick={handlePasswordUpdate}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isUpdatingPassword}
            className="bg-[#ff6e00] hover:bg-[#e56200]"
          >
            {isUpdatingPassword ? "Atualizando..." : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Dicas de Segurança</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Use uma senha forte com pelo menos 8 caracteres</li>
                <li>• Inclua letras maiúsculas, minúsculas, números e símbolos</li>
                <li>• Não compartilhe sua senha com outras pessoas</li>
                <li>• Altere sua senha regularmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
