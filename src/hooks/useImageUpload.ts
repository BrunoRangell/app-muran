
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
  currentUser: any;
  currentPhotoUrl?: string;
}

export const useImageUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, cropData, currentUser, currentPhotoUrl }: UploadProfilePhotoParams) => {
      console.log('🚀 Iniciando upload da foto para:', currentUser.email);
      setUploadProgress(10);

      // CORREÇÃO: Validação de autenticação robusta
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Verificação de autenticação:', { 
        authUser: user?.email, 
        authUserId: user?.id,
        currentUserEmail: currentUser.email,
        authError 
      });
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ Usuário não encontrado');
        throw new Error('Usuário não autenticado');
      }

      if (!user.id) {
        console.error('❌ ID do usuário não encontrado');
        throw new Error('ID do usuário não disponível');
      }

      // CORREÇÃO: Verificar correspondência de email
      if (user.email !== currentUser.email) {
        console.error('❌ Email não corresponde:', { 
          authEmail: user.email, 
          currentUserEmail: currentUser.email 
        });
        throw new Error('Usuário autenticado não corresponde ao perfil sendo editado');
      }

      setUploadProgress(20);

      // Processar imagem com crop
      console.log('🖼️ Processando imagem com crop...');
      const processedBlob = await processImageWithCrop(file, cropData);
      setUploadProgress(40);

      // Deletar foto anterior se existir
      if (currentPhotoUrl) {
        console.log('🗑️ Removendo foto anterior:', currentPhotoUrl);
        await deletePhoto(currentPhotoUrl, user.id);
      }
      setUploadProgress(50);

      // CORREÇÃO: Usar estrutura de pasta baseada no auth.uid()
      const fileName = `profile-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      console.log('📁 Caminho do arquivo gerado:', filePath);
      console.log('🔑 Auth UID:', user.id);

      // Verificar acesso ao bucket
      try {
        const { data: testAccess } = supabase.storage
          .from('profile-photos')
          .getPublicUrl('test');
        
        if (!testAccess?.publicUrl) {
          throw new Error('Bucket não acessível');
        }
        console.log('✅ Bucket acessível');
      } catch (error) {
        console.error('❌ Erro ao verificar bucket:', error);
        throw new Error('Sistema de armazenamento indisponível');
      }

      // Upload da nova foto
      console.log('⬆️ Fazendo upload do arquivo...');
      console.log('📊 Detalhes do upload:', {
        bucket: 'profile-photos',
        filePath,
        authUserId: user.id,
        fileSize: processedBlob.size,
        fileType: 'image/jpeg'
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, processedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Bucket de armazenamento não encontrado');
        } else if (uploadError.message.includes('Duplicate')) {
          throw new Error('Arquivo já existe. Tente novamente.');
        } else if (uploadError.message.includes('unauthorized') || uploadError.message.includes('row-level security')) {
          throw new Error('Sem permissão para fazer upload. Verifique se está logado corretamente.');
        } else {
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }
      }

      console.log('✅ Upload realizado com sucesso:', uploadData);
      setUploadProgress(70);

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log('🔗 URL pública gerada:', photoUrl);
      setUploadProgress(80);

      // Atualizar banco usando o ID correto do team_member
      console.log('💾 Atualizando banco de dados...');
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ photo_url: photoUrl })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        
        // Remover arquivo se atualização falhou
        try {
          await supabase.storage.from('profile-photos').remove([filePath]);
          console.log('🧹 Arquivo removido após erro na atualização');
        } catch (cleanupError) {
          console.error('❌ Erro ao limpar arquivo:', cleanupError);
        }
        
        throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      }

      setUploadProgress(100);
      console.log('✅ Processo de upload concluído com sucesso!');
      return photoUrl;
    },
    onSuccess: (photoUrl) => {
      console.log('🎉 Upload finalizado com sucesso:', photoUrl);
      
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

  // CORREÇÃO: Função de limpeza atualizada para trabalhar com estrutura de pastas
  const deletePhoto = async (photoUrl: string, authUserId: string) => {
    try {
      if (!photoUrl.includes('profile-photos')) return;
      
      // Extrair o caminho do arquivo da URL
      const cleanUrl = photoUrl.split('?')[0];
      const pathParts = cleanUrl.split('/profile-photos/');
      
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        console.log('🗑️ Removendo arquivo:', filePath);
        console.log('👤 Auth User ID:', authUserId);
        
        // Verificar se o arquivo pertence ao usuário atual
        if (filePath.startsWith(authUserId)) {
          const { error } = await supabase.storage.from('profile-photos').remove([filePath]);
          if (error) {
            console.warn('⚠️ Erro ao remover arquivo anterior:', error);
          } else {
            console.log('✅ Arquivo anterior removido com sucesso');
          }
        } else {
          console.warn('⚠️ Arquivo não pertence ao usuário atual, não removendo');
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
