
export interface ClientFormData {
  companyName: string;
  contractValue: number;
  firstPaymentDate: string;
  paymentType: string;  // Alterado de "pre" | "post" para string
  status: string;  // Alterado de "active" | "inactive" para string
  acquisitionChannel?: string;
  customAcquisitionChannel?: string;
  companyBirthday?: string;
  contactName?: string;
  contactPhone?: string;
  lastPaymentDate?: string;
}

export const ACQUISITION_CHANNELS = [
  "Tráfego pago",
  "Indicação",
  "Prospecção fria",
  "outro"
] as const;
