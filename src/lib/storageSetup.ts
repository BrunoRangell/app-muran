
import { supabase } from '@/lib/supabase';

export const ensureStorageBucket = async () => {
  try {
    console.log('Verificando bucket profile-photos...');
    
    // Tentar acessar o bucket diretamente
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .list('', { limit: 1 });

    if (error) {
      console.error('Erro ao acessar bucket profile-photos:', error);
      
      // Se o erro for "Bucket not found", retornar false
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        console.warn('Bucket profile-photos não existe');
        return false;
      }
      
      // Para outros erros, ainda consideramos que o bucket existe
      console.log('Bucket existe mas houve erro de permissão:', error.message);
      return true;
    }

    console.log('✅ Bucket profile-photos está disponível e funcionando');
    return true;
  } catch (error) {
    console.error('Erro na verificação do storage:', error);
    // Em caso de erro de rede ou outro, assumir que está disponível
    return true;
  }
};
