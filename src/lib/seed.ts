import { supabase } from './supabase';

export const seedInitialData = async () => {
  try {
    console.log('Iniciando seed de dados...');
    
    // Inserir gestor
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .insert([
        { name: 'Pedro Henrique' }
      ])
      .select()
      .single();

    if (managerError) {
      console.error('Erro ao criar gestor:', managerError);
      throw managerError;
    }

    console.log('Gestor criado com sucesso:', manager);

    // Inserir salários
    const { error: salaryError } = await supabase
      .from('salaries')
      .insert([
        { 
          manager_id: manager.id, 
          month: new Date('2024-01-01').toISOString(), 
          amount: 3500.00 
        },
        { 
          manager_id: manager.id, 
          month: new Date('2024-02-01').toISOString(), 
          amount: 3500.00 
        },
        { 
          manager_id: manager.id, 
          month: new Date('2024-03-01').toISOString(), 
          amount: 3800.00 
        }
      ]);

    if (salaryError) {
      console.error('Erro ao criar salários:', salaryError);
      throw salaryError;
    }

    console.log('Dados inseridos com sucesso!');

  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    throw error;
  }
};