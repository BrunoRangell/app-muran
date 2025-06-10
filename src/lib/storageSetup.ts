
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

    // Verificar se o bucket existe
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

    // Tentar listar arquivos no bucket para verificar permissões
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .list('', { limit: 1 });

    if (error) {
      console.warn('⚠️ Storage não está acessível:', error.message);
      return false;
    }

    console.log('✅ Storage verificado e disponível');
    return true;
  } catch (error) {
    console.warn('⚠️ Erro na verificação do storage:', error);
    return false;
  }
};

export const initializeStorage = async (): Promise<void> => {
  const isAvailable = await verifyStorageBucket();
  if (!isAvailable) {
    console.warn('⚠️ Storage limitado - funcionalidade de upload pode não funcionar');
  } else {
    console.log('✅ Storage inicializado com sucesso');
  }
};
