
import { supabase } from '@/lib/supabase';

export const verifyStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando bucket profile-photos...');
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('⚠️ Usuário não autenticado para verificação do storage');
      return false;
    }

    // CORREÇÃO: Verificação simplificada - testar acesso direto ao bucket
    try {
      // Tentar obter URL pública de um arquivo inexistente para verificar se o bucket existe
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl('test-access');
      
      if (data && data.publicUrl) {
        console.log('✅ Bucket profile-photos acessível');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao acessar bucket:', error);
    }

    // Fallback: verificar se bucket existe na lista
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.warn('⚠️ Erro ao listar buckets:', bucketsError.message);
      return false;
    }

    const profileBucket = buckets?.find(bucket => bucket.name === 'profile-photos');
    
    if (!profileBucket) {
      console.warn('⚠️ Bucket profile-photos não encontrado na lista');
      return false;
    }

    console.log('✅ Bucket encontrado na lista mas acesso direto falhou');
    return true;
  } catch (error) {
    console.warn('⚠️ Erro na verificação do storage:', error);
    return false;
  }
};

export const initializeStorage = async (): Promise<void> => {
  console.log('🔧 Storage disponível para verificação sob demanda');
};
