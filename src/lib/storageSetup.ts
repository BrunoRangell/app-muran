
import { supabase } from '@/integrations/supabase/client';

export const verifyStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando bucket profile-photos...');
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('⚠️ Usuário não autenticado para verificação do storage');
      return false;
    }

    console.log('👤 Usuário autenticado:', user.email, 'ID:', user.id);

    // Tentar obter URL pública de um arquivo de teste para verificar se o bucket existe
    try {
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl('test-access');
      
      if (data && data.publicUrl) {
        console.log('✅ Bucket profile-photos acessível');
        console.log('🔗 URL de teste:', data.publicUrl);
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

    console.log('📋 Buckets disponíveis:', buckets?.map(b => b.name));

    const profileBucket = buckets?.find(bucket => bucket.name === 'profile-photos');
    
    if (!profileBucket) {
      console.warn('⚠️ Bucket profile-photos não encontrado na lista');
      console.warn('💡 Buckets disponíveis:', buckets?.map(b => b.name).join(', '));
      return false;
    }

    console.log('✅ Bucket encontrado na lista:', profileBucket);
    return true;
  } catch (error) {
    console.warn('⚠️ Erro na verificação do storage:', error);
    return false;
  }
};

export const createStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔧 Tentando criar bucket profile-photos...');
    
    const { data, error } = await supabase.storage.createBucket('profile-photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Erro ao criar bucket:', error);
      return false;
    }

    console.log('✅ Bucket criado com sucesso:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro na criação do bucket:', error);
    return false;
  }
};

export const initializeStorage = async (): Promise<void> => {
  console.log('🔧 Inicializando storage...');
  
  const bucketExists = await verifyStorageBucket();
  
  if (!bucketExists) {
    console.log('📦 Bucket não existe, tentando criar...');
    const created = await createStorageBucket();
    
    if (!created) {
      console.warn('⚠️ Não foi possível criar o bucket automaticamente');
      console.warn('💡 Verifique as permissões do storage no Supabase');
    }
  }
};
