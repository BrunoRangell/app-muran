
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
      console.log('🚀 Iniciando upload de foto de perfil');
      setUploadProgress(10);

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      setUploadProgress(20);

      // Processar imagem com crop
      const processedBlob = await processImageWithCrop(file, cropData);
      setUploadProgress(40);

      // Deletar foto anterior se existir
      if (currentPhotoUrl) {
        await deletePhoto(currentPhotoUrl);
      }
      setUploadProgress(50);

      // Upload da nova foto
      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, processedBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      setUploadProgress(70);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
      setUploadProgress(80);

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ photo_url: photoUrl })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      }

      setUploadProgress(100);
      return photoUrl;
    },
    onSuccess: (photoUrl) => {
      console.log('✅ Upload concluído com sucesso:', photoUrl);
      
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
      console.error('❌ Erro no upload:', error);
      
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
        await supabase.storage.from('profile-photos').remove([fileName]);
        console.log('🗑️ Foto anterior deletada');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao deletar foto anterior:', error);
    }
  };

  return {
    uploadProfilePhoto: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error
  };
};
