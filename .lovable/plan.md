

# Corrigir parsing do saldo Meta — regex não reconhece formato da API

## Problema
A API Meta retorna o `display_string` no formato `"Saldo disponível (40 943,86 R$ (BRL))"`, onde:
- O número vem **antes** de `R$` (não depois)
- Usa **espaços** como separador de milhares (ex: `40 943,86`)

A regex atual `R\$\s*([\d.,]+)` só captura números **após** `R$`, então falha e retorna `null`. O sistema cai no fallback do campo `balance` (que é um valor diferente e instável), gerando valores errados a cada revisão.

## Solução

### Arquivo: `supabase/functions/unified-meta-review/meta-api.ts` (função `parseMetaBalance`, linhas 10-23)

Atualizar a regex para capturar o número em **ambos os formatos**:
1. `R$ 310,29` (número após R$) — formato antigo
2. `40 943,86 R$` (número antes de R$) — formato atual

```text
ANTES:
  Regex: R\$\s*([\d.,]+)
  Captura: só "R$ NÚMERO"

DEPOIS:
  Tentar duas regex em sequência:
  1. R\$\s*([\d.,\s]+) — número após R$ (com espaços)
  2. ([\d.,\s]+)\s*R\$ — número antes de R$ (formato atual)
  
  Em ambos os casos, remover espaços, pontos e converter vírgula para ponto decimal.
```

### Arquivo: `src/utils/metaBalance.ts` (mesma função no frontend)
Aplicar a mesma correção de regex para manter consistência.

### Deploy
Reimplantar a edge function `unified-meta-review`.

## Arquivos editados
- `supabase/functions/unified-meta-review/meta-api.ts` — corrigir regex do `parseMetaBalance`
- `src/utils/metaBalance.ts` — mesma correção no frontend

