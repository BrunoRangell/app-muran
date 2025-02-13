
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CostMainCategory, CostSubcategory } from "@/types/cost";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { costFormSchema, CostFormData } from "../schemas/costFormSchema";

export function useNewCostForm(onOpenChange: (open: boolean) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      main_category: "custos_diretos_operacao",
      subcategory: "marketing_aquisicao",
      date: new Date().toISOString().split("T")[0],
      description: "",
      tags: [],
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
      main_category: "custos_diretos_operacao",
      subcategory: "marketing_aquisicao",
      date: new Date().toISOString().split("T")[0],
      description: "",
      tags: [],
    });
  };

  const onSubmit = async (data: CostFormData) => {
    setIsLoading(true);
    try {
      // 1. Insere o custo
      const { data: newCost, error: costError } = await supabase
        .from("costs")
        .insert({
          name: data.name,
          amount: parseCurrencyToNumber(data.amount),
          main_category: data.main_category as CostMainCategory,
          subcategory: data.subcategory as CostSubcategory,
          date: data.date,
          description: data.description || null,
        })
        .select()
        .single();

      if (costError) throw costError;
      if (!newCost) throw new Error("Falha ao criar custo");

      // 2. Processa as tags
      if (data.tags && data.tags.length > 0) {
        // Insere ou recupera as tags existentes
        const tagsPromises = data.tags.map(async (tagName) => {
          const { data: existingTag } = await supabase
            .from("cost_tags")
            .select("id")
            .eq("name", tagName)
            .single();

          if (existingTag) {
            return existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from("cost_tags")
              .insert({ name: tagName })
              .select("id")
              .single();

            if (tagError) throw tagError;
            return newTag.id;
          }
        });

        const tagIds = await Promise.all(tagsPromises);

        // Associa as tags ao custo
        const costsTagsData = tagIds.map((tagId) => ({
          cost_id: newCost.id,
          tag_id: tagId,
        }));

        const { error: costsTagsError } = await supabase
          .from("costs_tags")
          .insert(costsTagsData);

        if (costsTagsError) throw costsTagsError;
      }

      toast({
        title: "Custo registrado",
        description: "O custo foi registrado com sucesso!",
      });

      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["costs"] });
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
  };

  return {
    form,
    isLoading,
    handleAmountChange,
    onSubmit,
    resetForm,
  };
}
