import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckSquare, Loader2 } from "lucide-react";

/** Login dedicado ao módulo de tarefas (mesma auth do Supabase, tela própria). */
const TasksLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo") || "/tarefas";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(returnTo, { replace: true });
    });
  }, [navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Credenciais inválidas. Verifique e tente novamente.");
      return;
    }
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="tasks-dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <CheckSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Tarefas Muran</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Acesse o workspace de tarefas da equipe
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card/60 p-6 shadow-lg backdrop-blur"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[13px]">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="tasks-email">E-mail</Label>
            <Input
              id="tasks-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tasks-password">Senha</Label>
            <Input
              id="tasks-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar em Tarefas
          </Button>
          <p className="text-center text-[12px] text-muted-foreground">
            Recebeu um convite por e-mail? Use o link do convite para definir sua senha.
          </p>
        </form>
      </div>
    </div>
  );
};

export default TasksLogin;
