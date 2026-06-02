## Objetivo

Voltar a tabela de Anúncios Ativos para largura inteira (sem `max-w-3xl`) e permitir que as colunas Status, Imagem e Anúncio se ajustem ao conteúdo, deixando a coluna Campanha ocupar todo o espaço restante.

## Alterações em `src/pages/AnunciosAtivos.tsx`

1. **Remover restrição de largura da tabela**
   - Tirar `max-w-3xl overflow-hidden` do container.
   - Trocar `table-fixed` por `w-full` simples (auto layout), para que as larguras se adaptem ao conteúdo.

2. **Larguras das colunas**
   - Status: `w-px whitespace-nowrap` (largura mínima do conteúdo, sem quebra).
   - Imagem: `w-px` (apenas o thumb de 64px).
   - Anúncio: `w-px whitespace-nowrap` — mostra o nome completo sem cortar.
   - Campanha: sem largura definida → ocupa todo o espaço restante; mantém `truncate` com `title` no hover, já que pode ser muito longa.
   - Truque CSS: `w-px` + `whitespace-nowrap` faz a célula encolher exatamente ao tamanho do conteúdo, e a coluna sem largura definida "estica".

3. **Botão "Ajustar colunas" (compactar)**
   - Adicionar estado `compact` (boolean) com botão toggle ao lado dos botões de exportar (ícone `Minimize2`/`Maximize2`, label "Compactar"/"Expandir").
   - Quando `compact = true`:
     - Reduz padding das células para `px-2 py-1.5`.
     - Reduz tamanho da fonte para `text-xs`.
     - Reduz thumb de imagem de 64px para 40px.
   - Quando `compact = false` (padrão): padding `px-3 py-2`, fonte `text-sm`, thumb 64px.
   - Isso "empurra" as colunas para a esquerda ao máximo, dando ainda mais espaço para Campanha quando necessário.

## Resultado esperado

- Tabela volta a usar 100% da largura disponível.
- Status, Imagem e Anúncio ficam justos ao conteúdo (sem corte).
- Campanha ocupa todo o espaço restante (com truncate quando muito longa).
- Botão de compactar permite encolher ainda mais as colunas fixas quando precisar.
