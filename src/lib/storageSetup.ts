
import { supabase } from '@/lib/supabase';

export const verifyStorageBucket = async (): Promise<boolean> => {
  try {
    // Apenas verificar se o bucket existe e está acessível
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .list('', { limit: 1 });

    if (error) {
      console.warn('⚠️ Storage não está disponível:', error.message);
      return false;
    }

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
  }
};
