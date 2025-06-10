
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface UploadProfilePhotoParams {
  file: File;
  cropData: CropData;
  userId: string;
  currentPhotoUrl?: string;
}

export const useImageUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, cropData, userId, currentPhotoUrl }: UploadProfilePhotoParams) => {
      console.log('🚀 Iniciando upload da foto:', { userId, fileName: file.name });
      setUploadProgress(10);

      // Verificação robusta de autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Verificação de autenticação:', { user: user?.id, authError });
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ Usuário não encontrado');
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o userId corresponde ao usuário autenticado
      if (user.id !== userId) {
        console.error('❌ UserID não corresponde ao usuário autenticado:', { authUserId: user.id, providedUserId: userId });
        throw new Error('ID do usuário não corresponde ao usuário autenticado');
      }

      setUploadProgress(20);

      // Processar imagem com crop
      console.log('🖼️ Processando imagem com crop...');
      const processedBlob = await processImageWithCrop(file, cropData);
      setUploadProgress(40);

      // Deletar foto anterior se existir
      if (currentPhotoUrl) {
        console.log('🗑️ Removendo foto anterior:', currentPhotoUrl);
        await deletePhoto(currentPhotoUrl);
      }
      setUploadProgress(50);

      // Gerar nome do arquivo com estrutura correta: userId/filename
      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      console.log('📁 Nome do arquivo gerado:', fileName);

      // Verificar se o bucket existe e está acessível
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        console.log('📦 Buckets disponíveis:', buckets?.map(b => b.name));
        
        if (bucketsError) {
          console.error('❌ Erro ao listar buckets:', bucketsError);
          throw new Error(`Erro ao acessar storage: ${bucketsError.message}`);
        }

        const profileBucket = buckets?.find(b => b.name === 'profile-photos');
        if (!profileBucket) {
          console.error('❌ Bucket profile-photos não encontrado');
          throw new Error('Bucket de fotos não encontrado');
        }
      } catch (error) {
        console.error('❌ Erro na verificação do bucket:', error);
        throw new Error('Sistema de armazenamento indisponível');
      }

      // Upload da nova foto
      console.log('⬆️ Fazendo upload do arquivo...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, processedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        
        // Tratamento específico para diferentes tipos de erro
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Bucket de armazenamento não encontrado');
        } else if (uploadError.message.includes('Duplicate')) {
          throw new Error('Arquivo já existe. Tente novamente.');
        } else if (uploadError.message.includes('unauthorized')) {
          throw new Error('Sem permissão para fazer upload. Verifique se está logado.');
        } else {
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }
      }

      console.log('✅ Upload realizado com sucesso:', uploadData);
      setUploadProgress(70);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log('🔗 URL pública gerada:', photoUrl);
      setUploadProgress(80);

      // Atualizar banco de dados
      console.log('💾 Atualizando banco de dados...');
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ photo_url: photoUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        
        // Tentar remover o arquivo que foi feito upload se a atualização falhou
        try {
          await supabase.storage.from('profile-photos').remove([fileName]);
          console.log('🧹 Arquivo removido após erro na atualização');
        } catch (cleanupError) {
          console.error('❌ Erro ao limpar arquivo após falha:', cleanupError);
        }
        
        throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      }

      setUploadProgress(100);
      console.log('✅ Processo de upload concluído com sucesso!');
      return photoUrl;
    },
    onSuccess: (photoUrl) => {
      console.log('🎉 Upload finalizado com sucesso:', photoUrl);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['current_user'] });
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      
      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });
      
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      console.error('❌ Erro final no upload:', error);
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload da foto. Tente novamente.",
        variant: "destructive"
      });
      
      setUploadProgress(0);
    }
  });

  const processImageWithCrop = async (file: File, cropData: CropData): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas não suportado');

    const finalSize = 400;
    canvas.width = finalSize;
    canvas.height = finalSize;

    // Carregar imagem
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    // Calcular coordenadas do crop
    const sourceX = Math.max(0, cropData.x / cropData.scale);
    const sourceY = Math.max(0, cropData.y / cropData.scale);
    const sourceWidth = Math.min(cropData.width / cropData.scale, img.width - sourceX);
    const sourceHeight = Math.min(cropData.height / cropData.scale, img.height - sourceY);

    // Desenhar imagem cropada
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalSize, finalSize);

    // Converter para blob
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
    });
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      if (!photoUrl.includes('profile-photos')) return;
      
      const cleanUrl = photoUrl.split('?')[0];
      const fileName = cleanUrl.split('/profile-photos/')[1];
      
      if (fileName) {
        console.log('🗑️ Removendo arquivo:', fileName);
        const { error } = await supabase.storage.from('profile-photos').remove([fileName]);
        if (error) {
          console.warn('⚠️ Erro ao remover arquivo anterior:', error);
        } else {
          console.log('✅ Arquivo anterior removido com sucesso');
        }
      }
    } catch (error) {
      console.warn('⚠️ Falha silenciosa na remoção da foto anterior:', error);
    }
  };

  return {
    uploadProfilePhoto: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error
  };
};
