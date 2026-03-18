

# Cards do mesmo cliente lado a lado + múltiplos blocos na mesma linha

## O que o usuário quer
- Dentro de cada bloco de cliente, os cards de contas (Meta/Google) ficam **lado a lado horizontalmente**
- Múltiplos blocos de clientes também podem aparecer lado a lado **se houver espaço**
- Nada cortado ou sobreposto

## Abordagem
Abandonar o grid fixo de grupos (`md:grid-cols-2 xl:grid-cols-3`) e usar **flexbox com wrap** para que cada bloco de cliente ocupe apenas a largura necessária para seus cards internos, e vários blocos caibam na mesma linha naturalmente.

### 1. `ClientGroupCard.tsx` — cards internos lado a lado
- Voltar o grid dinâmico: `gridTemplateColumns: repeat(N, minmax(220px, 1fr))` onde N = número de contas
- Isso garante que 2 contas ficam lado a lado, 3 ficam em 3 colunas, etc.
- Mobile: `max-sm:!grid-cols-1` para empilhar

### 2. `AllPlatformsTab.tsx` — blocos de clientes com flex wrap
- Trocar o grid fixo por `flex flex-wrap gap-4`
- Cada `ClientGroupCard` recebe uma largura mínima/máxima dinâmica baseada no número de contas:
  - 1 conta: `min-w-[280px] max-w-[350px] flex-1`
  - 2 contas: `min-w-[500px] max-w-[700px] flex-1`
  - 3+ contas: `min-w-[720px] flex-1`
- Isso permite que blocos menores (1 conta) fiquem lado a lado com outros blocos na mesma linha, enquanto blocos maiores (2-3 contas) ocupam mais espaço

Na prática, passar o número de contas como prop e calcular as classes no `ClientGroupCard`, ou fazer o cálculo no `AllPlatformsTab` com um wrapper div.

### Arquivos editados
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`
- `src/components/improved-reviews/tabs/AllPlatformsTab.tsx`

