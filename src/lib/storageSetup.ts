
import { supabase } from '@/lib/supabase';

export const ensureStorageBucket = async () => {
  try {
    console.log('Verificando bucket profile-photos...');
    
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photos');
    
    if (!bucketExists) {
      console.log('Bucket não existe, criando...');
      // Criar bucket se não existir
      const { error: createError } = await supabase.storage.createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Erro ao criar bucket:', createError);
      } else {
        console.log('Bucket profile-photos criado com sucesso');
      }
    } else {
      console.log('Bucket profile-photos já existe');
    }
  } catch (error) {
    console.error('Erro na configuração do storage:', error);
  }
};
