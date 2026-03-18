

# Reduzir altura vertical dos cards na aba Todas as Plataformas

## Análise do card atual (CircularBudgetCard.tsx, 758 linhas)

Seções que consomem espaço vertical:
1. **Header**: nome, badge plataforma, account name, account ID, ícones (~4 linhas)
2. **Saldo Meta** (condicional): título, link+badge, valor, barra de progresso (~6 linhas)
3. **Status Campanhas** (condicional): ícone+título, badge+contagem (~3 linhas)
4. **Barra de progresso** + grid de métricas: barra, orçamento, gasto, restante, diário atual, diário ideal (~6 linhas)
5. **Ajuste recomendado** (condicional): caixa com valor (~2 linhas)
6. **Botão Analisar** (~2 linhas)

## Otimizações propostas

### 1. Reduzir paddings e margins globais
- `p-5` → `p-3` no CardContent
- `mb-4` → `mb-2` nas seções (header, saldo, campanhas)
- `mb-5` → `mb-3` no layout principal
- `gap-y-3` → `gap-y-2` no grid de métricas

### 2. Header mais compacto
- Remover linha do **Account ID** (`p "text-xs text-gray-500">ID: ...`). É redundante na visão unificada -- o nome da conta já identifica. O ID continua acessível via botão ExternalLink.
- Colocar account name na mesma linha do company name (após o badge), separando com `·`

### 3. Seção de Saldo mais compacta
- Reduzir padding de `p-3` → `p-2`
- Colocar "Saldo da Conta" e "Ver saldo / Pré-paga" na mesma linha
- Mover "dias restantes" para a mesma linha do valor

### 4. Remover caixa "Ajuste recomendado" (linhas 713-723)
- Essa informação já aparece no header como ícone AlertTriangle + tooltip, e no status do card (borderColor + statusInfo.status)
- É **redundante** -- removê-la economiza ~40px verticais

### 5. Status de campanhas mais compacto
- Reduzir padding de `p-3` → `p-2`
- Colocar ícone, título e badge na **mesma linha** em vez de 2 linhas

### 6. Barra de progresso + métricas
- Reduzir `mb-4` → `mb-2` na barra
- Grid de métricas: reduzir `gap-y-3` → `gap-y-1.5`

## Estimativa de ganho
Cada otimização economiza ~20-40px. No total, estimativa de **~120-160px de redução**, o que deve permitir visualizar o card completo sem scroll na viewport de 762px.

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

