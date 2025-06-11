
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { useImageUpload, CropData } from '@/hooks/useImageUpload';
import { Progress } from '@/components/ui/progress';
import { verifyStorageBucket } from '@/lib/storageSetup';
import { useCurrentUser } from '@/hooks/useTeamMembers';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhotoUploadDialogProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (newUrl: string) => void;
}

export const PhotoUploadDialog = ({
  currentPhotoUrl,
  onPhotoUpdate
}: PhotoUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState<string>('');
  const [storageChecked, setStorageChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadProfilePhoto, isUploading, uploadProgress, error } = useImageUpload();
  const { data: currentUser } = useCurrentUser();

  // CORREÇÃO: Verificar storage apenas quando necessário
  useEffect(() => {
    const checkStorage = async () => {
      if (isOpen && !storageChecked && currentUser) {
        console.log('🔄 Verificando storage para usuário:', currentUser.email);
        setStorageError('');
        
        const isReady = await verifyStorageBucket();
        setStorageReady(isReady);
        setStorageChecked(true);
        
        if (!isReady) {
          setStorageError('Bucket de armazenamento não está acessível no momento');
        }
      }
    };
    
    checkStorage();
  }, [isOpen, storageChecked, currentUser]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 Arquivo selecionado:', { name: file.name, size: file.size, type: file.type });

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCropChange = (newCropData: CropData) => {
    setCropData(newCropData);
  };

  const handleSave = async () => {
    if (!selectedFile || !cropData || !currentUser) {
      console.error('❌ Dados insuficientes para upload:', { 
        selectedFile: !!selectedFile, 
        cropData: !!cropData, 
        currentUser: !!currentUser 
      });
      return;
    }

    console.log('💾 Iniciando upload para usuário:', currentUser.email);
    
    // CORREÇÃO: Usar o currentUser diretamente, sem prop userId separada
    uploadProfilePhoto(
      { 
        file: selectedFile, 
        cropData, 
        currentUser,
        currentPhotoUrl 
      },
      {
        onSuccess: (newUrl) => {
          console.log('✅ Upload concluído, atualizando interface...');
          onPhotoUpdate(newUrl);
          handleCancel();
        }
      }
    );
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCropData(null);
    setIsOpen(false);
    setStorageChecked(false);
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
          disabled={!currentUser || isUploading}
        >
          <Camera className="h-4 w-4" />
          <span>Alterar Foto</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogTitle>Foto de Perfil</DialogTitle>
        <DialogDescription>
          Escolha uma nova foto para seu perfil
        </DialogDescription>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {storageError && !storageReady && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {storageError}
            </AlertDescription>
          </Alert>
        )}

        {!selectedFile ? (
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
                disabled={!currentUser}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              
              <div className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, WEBP • Máximo: 5MB
              </div>

              {!currentUser && (
                <div className="text-xs text-red-500">
                  ⚠️ Faça login para alterar sua foto de perfil
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Salvando foto de perfil...</span>
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
