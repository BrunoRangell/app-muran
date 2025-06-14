
export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contract_value: number;
  status: "active" | "inactive";
  first_payment_date: string;
  payment_type: "pre" | "post";
  acquisition_channel?: string;
  company_birthday?: string;
  last_payment_date?: string;
  created_at: string;
  meta_account_id?: string;
  google_account_id?: string;
  meta_ads_budget?: number;
  google_ads_budget?: number;
}

export interface ClientFormData {
  companyName: string;
  contractValue: number;
  firstPaymentDate: string;
  paymentType: "pre" | "post";
  status: "active" | "inactive";
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
