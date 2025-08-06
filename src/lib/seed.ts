import { supabase } from "@/integrations/supabase/client";
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

    // Primeiro, verificar se já existe um registro em team_members
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('*')
      .eq('manager_id', userId)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Erro ao verificar membro existente:', memberCheckError);
      throw memberCheckError;
    }

    // Se não existir, criar o registro em team_members
    if (!existingMember) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: createMemberError } = await supabase
        .from('team_members')
        .insert([{
          manager_id: userId,
          name: userData.user.user_metadata.name || 'Usuário',
          email: userData.user.email,
          role: userData.user.user_metadata.role || 'Gestor'
        }]);

      if (createMemberError) {
        console.error('Erro ao criar membro:', createMemberError);
        throw createMemberError;
      }
    }

    // Verificar se já existem salários para este usuário
    const { data: existingSalaries, error: existingSalariesError } = await supabase
      .from('salaries')
      .select('*')
      .eq('manager_id', userId);

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
        manager_id: userId, 
        month: new Date('2024-01-05').toISOString(), 
        amount: 1000.00 
      },
      { 
        id: uuidv4(),
        manager_id: userId, 
        month: new Date('2024-02-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        manager_id: userId, 
        month: new Date('2024-03-05').toISOString(), 
        amount: 1300.00 
      },
      { 
        id: uuidv4(),
        manager_id: userId, 
        month: new Date('2024-04-05').toISOString(), 
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