import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

export const seedInitialData = async () => {
  try {
    console.log('Iniciando criação de dados iniciais...');

    // Verificar se já existe um usuário na sessão
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erro ao verificar sessão:', sessionError);
      throw sessionError;
    }

    if (!sessionData.session?.user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const userId = sessionData.session.user.id;
    console.log('ID do usuário:', userId);

    // Verificar se já existem salários para este usuário
    const { data: existingSalaries, error: existingSalariesError } = await supabase
      .from('salaries')
      .select('*')
      .eq('user_id', userId);

    if (existingSalariesError) {
      console.error('Erro ao verificar salários existentes:', existingSalariesError);
      throw existingSalariesError;
    }

    if (existingSalaries && existingSalaries.length > 0) {
      console.log('Salários já existem para este usuário:', existingSalaries);
      return { success: true, message: 'Dados já existem' };
    }

    // Inserir salários usando o ID do usuário
    const salariesData = [
      { 
        id: uuidv4(),
        user_id: userId, 
        month: new Date('2024-10-05').toISOString(), 
        amount: 1000.00 
      },
      { 
        id: uuidv4(),
        user_id: userId, 
        month: new Date('2024-11-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        user_id: userId, 
        month: new Date('2024-12-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        user_id: userId, 
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