
import { supabase } from '@/lib/supabase';

export const ensureStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando bucket profile-photos...');
    
    // Verificar se o bucket existe listando buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photos');
    
    if (bucketExists) {
      console.log('✅ Bucket profile-photos já existe');
      return true;
    }

    // Tentar criar o bucket se não existir
    console.log('📦 Criando bucket profile-photos...');
    const { error: createError } = await supabase.storage.createBucket('profile-photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      return false;
    }

    console.log('✅ Bucket profile-photos criado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação do storage:', error);
    return false;
  }
};

export const initializeStorage = async (): Promise<void> => {
  const isAvailable = await ensureStorageBucket();
  if (!isAvailable) {
    console.warn('⚠️ Storage não está disponível - funcionalidade de upload será limitada');
  }
};
