import { supabase } from "./supabase";

export const seedInitialData = async () => {
  try {
    console.log('Iniciando criação de dados iniciais...');

    // Verificar se já existe um gestor
    const { data: existingManager, error: existingManagerError } = await supabase
      .from('managers')
      .select('id, uuid')
      .single();

    if (existingManagerError && existingManagerError.code !== 'PGRST116') {
      console.error('Erro ao verificar gestor existente:', existingManagerError);
      throw existingManagerError;
    }

    let manager = existingManager;

    // Se não existir gestor, criar um novo
    if (!existingManager) {
      console.log('Nenhum gestor encontrado, criando novo gestor...');
      const { data: newManager, error: managerError } = await supabase
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

      console.log('Gestor criado com sucesso:', newManager);
      manager = newManager;
    } else {
      console.log('Gestor existente encontrado:', existingManager);
    }

    // Verificar se já existem salários para este gestor
    const { data: existingSalaries, error: existingSalariesError } = await supabase
      .from('salaries')
      .select('*')
      .eq('manager_id', manager.uuid);

    if (existingSalariesError) {
      console.error('Erro ao verificar salários existentes:', existingSalariesError);
      throw existingSalariesError;
    }

    if (existingSalaries && existingSalaries.length > 0) {
      console.log('Salários já existem para este gestor:', existingSalaries);
      return { success: true, message: 'Dados já existem' };
    }

    // Inserir salários usando o UUID do gestor
    const salariesData = [
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
    ];

    console.log('Inserindo salários:', salariesData);

    const { error: salaryError } = await supabase
      .from('salaries')
      .insert(salariesData);

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