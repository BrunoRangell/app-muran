
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { CropData } from '@/hooks/useImageUpload';

interface ImageCropperProps {
  imageSrc: string;
  onCropChange: (cropData: CropData) => void;
  onSave: () => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export const ImageCropper = ({
  imageSrc,
  onCropChange,
  onSave,
  onCancel,
  isUploading = false
}: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [minScale, setMinScale] = useState(0.1);

  const cropSize = 300;

  // Carregar imagem e calcular zoom inicial
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const minScaleX = cropSize / img.width;
        const minScaleY = cropSize / img.height;
        const calculatedMinScale = Math.max(minScaleX, minScaleY);
        
        const initialScale = Math.max(calculatedMinScale * 1.1, 0.2);
        
        setMinScale(calculatedMinScale);
        setScale(initialScale);
        
        const centerX = (canvas.width - img.width * initialScale) / 2;
        const centerY = (canvas.height - img.height * initialScale) / 2;
        setImagePosition({ x: centerX, y: centerY });
      }
    };
    img.src = imageSrc;
  }, [imageSrc, cropSize]);

  // Desenhar canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageElement || !imageLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      imageElement,
      imagePosition.x,
      imagePosition.y,
      imageElement.width * scale,
      imageElement.height * scale
    );

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = cropSize / 2;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ff6e00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    const cropData: CropData = {
      x: centerX - radius - imagePosition.x,
      y: centerY - radius - imagePosition.y,
      width: cropSize,
      height: cropSize,
      scale
    };
    onCropChange(cropData);
  }, [imageElement, imagePosition, scale, imageLoaded, onCropChange, cropSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragStart({
      x: e.clientX - rect.left - imagePosition.x,
      y: e.clientY - rect.top - imagePosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setImagePosition({
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const handleZoomChange = (value: number[]) => {
    setScale(value[0]);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, minScale));
  };

  const resetPosition = () => {
    const canvas = canvasRef.current;
    if (canvas && imageElement) {
      const centerX = (canvas.width - imageElement.width * scale) / 2;
      const centerY = (canvas.height - imageElement.height * scale) / 2;
      setImagePosition({ x: centerX, y: centerY });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#321e32] mb-2">
          Ajustar Foto de Perfil
        </h3>
        <p className="text-gray-600 text-sm">
          Arraste para posicionar e use os controles para ajustar o zoom
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border border-gray-300 rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="w-8 h-8 border-4 border-[#ff6e00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= minScale}
            className="p-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Slider
            value={[scale]}
            onValueChange={handleZoomChange}
            min={minScale}
            max={3}
            step={0.05}
            className="flex-1"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetPosition}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Centralizar</span>
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isUploading || !imageLoaded}
          className="bg-[#ff6e00] hover:bg-[#e56200]"
        >
          {isUploading ? "Salvando..." : "Salvar Foto"}
        </Button>
      </div>
    </div>
  );
};
