
import { supabase } from "@/lib/supabase";

export interface DataServiceConfig {
  tableName: string;
  selectFields?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class UnifiedDataService {
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    this.config = {
      selectFields: "*",
      orderBy: "created_at",
      orderDirection: "desc",
      ...config
    };
  }

  async getAll(filters: Record<string, any> = {}) {
    let query = supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!);

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Aplicar ordenação
    if (this.config.orderBy) {
      query = query.order(this.config.orderBy, { 
        ascending: this.config.orderDirection === 'asc' 
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Erro ao buscar dados de ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível carregar dados de ${this.config.tableName}`);
    }

    return data;
  }

  async getById(id: string | number) {
    const { data, error } = await supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Erro ao buscar item ${id} de ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível carregar o item`);
    }

    return data;
  }

  async create(data: Record<string, any>) {
    const { data: result, error } = await supabase
      .from(this.config.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao criar item em ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível criar o item`);
    }

    return result;
  }

  async update(id: string | number, data: Record<string, any>) {
    const { data: result, error } = await supabase
      .from(this.config.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar item ${id} em ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível atualizar o item`);
    }

    return result;
  }

  async delete(id: string | number) {
    const { error } = await supabase
      .from(this.config.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar item ${id} de ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível deletar o item`);
    }

    return true;
  }

  async search(searchTerm: string, searchFields: string[]) {
    let query = supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!);

    // Construir consulta de busca
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',');
      
      query = query.or(searchConditions);
    }

    if (this.config.orderBy) {
      query = query.order(this.config.orderBy, { 
        ascending: this.config.orderDirection === 'asc' 
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Erro ao buscar em ${this.config.tableName}:`, error);
      throw new Error(`Não foi possível realizar a busca`);
    }

    return data;
  }
}

// Instâncias pré-configuradas para uso comum
export const clientsService = new UnifiedDataService({
  tableName: 'clients',
  orderBy: 'company_name',
  orderDirection: 'asc'
});

export const paymentsService = new UnifiedDataService({
  tableName: 'payments',
  selectFields: '*, clients(company_name)',
  orderBy: 'payment_date',
  orderDirection: 'desc'
});

export const costsService = new UnifiedDataService({
  tableName: 'costs',
  orderBy: 'date',
  orderDirection: 'desc'
});
