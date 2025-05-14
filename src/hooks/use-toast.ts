
import { 
  Toast as ToastPrimitive, 
  ToastActionElement, 
  ToastProps 
} from "@/components/ui/toast";

import {
  useToast as useToastOriginal
} from "@radix-ui/react-toast";

export type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
} & ToastProps;

export const useToast = () => {
  const { toast, ...rest } = useToastOriginal();
  
  return {
    toast,
    ...rest,
  };
};

export { toast } from "@radix-ui/react-toast";
export type { ToastProps };
