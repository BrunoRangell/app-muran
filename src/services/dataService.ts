
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export interface DataServiceConfig {
  tableName: 'clients' | 'payments' | 'costs' | 'team_members' | 'goals';
  selectFields?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class DataService {
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
    logger.info("DATA_SERVICE", `Buscando dados de ${this.config.tableName}`, filters);

    let query = supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    if (this.config.orderBy) {
      query = query.order(this.config.orderBy, { 
        ascending: this.config.orderDirection === 'asc' 
      });
    }

    const { data, error } = await query;

    if (error) {
      logger.error("DATA_SERVICE", `Erro ao buscar dados de ${this.config.tableName}`, error);
      throw new Error(`Não foi possível carregar dados de ${this.config.tableName}`);
    }

    logger.info("DATA_SERVICE", `Dados retornados: ${data?.length || 0} registros`);
    return data;
  }

  async getById(id: string | number) {
    logger.info("DATA_SERVICE", `Buscando item ${id} de ${this.config.tableName}`);

    const { data, error } = await supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error("DATA_SERVICE", `Erro ao buscar item ${id}`, error);
      throw new Error(`Não foi possível carregar o item`);
    }

    return data;
  }

  async create(data: Record<string, any>) {
    logger.info("DATA_SERVICE", `Criando item em ${this.config.tableName}`, data);

    const { data: result, error } = await supabase
      .from(this.config.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error("DATA_SERVICE", `Erro ao criar item`, error);
      throw new Error(`Não foi possível criar o item`);
    }

    logger.info("DATA_SERVICE", "Item criado com sucesso");
    return result;
  }

  async update(id: string | number, data: Record<string, any>) {
    logger.info("DATA_SERVICE", `Atualizando item ${id}`, data);

    const { data: result, error } = await supabase
      .from(this.config.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error("DATA_SERVICE", `Erro ao atualizar item ${id}`, error);
      throw new Error(`Não foi possível atualizar o item`);
    }

    logger.info("DATA_SERVICE", "Item atualizado com sucesso");
    return result;
  }

  async delete(id: string | number) {
    logger.info("DATA_SERVICE", `Deletando item ${id} de ${this.config.tableName}`);

    const { error } = await supabase
      .from(this.config.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error("DATA_SERVICE", `Erro ao deletar item ${id}`, error);
      throw new Error(`Não foi possível deletar o item`);
    }

    logger.info("DATA_SERVICE", "Item deletado com sucesso");
    return true;
  }

  async search(searchTerm: string, searchFields: string[]) {
    logger.info("DATA_SERVICE", `Buscando em ${this.config.tableName}`, { searchTerm, searchFields });

    let query = supabase
      .from(this.config.tableName)
      .select(this.config.selectFields!);

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
      logger.error("DATA_SERVICE", `Erro ao buscar`, error);
      throw new Error(`Não foi possível realizar a busca`);
    }

    return data;
  }
}

// Instâncias pré-configuradas
export const clientsService = new DataService({
  tableName: 'clients',
  orderBy: 'company_name',
  orderDirection: 'asc'
});

export const paymentsService = new DataService({
  tableName: 'payments',
  selectFields: '*, clients(company_name)',
  orderBy: 'reference_month',
  orderDirection: 'desc'
});

export const costsService = new DataService({
  tableName: 'costs',
  orderBy: 'date',
  orderDirection: 'desc'
});
