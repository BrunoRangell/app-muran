
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

      console.log('Iniciando upload para usuário:', userId);

      // Criar canvas para crop da imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não suportado');

      const finalSize = 400;
      canvas.width = finalSize;
      canvas.height = finalSize;

      // Carregar imagem original
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      setUploadProgress(25);

      // Calcular coordenadas corrigidas para o crop
      const sourceX = cropData.x / cropData.scale;
      const sourceY = cropData.y / cropData.scale;
      const sourceWidth = cropData.width / cropData.scale;
      const sourceHeight = cropData.height / cropData.scale;

      const clampedX = Math.max(0, Math.min(sourceX, img.width - sourceWidth));
      const clampedY = Math.max(0, Math.min(sourceY, img.height - sourceHeight));
      const clampedWidth = Math.min(sourceWidth, img.width - clampedX);
      const clampedHeight = Math.min(sourceHeight, img.height - clampedY);

      console.log('Dados do crop:', {
        original: cropData,
        calculated: { sourceX, sourceY, sourceWidth, sourceHeight },
        clamped: { clampedX, clampedY, clampedWidth, clampedHeight },
        imageSize: { width: img.width, height: img.height }
      });

      // Desenhar imagem cropada no canvas
      ctx.drawImage(
        img,
        clampedX,
        clampedY,
        clampedWidth,
        clampedHeight,
        0,
        0,
        finalSize,
        finalSize
      );

      setUploadProgress(50);

      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.9
        );
      });

      setUploadProgress(65);

      // Upload para Supabase Storage
      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload para storage:', uploadError);
        throw uploadError;
      }

      setUploadProgress(80);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      console.log('URL da foto gerada:', photoUrlWithTimestamp);

      setUploadProgress(90);

      // Atualizar o registro do usuário no banco de dados
      console.log('Atualizando photo_url no banco para usuário:', userId);
      const { data: updateData, error: updateError } = await supabase
        .from('team_members')
        .update({ photo_url: photoUrlWithTimestamp })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('Erro ao atualizar foto no banco:', updateError);
        throw updateError;
      }

      console.log('Foto atualizada no banco com sucesso:', updateData);
      setUploadProgress(95);

      // Invalidar cache do React Query para forçar recarregamento dos dados
      console.log('Invalidando cache do React Query...');
      await queryClient.invalidateQueries({ queryKey: ['current_user'] });
      await queryClient.invalidateQueries({ queryKey: ['team_members'] });

      setUploadProgress(100);

      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });

      console.log('Upload concluído com sucesso!');
      return photoUrlWithTimestamp;

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto. Tente novamente.",
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
      if (!photoUrl.includes('profile-photos')) return;
      
      const cleanUrl = photoUrl.split('?')[0];
      const fileName = cleanUrl.split('/profile-photos/')[1];
      
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
