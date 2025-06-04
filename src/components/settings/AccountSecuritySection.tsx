
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface AccountSecuritySectionProps {
  currentEmail: string;
}

export const AccountSecuritySection = ({ currentEmail }: AccountSecuritySectionProps) => {
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const { toast } = useToast();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Atualizar o email no formulário quando currentEmail mudar
  useEffect(() => {
    if (currentEmail) {
      emailForm.setValue('email', currentEmail);
    }
  }, [currentEmail, emailForm]);

  const handleEmailUpdate = async (data: EmailFormData) => {
    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) throw error;

      toast({
        title: "E-mail atualizado!",
        description: "Verifique seu novo e-mail para confirmar a alteração.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar e-mail",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-[#ff6e00]">
      <CardHeader className="bg-gradient-to-r from-[#ff6e00]/5 to-transparent pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-[#ff6e00]" />
          <CardTitle className="text-[#321e32] text-lg">Segurança da Conta</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Gerencie seu e-mail e senha de acesso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Seção E-mail */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-[#ff6e00]" />
            <h3 className="text-base font-medium text-[#321e32]">E-mail</h3>
          </div>
          
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-3">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} type="email" className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isChangingEmail}
                size="sm"
                className="bg-[#ff6e00] hover:bg-[#e56200] h-8 px-4"
              >
                {isChangingEmail ? "Atualizando..." : "Atualizar E-mail"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-200"></div>

        {/* Seção Senha */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-[#ff6e00]" />
            <h3 className="text-base font-medium text-[#321e32]">Senha</h3>
          </div>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-3">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Senha atual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showPasswords.current ? "text" : "password"}
                          className="pr-10 h-9"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPasswords.new ? "text" : "password"}
                            className="pr-10 h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Confirmar senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPasswords.confirm ? "text" : "password"}
                            className="pr-10 h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                size="sm"
                className="bg-[#ff6e00] hover:bg-[#e56200] h-8 px-4"
              >
                {isChangingPassword ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </Form>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-xs text-blue-800">
            As alterações de e-mail e senha são processadas pelo sistema de autenticação e não afetam outras informações do perfil.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
