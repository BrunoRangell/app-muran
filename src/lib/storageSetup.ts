
import { supabase } from '@/lib/supabase';

export const verifyStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando disponibilidade do storage...');
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('⚠️ Usuário não autenticado para verificação do storage');
      return false;
    }

    // CORREÇÃO: Verificação mais simples - apenas verificar se conseguimos acessar o storage
    // Removendo tentativa de listar arquivos que pode falhar devido a RLS
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.warn('⚠️ Erro ao listar buckets:', bucketsError.message);
      return false;
    }

    const profileBucket = buckets?.find(bucket => bucket.name === 'profile-photos');
    
    if (!profileBucket) {
      console.warn('⚠️ Bucket profile-photos não encontrado');
      return false;
    }

    console.log('✅ Storage verificado e disponível');
    return true;
  } catch (error) {
    console.warn('⚠️ Erro na verificação do storage:', error);
    return false;
  }
};

// CORREÇÃO: Função simplificada que não executa verificação desnecessária
export const initializeStorage = async (): Promise<void> => {
  console.log('🔧 Storage inicializado (verificação sob demanda)');
};
