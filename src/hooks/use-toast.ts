
import { 
  Toast, 
  ToastActionElement, 
  ToastProps 
} from "@/components/ui/toast"

import {
  useToast as useToastOriginal
} from "@/components/ui/use-toast"

export type ToasterToast = Toast & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export const useToast = () => {
  const { toast, ...rest } = useToastOriginal()
  
  return {
    toast,
    ...rest,
  }
}

export { toast } from "@/components/ui/use-toast"
export type { ToastProps }
