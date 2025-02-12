
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CostCategory } from "@/types/cost";
import { parseCurrencyToNumber } from "@/utils/formatters";

const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.enum(["marketing", "salarios", "impostos", "servicos", "equipamentos", "software", "outros"] as const),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

type CostFormData = z.infer<typeof costFormSchema>;

interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const costCategories = [
  { value: "marketing", label: "Marketing" },
  { value: "salarios", label: "Salários" },
  { value: "impostos", label: "Impostos" },
  { value: "servicos", label: "Serviços" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "software", label: "Software" },
  { value: "outros", label: "Outros" },
];

export function NewCostDialog({ open, onOpenChange }: NewCostDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      category: "outros",
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const amount = numericValue ? parseFloat(numericValue) / 100 : 0;
    form.setValue(
      "amount",
      amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
  };

  const resetForm = () => {
    form.reset({
      name: "",
      amount: "",
      category: "outros",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
  };

  async function onSubmit(data: CostFormData) {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("costs").insert({
        name: data.name,
        amount: parseCurrencyToNumber(data.amount),
        category: data.category as CostCategory,
        date: data.date,
        description: data.description || null,
      });

      if (error) {
        console.error("Erro ao registrar custo:", error);
        throw error;
      }

      toast({
        title: "Custo registrado",
        description: "O custo foi registrado com sucesso!",
      });

      // Reseta o formulário
      resetForm();
      
      // Atualiza a lista de custos
      await queryClient.invalidateQueries({ queryKey: ["costs"] });
      
      // Fecha o modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar custo:", error);
      toast({
        title: "Erro ao registrar custo",
        description: "Não foi possível registrar o custo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Custo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {costCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
