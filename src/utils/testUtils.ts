
// Utilitários para teste e simulação de dados
export class TestDataGenerator {
  
  // Gerar dados de cliente para teste
  static generateClientData(overrides: Partial<any> = {}) {
    return {
      id: crypto.randomUUID(),
      company_name: `Empresa Teste ${Math.floor(Math.random() * 1000)}`,
      contact_name: "João Silva",
      contact_phone: "(11) 99999-9999",
      contract_value: Math.floor(Math.random() * 5000) + 500,
      status: Math.random() > 0.8 ? 'inactive' : 'active',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  // Gerar dados de pagamento para teste
  static generatePaymentData(clientId?: string, overrides: Partial<any> = {}) {
    const now = new Date();
    const referenceMonth = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 12), 1);
    
    return {
      id: Math.floor(Math.random() * 10000),
      client_id: clientId || crypto.randomUUID(),
      amount: Math.floor(Math.random() * 3000) + 200,
      reference_month: referenceMonth.toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      notes: Math.random() > 0.7 ? "Pagamento via PIX" : null,
      ...overrides
    };
  }

  // Gerar dados de custo para teste
  static generateCostData(overrides: Partial<any> = {}) {
    const costs = [
      'Aluguel', 'Internet', 'Energia', 'Marketing Digital', 
      'Software', 'Telefone', 'Material de Escritório'
    ];
    
    return {
      id: Math.floor(Math.random() * 10000),
      name: costs[Math.floor(Math.random() * costs.length)],
      amount: Math.floor(Math.random() * 2000) + 100,
      date: new Date().toISOString().split('T')[0],
      description: Math.random() > 0.5 ? "Descrição do custo" : null,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  // Gerar múltiplos registros
  static generateMultiple<T>(generator: () => T, count: number): T[] {
    return Array(count).fill(null).map(() => generator());
  }
}

// Simulador de latência para testes
export class NetworkSimulator {
  static async simulateDelay(min = 500, max = 2000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  static async simulateError(errorRate = 0.1) {
    if (Math.random() < errorRate) {
      throw new Error("Erro simulado de rede");
    }
  }

  static async simulateNetworkCall<T>(data: T, options: {
    delay?: boolean;
    errorRate?: number;
    minDelay?: number;
    maxDelay?: number;
  } = {}): Promise<T> {
    const { delay = true, errorRate = 0, minDelay = 500, maxDelay = 2000 } = options;

    if (delay) {
      await this.simulateDelay(minDelay, maxDelay);
    }

    if (errorRate > 0) {
      await this.simulateError(errorRate);
    }

    return data;
  }
}
