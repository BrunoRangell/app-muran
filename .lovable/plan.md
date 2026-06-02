## Problema

Quando o PNG é exportado, eu escondo as colunas Imagem e Campanha. Isso faz a tabela ficar bem mais estreita que o card branco em volta (que continua ocupando 100% da largura da página), deixando um espaço vazio enorme à direita e visualmente "diferente" do preview.

## Objetivo

Exportar um PNG **idêntico ao preview atual**, mas **sem a coluna Campanha**.

## Alterações em `src/pages/AnunciosAtivos.tsx`

1. **Voltar a mostrar a coluna Imagem no export**
   - Hoje, durante `exporting`, eu escondo `Imagem` e `Campanha`. Manter só o ocultamento da `Campanha` (header + cell).
   - Resultado da tabela no PNG: `# | Status | Imagem | Anúncio` — igualzinho ao preview, só sem a última coluna.

2. **Ajustar o card exportável para encolher ao conteúdo durante o export**
   - O card (`<div ref={exportRef}>`) hoje tem `bg-white rounded-xl border p-6` e ocupa 100% da largura. Quando a Campanha some, a tabela vira o único elemento "estreito" e o card continua largo.
   - Durante `exporting`, adicionar `w-fit max-w-full` ao card e `w-fit` ao header interno (`flex justify-between`), para que tudo encolha junto e fique alinhado com a tabela.
   - O header (logo + nome + contador de anúncios) continua com `justify-between`, mas agora dentro de um container `w-fit` o `justify-between` precisa de uma largura mínima. Solução: durante export, trocar `justify-between` por `gap-12` (ou `gap-16`) para manter logo à esquerda e contador à direita com um espaço fixo entre eles, sem depender da largura total.

3. **Garantir que nada mais "vaze"**
   - O `text-right` do contador continua igual.
   - O `border-b` do header continua igual.
   - Não mexer em filtros nem nos botões (eles estão fora do `exportRef`).

## Resultado esperado

PNG mostra exatamente o mesmo layout do preview (mesmas larguras de coluna, mesma fonte, mesmo header com logo + nome + contador), apenas sem a coluna Campanha — e o card branco fica ajustado ao tamanho da tabela, sem espaço vazio à direita.

## Fallback (caso o ajuste do card fique estranho)

Remover a coluna Campanha também do preview (não mostrar em tela). Aí preview = export naturalmente. Só sigo por esse caminho se o resultado do item 2 ficar ruim.
