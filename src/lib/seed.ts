import { supabase } from './supabase';

export const seedInitialData = async () => {
  try {
    // Inserir Pedro Henrique como primeiro gestor
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .insert([
        { name: 'Pedro Henrique' }
      ])
      .select()
      .single();

    if (managerError) throw managerError;

    console.log('Gestor inicial criado com sucesso:', manager);

    // Inserir alguns salários de exemplo
    const { error: salaryError } = await supabase
      .from('salaries')
      .insert([
        {
          manager_id: manager.id,
          month: new Date('2024-01-01'),
          amount: 3500.00
        },
        {
          manager_id: manager.id,
          month: new Date('2024-02-01'),
          amount: 3500.00
        },
        {
          manager_id: manager.id,
          month: new Date('2024-03-01'),
          amount: 3800.00
        }
      ]);

    if (salaryError) throw salaryError;

    console.log('Salários iniciais criados com sucesso');
  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    throw error;
  }
};