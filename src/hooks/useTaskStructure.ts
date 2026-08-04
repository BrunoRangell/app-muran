import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GroupBy,
  ListKind,
  TaskSpace,
  SortBy,
  TaskFolder,
  TaskList,
  TaskView,
  TaskViewFilters,
  ViewType,
} from "@/types/tasks";
import { useToast } from "@/hooks/use-toast";

const SPACE_SELECT = "id, name, color, icon, position, created_at";
const FOLDER_SELECT = "id, space_id, name, color, icon, position, created_at";
const LIST_SELECT = "id, folder_id, name, kind, position, created_at";
const VIEW_SELECT =
  "id, list_id, name, view_type, group_by, sort_by, filters, position, is_private, owner_id, slot, created_at";

/* ---------------------------------- espaços -------------------------------- */

export const useTaskSpaces = () =>
  useQuery({
    queryKey: ["task-spaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_spaces")
        .select(SPACE_SELECT)
        .order("position")
        .order("name");
      if (error) throw error;
      return (data || []) as TaskSpace[];
    },
  });

export interface SpaceInput {
  name: string;
  color?: string;
  icon?: string | null;
  position?: number;
}

export const useCreateSpace = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: SpaceInput) => {
      const { data, error } = await supabase
        .from("task_spaces")
        .insert(input as never)
        .select(SPACE_SELECT)
        .single();
      if (error) throw error;
      return data as TaskSpace;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-spaces"] });
      toast({ title: "Espaço criado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar espaço", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateSpace = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpaceInput> & { id: string }) => {
      const { error } = await supabase.from("task_spaces").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-spaces"] }),
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar espaço", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteSpace = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_spaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-spaces"] });
      qc.invalidateQueries({ queryKey: ["task-folders"] });
      toast({ title: "Espaço excluído" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir espaço", description: e.message, variant: "destructive" }),
  });
};

/* ---------------------------------- pastas --------------------------------- */

export const useTaskFolders = (spaceId?: string) =>
  useQuery({
    queryKey: ["task-folders", spaceId ?? "all"],
    enabled: spaceId === undefined ? true : !!spaceId,
    queryFn: async () => {
      let query = supabase.from("task_folders").select(FOLDER_SELECT);
      if (spaceId) query = query.eq("space_id", spaceId);
      const { data, error } = await query.order("position").order("name");
      if (error) throw error;
      return (data || []) as TaskFolder[];
    },
  });

export interface FolderInput {
  space_id: string;
  name: string;
  color?: string;
  icon?: string | null;
  position?: number;
}

export const useCreateFolder = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: FolderInput) => {
      const { data, error } = await supabase
        .from("task_folders")
        .insert(input as never)
        .select(FOLDER_SELECT)
        .single();
      if (error) throw error;
      return data as TaskFolder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-folders"] });
      toast({ title: "Pasta criada" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar pasta", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateFolder = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FolderInput> & { id: string }) => {
      const { error } = await supabase.from("task_folders").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-folders"] }),
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar pasta", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteFolder = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-folders"] });
      qc.invalidateQueries({ queryKey: ["task-lists"] });
      toast({ title: "Pasta excluída" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir pasta", description: e.message, variant: "destructive" }),
  });
};

/* ---------------------------------- listas --------------------------------- */

export const useTaskLists = (folderId?: string) =>
  useQuery({
    queryKey: ["task-lists", folderId],
    enabled: !!folderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_lists")
        .select(LIST_SELECT)
        .eq("folder_id", folderId!)
        .order("position")
        .order("name");
      if (error) throw error;
      return (data || []) as TaskList[];
    },
  });

export const useCreateList = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      folder_id: string;
      name: string;
      kind?: ListKind;
      position?: number;
    }) => {
      const { data, error } = await supabase
        .from("task_lists")
        .insert(input as never)
        .select(LIST_SELECT)
        .single();
      if (error) throw error;
      return data as TaskList;
    },
    onSuccess: (list) => {
      qc.invalidateQueries({ queryKey: ["task-lists", list.folder_id] });
      toast({ title: "Lista criada" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar lista", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateList = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; position?: number }) => {
      const { error } = await supabase.from("task_lists").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-lists"] }),
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar lista", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteList = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-lists"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Lista excluída" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir lista", description: e.message, variant: "destructive" }),
  });
};

/* ------------------------------ visualizações ------------------------------ */

/**
 * Visualizações salvas de uma lista. `listId = null` representa o contexto
 * global "Minhas tarefas" (task_views.list_id is null).
 */
export const useTaskViews = (listId?: string | null) =>
  useQuery({
    queryKey: ["task-views", listId ?? "global"],
    enabled: listId !== undefined,
    queryFn: async () => {
      let query = supabase.from("task_views").select(VIEW_SELECT);
      query = listId === null ? query.is("list_id", null) : query.eq("list_id", listId!);
      const { data, error } = await query.order("position").order("created_at");
      if (error) throw error;
      return (data || []).map((v) => ({
        ...v,
        filters: (v.filters ?? {}) as TaskViewFilters,
      })) as TaskView[];
    },
  });

export interface ViewInput {
  list_id: string | null;
  name: string;
  view_type: ViewType;
  group_by: GroupBy;
  sort_by?: string | null;
  filters?: TaskViewFilters;
  position?: number;
  is_private?: boolean;
  owner_id?: string | null;
  /** 'list'/'board' quando a view substitui a aba padrão do contexto. */
  slot?: ViewSlot | null;
}

export const useCreateView = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: ViewInput) => {
      const { data, error } = await supabase
        .from("task_views")
        .insert({ filters: {}, ...input } as never)
        .select(VIEW_SELECT)
        .single();
      if (error) throw error;
      return data as unknown as TaskView;
    },
    onSuccess: (view) => {
      qc.invalidateQueries({ queryKey: ["task-views", view.list_id ?? "global"] });
      toast({ title: "Visualização criada" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar visualização", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateView = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ViewInput> & { id: string }) => {
      const { error } = await supabase.from("task_views").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-views"] }),
    onError: (e: Error) =>
      toast({
        title: "Erro ao atualizar visualização",
        description: e.message,
        variant: "destructive",
      }),
  });
};

export const useDeleteView = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_views").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-views"] });
      toast({ title: "Visualização excluída" });
    },
    onError: (e: Error) =>
      toast({
        title: "Erro ao excluir visualização",
        description: e.message,
        variant: "destructive",
      }),
  });
};
