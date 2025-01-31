import { supabase } from "./supabase";

export const seedInitialData = async () => {
  try {
    console.log('Iniciando criação de dados iniciais...');

    // Criar gestor
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .insert([
        { name: 'Pedro Henrique' }
      ])
      .select('id, uuid')
      .single();

    if (managerError) {
      console.error('Erro ao criar gestor:', managerError);
      throw managerError;
    }

    console.log('Gestor criado com sucesso:', manager);

    // Inserir salários usando o UUID do gestor
    const { error: salaryError } = await supabase
      .from('salaries')
      .insert([
        { 
          manager_id: manager.uuid, 
          month: new Date('2024-10-05').toISOString(), 
          amount: 1000.00 
        },
        { 
          manager_id: manager.uuid, 
          month: new Date('2024-11-05').toISOString(), 
          amount: 1300.00 
        },
        { 
          manager_id: manager.uuid, 
          month: new Date('2024-12-05').toISOString(), 
          amount: 1300.00 
        },
        { 
          manager_id: manager.uuid, 
          month: new Date('2025-01-05').toISOString(), 
          amount: 1300.00 
        }
      ]);

    if (salaryError) {
      console.error('Erro ao criar salários:', salaryError);
      throw salaryError;
    }

    console.log('Dados iniciais criados com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    throw error;
  }
};