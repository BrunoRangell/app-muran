export type FileType = 'csv' | 'ofx';

export interface UniversalMapping {
  fileType: FileType;
  dateField: string;
  descriptionField: string | string[]; // Pode ser múltiplos campos combinados
  amountField: string;
  referenceField?: string;
  
  // Opções específicas CSV
  skipFirstRow?: boolean;
  separator?: string;
  
  // Opções específicas OFX
  descriptionStrategy?: 'name' | 'memo' | 'payee' | 'name_memo' | 'memo_payee' | 'all';
  includeDebits?: boolean;
  includeCredits?: boolean;
}

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  sampleData?: string;
}

export interface MappingField {
  key: keyof UniversalMapping;
  label: string;
  description: string;
  required: boolean;
  icon: string;
  options: FieldOption[];
  multiple?: boolean;
}

export interface FilePreview {
  headers: string[];
  rows: string[][];
  detectedSeparator?: string;
  totalRows: number;
}

export interface OFXPreview {
  availableFields: string[];
  sampleTransaction: Record<string, string>;
  totalTransactions: number;
}