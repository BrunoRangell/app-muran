import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Endereço do gestor de tarefas da Muran (substituiu o módulo /tarefas deste app). */
export const GESTOR_URL = "https://clickup.muranmarketing.com.br";

/** Manda qualquer endereço antigo /tarefas/... para o gestor, com o mesmo caminho, ?query e #hash. */
export const GestorRedirect = () => {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    window.location.replace(`${GESTOR_URL}${pathname}${search}${hash}`);
  }, [pathname, search, hash]);
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Abrindo o gestor de tarefas…
    </div>
  );
};
