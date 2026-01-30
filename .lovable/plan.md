
# Plano: Corrigir Calculo de Orcamento Diario Ideal para Usar Gasto ate Ontem

## Problema Atual

O calculo do orcamento diario ideal varia ao longo do dia porque usa o `totalSpent` parcial de hoje:

| Horario | Gasto ate Agora | Restante | Dias | Ideal |
|---------|-----------------|----------|------|-------|
| 08h     | R$ 93k          | R$ 7k    | 2    | R$ 3.500 |
| 18h     | R$ 95k          | R$ 5k    | 2    | R$ 2.500 |

**Isso causa inconsistencia!** A mesma recomendacao muda dependendo do horario.

## Logica Correta

O Meta/Google vai tentar gastar o orcamento diario **configurado para o dia inteiro**, nao apenas para as horas restantes. Portanto:

- **Gasto confirmado** = gasto ate **ontem** (dias 100% completos)
- **Dias restantes** = hoje + dias futuros
- **Ideal** = (Orcamento mensal - Gasto confirmado) / Dias restantes

**Resultado:** O calculo sera **identico** as 08h ou as 18h!

---

## Implementacao Tecnica

### Arquivo Principal: supabase/functions/unified-meta-review/meta-api.ts

**Linha 746-755 (funcao `fetchMetaApiData`):**

Codigo atual:
```typescript
// 3. Buscar gastos do mes atual
const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const sinceParam = firstDayOfMonth.toISOString().split('T')[0];
const untilParam = lastDayOfMonth.toISOString().split('T')[0];
```

Codigo corrigido:
```typescript
// 3. Buscar gastos do mes atual ATE ONTEM (para calculo consistente do orcamento ideal)
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const sinceParam = firstDayOfMonth.toISOString().split('T')[0];
// Usar ontem para garantir consistencia no calculo do orcamento ideal
// Isso evita que o gasto parcial de hoje afete a recomendacao
const untilParam = yesterday.toISOString().split('T')[0];
```

**Tratamento especial para dia 1 do mes:**

Se hoje for dia 1, ontem pertence ao mes anterior. Neste caso, `totalSpent` sera 0 (nenhum dia do mes atual foi completado), o que esta correto!

```typescript
// Se ontem for do mes anterior, usar hoje como data inicial (ainda nao ha dados do mes)
if (yesterday < firstDayOfMonth) {
  // Primeiro dia do mes - nao ha gasto confirmado ainda
  // Retornar totalSpent = 0 diretamente
  console.log(`[META-API] Primeiro dia do mes - gasto confirmado = R$ 0`);
  return {
    account_name: accountName,
    daily_budget: totalDailyBudget,
    total_spent: 0,
    total_spent_until_yesterday: 0,
    active_campaigns: activeCampaignsCount
  };
}
```

---

## Impacto nos Calculos

### Cenario: Dia 30 de janeiro, orcamento R$ 100k

**Antes (logica atual):**
- As 08h: Gasto = R$ 93k, Restante = R$ 7k, Dias = 2, Ideal = R$ 3.500
- As 18h: Gasto = R$ 95k, Restante = R$ 5k, Dias = 2, Ideal = R$ 2.500
- **Problema:** Recomendacao muda durante o dia!

**Depois (logica corrigida):**
- As 08h: Gasto ate ontem = R$ 89k, Restante = R$ 11k, Dias = 2, Ideal = R$ 5.500
- As 18h: Gasto ate ontem = R$ 89k, Restante = R$ 11k, Dias = 2, Ideal = R$ 5.500
- **Resultado:** Recomendacao consistente o dia todo!

---

## Consideracoes Importantes

### Por que isso funciona?

Quando voce ajusta o orcamento diario no Meta/Google:
1. A plataforma tenta gastar o novo valor **para o dia inteiro**
2. Se o limite era R$ 4k e voce muda para R$ 5.500, ela tentara gastar R$ 5.500 total no dia
3. O gasto parcial de hoje nao importa para a decisao de **quanto configurar**

### E se o cliente ja gastou muito hoje?

Nao afeta o calculo porque:
- O objetivo e atingir o orcamento mensal total
- Se configurar o orcamento ideal, os proximos dias compensam automaticamente
- O Meta/Google faz o trabalho de distribuir o gasto

### Orcamentos personalizados

A mesma logica se aplica:
- Gasto confirmado = soma dos dias completos dentro do periodo personalizado
- Dias restantes = de hoje ate o fim do periodo

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/unified-meta-review/meta-api.ts` | Alterar `untilParam` para usar "ontem" em vez de "ultimo dia do mes" |

---

## Proximos Passos Apos Implementacao

1. Testar com clientes de alto volume para validar consistencia
2. Verificar se a API retorna corretamente quando `until < since` (primeiro dia do mes)
3. Considerar adicionar indicador visual mostrando "baseado no gasto ate ontem"
