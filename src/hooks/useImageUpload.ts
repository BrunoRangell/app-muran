
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

  const uploadProfilePhoto = async (
    file: File,
    cropData: CropData,
    userId: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Criar canvas para crop da imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não suportado');

      // Configurar tamanho final (sempre 400x400 para consistência)
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

      // Aplicar crop e scale
      const sourceX = cropData.x / cropData.scale;
      const sourceY = cropData.y / cropData.scale;
      const sourceWidth = cropData.width / cropData.scale;
      const sourceHeight = cropData.height / cropData.scale;

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

      setUploadProgress(50);

      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.9 // Qualidade 90%
        );
      });

      setUploadProgress(75);

      // Upload para Supabase Storage
      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(100);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });

      return data.publicUrl;

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
      
      const fileName = photoUrl.split('/profile-photos/')[1];
      const { error } = await supabase.storage
        .from('profile-photos')
        .remove([fileName]);

      if (error) throw error;
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
