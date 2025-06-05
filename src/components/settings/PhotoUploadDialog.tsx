
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { useImageUpload, CropData } from '@/hooks/useImageUpload';
import { Progress } from '@/components/ui/progress';

interface PhotoUploadDialogProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (newUrl: string) => void;
  userId: string;
}

export const PhotoUploadDialog = ({
  currentPhotoUrl,
  onPhotoUpdate,
  userId
}: PhotoUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [cropData, setCropData] = useState<CropData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadProfilePhoto, deleteProfilePhoto, isUploading, uploadProgress } = useImageUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCropChange = (newCropData: CropData) => {
    setCropData(newCropData);
  };

  const handleSave = async () => {
    if (!selectedFile || !cropData) return;

    // Deletar foto anterior se existir
    if (currentPhotoUrl && currentPhotoUrl.includes('profile-photos')) {
      await deleteProfilePhoto(currentPhotoUrl);
    }

    // Upload nova foto
    const newUrl = await uploadProfilePhoto(selectedFile, cropData, userId);
    
    if (newUrl) {
      onPhotoUpdate(newUrl);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCropData(null);
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Camera className="h-4 w-4" />
          <span>Alterar Foto</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          // Tela inicial de seleção
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-16 h-16 bg-[#ff6e00] rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#321e32] mb-2">
                Selecionar Foto de Perfil
              </h3>
              <p className="text-gray-600 text-sm">
                Escolha uma imagem do seu computador para sua foto de perfil
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={triggerFileSelect}
                className="w-full bg-[#ff6e00] hover:bg-[#e56200]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              
              <div className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, WEBP • Máximo: 5MB
              </div>
            </div>
          </div>
        ) : (
          // Tela de crop
          <div>
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Fazendo upload...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <ImageCropper
              imageSrc={previewUrl}
              onCropChange={handleCropChange}
              onSave={handleSave}
              onCancel={handleCancel}
              isUploading={isUploading}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
