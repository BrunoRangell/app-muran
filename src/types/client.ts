export interface ClientFormData {
  companyName: string;
  contractValue: number;
  firstPaymentDate: string;
  paymentType: "pre" | "post";
  status: "active" | "inactive";
  acquisitionChannel: string;
  companyBirthday: string;
  contactName: string;
  contactPhone: string;
  customAcquisitionChannel?: string;
}

export const ACQUISITION_CHANNELS = [
  "Tráfego pago",
  "Indicação",
  "Prospecção fria",
  "outro"
] as const;