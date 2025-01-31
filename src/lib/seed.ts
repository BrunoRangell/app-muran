import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

export const seedInitialData = async () => {
  try {
    console.log('Iniciando criação de dados iniciais...');

    // Verificar se já existe um gestor
    const { data: existingManagers, error: existingManagerError } = await supabase
      .from('managers')
      .select('*');

    if (existingManagerError) {
      console.error('Erro ao verificar gestor existente:', existingManagerError);
      throw existingManagerError;
    }

    let manager = existingManagers?.[0];

    // Se não existir gestor, criar um novo
    if (!existingManagers || existingManagers.length === 0) {
      console.log('Nenhum gestor encontrado, criando novo gestor...');
      const managerId = uuidv4();
      const { data: newManager, error: managerError } = await supabase
        .from('managers')
        .insert([{ 
          id: managerId,
          name: 'Pedro Henrique' 
        }])
        .select()
        .single();

      if (managerError) {
        console.error('Erro ao criar gestor:', managerError);
        throw managerError;
      }

      console.log('Gestor criado com sucesso:', newManager);
      manager = newManager;
    } else {
      console.log('Gestor existente encontrado:', manager);
    }

    if (!manager?.id) {
      throw new Error('ID do gestor não encontrado');
    }

    // Verificar se já existem salários para este gestor
    const { data: existingSalaries, error: existingSalariesError } = await supabase
      .from('salaries')
      .select('*')
      .eq('manager_id', manager.id);

    if (existingSalariesError) {
      console.error('Erro ao verificar salários existentes:', existingSalariesError);
      throw existingSalariesError;
    }

    if (existingSalaries && existingSalaries.length > 0) {
      console.log('Salários já existem para este gestor:', existingSalaries);
      return { success: true, message: 'Dados já existem' };
    }

    // Inserir salários usando o ID do gestor
    const salariesData = [
      { 
        id: uuidv4(),
        manager_id: manager.id, 
        month: new Date('2024-10-05').toISOString(), 
        amount: 1000.00 
      },
      { 
        id: uuidv4(),
        manager_id: manager.id, 
        month: new Date('2024-11-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        manager_id: manager.id, 
        month: new Date('2024-12-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        manager_id: manager.id, 
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