
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { CompanySection } from "./client-form/CompanySection";
import { PaymentSection } from "./client-form/PaymentSection";
import { StatusSection } from "./client-form/StatusSection";
import { ContactSection } from "./client-form/ContactSection";
import { useClientForm } from "@/hooks/useClientForm";

interface ClientFormProps {
  initialData?: any;
  onSuccess?: (data: any) => Promise<void> | void;
}

export const ClientForm = ({ initialData, onSuccess }: ClientFormProps) => {
  const {
    form,
    isLoading,
    showLastPaymentDate,
    handleSubmit,
    handleDelete,
  } = useClientForm({ 
    initialData, 
    onSuccess: onSuccess || (() => {})
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CompanySection form={form} />
          <PaymentSection form={form} />
          <StatusSection form={form} showLastPaymentDate={showLastPaymentDate} />
          <ContactSection form={form} />
        </div>

        <div className="flex justify-between mt-4">
          {initialData && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Cliente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente {initialData.company_name}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" disabled={isLoading} className="bg-muran-primary hover:bg-muran-primary/90 ml-auto">
            {isLoading ? "Salvando..." : initialData ? "Atualizar cliente" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
