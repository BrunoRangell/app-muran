
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadProfilePhoto = async (
    file: File,
    cropData: CropData,
    userId: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('=== INICIANDO UPLOAD ===');
      console.log('User ID:', userId);
      console.log('Arquivo:', file.name, file.size, file.type);
      console.log('Crop data:', cropData);

      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Erro de autenticação:', authError);
        throw new Error('Usuário não autenticado');
      }
      console.log('Usuário autenticado:', user.id);

      // Criar canvas para crop da imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não suportado');

      const finalSize = 400;
      canvas.width = finalSize;
      canvas.height = finalSize;

      setUploadProgress(20);

      // Carregar imagem original
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      console.log('Imagem carregada:', img.width, 'x', img.height);
      setUploadProgress(40);

      // Calcular coordenadas do crop
      const sourceX = Math.max(0, cropData.x / cropData.scale);
      const sourceY = Math.max(0, cropData.y / cropData.scale);
      const sourceWidth = Math.min(cropData.width / cropData.scale, img.width - sourceX);
      const sourceHeight = Math.min(cropData.height / cropData.scale, img.height - sourceY);

      console.log('Crop calculado:', { sourceX, sourceY, sourceWidth, sourceHeight });

      // Desenhar imagem cropada no canvas
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        finalSize,
        finalSize
      );

      setUploadProgress(60);

      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.9
        );
      });

      console.log('Blob criado:', blob.size, 'bytes');
      setUploadProgress(70);

      // Upload para Supabase Storage
      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      console.log('Fazendo upload para:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload para storage:', uploadError);
        
        // Se for erro de bucket não encontrado, fornecer mensagem mais clara
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Bucket de armazenamento não foi encontrado. Entre em contato com o administrador.');
        }
        
        throw uploadError;
      }

      console.log('Upload realizado com sucesso:', uploadData);
      setUploadProgress(85);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      console.log('URL da foto gerada:', photoUrlWithTimestamp);

      setUploadProgress(90);

      // Atualizar o registro do usuário no banco de dados
      console.log('Atualizando banco de dados...');
      const { data: updateData, error: updateError } = await supabase
        .from('team_members')
        .update({ photo_url: photoUrlWithTimestamp })
        .eq('id', userId)
        .select('*');

      if (updateError) {
        console.error('Erro ao atualizar foto no banco:', updateError);
        throw updateError;
      }

      if (!updateData || updateData.length === 0) {
        console.error('Nenhum registro foi atualizado - usuário não encontrado:', userId);
        throw new Error('Usuário não encontrado na base de dados');
      }

      console.log('Banco atualizado com sucesso:', updateData[0]);
      setUploadProgress(95);

      // Invalidar cache do React Query
      console.log('Invalidando cache do React Query...');
      await queryClient.invalidateQueries({ queryKey: ['current_user'] });
      await queryClient.invalidateQueries({ queryKey: ['team_members'] });
      
      // Forçar refresh dos dados
      await queryClient.refetchQueries({ queryKey: ['current_user'] });

      setUploadProgress(100);

      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });

      console.log('=== UPLOAD CONCLUÍDO COM SUCESSO ===');
      return photoUrlWithTimestamp;

    } catch (error) {
      console.error('=== ERRO NO UPLOAD ===');
      console.error('Detalhes do erro:', error);
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer upload da foto. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteProfilePhoto = async (photoUrl: string) => {
    try {
      if (!photoUrl || !photoUrl.includes('profile-photos')) {
        console.log('URL não é válida para deletar:', photoUrl);
        return;
      }
      
      const cleanUrl = photoUrl.split('?')[0];
      const fileName = cleanUrl.split('/profile-photos/')[1];
      
      if (!fileName) {
        console.warn('Nome do arquivo não encontrado na URL:', photoUrl);
        return;
      }
      
      console.log('Deletando foto antiga:', fileName);
      const { error } = await supabase.storage
        .from('profile-photos')
        .remove([fileName]);

      if (error) {
        console.error('Erro ao deletar foto:', error);
      } else {
        console.log('Foto antiga deletada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
    }
  };

  return {
    uploadProfilePhoto,
    deleteProfilePhoto,
    isUploading,
    uploadProgress
  };
};
