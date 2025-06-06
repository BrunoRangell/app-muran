
import { supabase } from '@/lib/supabase';

export const ensureStorageBucket = async () => {
  try {
    console.log('Verificando bucket profile-photos...');
    
    // Apenas verificar se o bucket existe - não tentar criar
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photos');
    
    if (bucketExists) {
      console.log('Bucket profile-photos encontrado e funcionando');
      return true;
    } else {
      console.warn('Bucket profile-photos não encontrado');
      return false;
    }
  } catch (error) {
    console.error('Erro na verificação do storage:', error);
    return false;
  }
};
