
import { toast } from "@/hooks/use-toast";

// Mensagens padrão para operações comuns
const TOAST_MESSAGES = {
  clients: {
    created: "Cliente cadastrado com sucesso!",
    updated: "Cliente atualizado com sucesso!",
    deleted: "Cliente excluído com sucesso!",
    loadError: "Erro ao carregar clientes",
    createError: "Erro ao criar cliente",
    updateError: "Erro ao atualizar cliente",
    deleteError: "Erro ao excluir cliente"
  },
  payments: {
    created: "Pagamento registrado com sucesso!",
    updated: "Pagamento atualizado com sucesso!",
    deleted: "Pagamento excluído com sucesso!",
    loadError: "Erro ao carregar pagamentos",
    createError: "Erro ao registrar pagamento",
    updateError: "Erro ao atualizar pagamento",
    deleteError: "Erro ao excluir pagamento"
  },
  costs: {
    created: "Custo cadastrado com sucesso!",
    updated: "Custo atualizado com sucesso!",
    deleted: "Custo excluído com sucesso!",
    loadError: "Erro ao carregar custos",
    createError: "Erro ao cadastrar custo",
    updateError: "Erro ao atualizar custo",
    deleteError: "Erro ao excluir custo"
  }
};

export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
  });
};

export const showClientSuccessToast = (operation: keyof typeof TOAST_MESSAGES.clients) => {
  showSuccessToast("Sucesso", TOAST_MESSAGES.clients[operation]);
};

export const showClientErrorToast = (operation: keyof typeof TOAST_MESSAGES.clients) => {
  showErrorToast("Erro", TOAST_MESSAGES.clients[operation]);
};

export const showPaymentSuccessToast = (operation: keyof typeof TOAST_MESSAGES.payments) => {
  showSuccessToast("Sucesso", TOAST_MESSAGES.payments[operation]);
};

export const showPaymentErrorToast = (operation: keyof typeof TOAST_MESSAGES.payments) => {
  showErrorToast("Erro", TOAST_MESSAGES.payments[operation]);
};

export const showCostSuccessToast = (operation: keyof typeof TOAST_MESSAGES.costs) => {
  showSuccessToast("Sucesso", TOAST_MESSAGES.costs[operation]);
};

export const showCostErrorToast = (operation: keyof typeof TOAST_MESSAGES.costs) => {
  showErrorToast("Erro", TOAST_MESSAGES.costs[operation]);
};

// Função genérica para operações de dados
export const showDataOperationToast = (
  entity: 'clients' | 'payments' | 'costs',
  operation: 'created' | 'updated' | 'deleted' | 'loadError' | 'createError' | 'updateError' | 'deleteError'
) => {
  const message = TOAST_MESSAGES[entity][operation];
  const isError = operation.includes('Error');
  
  if (isError) {
    showErrorToast("Erro", message);
  } else {
    showSuccessToast("Sucesso", message);
  }
};
