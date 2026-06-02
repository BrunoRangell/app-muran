## Contexto

O Discord limita bastante a apresentação visual (embeds têm largura fixa, não suportam tabelas reais nem grids de imagens lado a lado). Para "tirar print e enviar pro cliente", o caminho ideal é criar uma **página no app** com layout tipo galeria/tabela, otimizada para screenshot.

## Plano

### 1. Nova página: `/anuncios-ativos`

Adicionar item no menu lateral em **Relatórios** (ou módulo equivalente), com ícone de megafone.

### 2. Filtros (topo da página)

- **Cliente** (select com busca, lista clientes ativos com conta Meta)
- **Conta Meta** (aparece se cliente tiver mais de uma conta; auto-seleciona se só tem uma)
- **Campanha** (multi-select, populado após escolher conta — opcional)
- **Status** (default: somente Ativos; toggle para incluir pausados)
- Botão **Atualizar** (refetch da Meta API)

### 3. Visualização principal

Layout em **grid de cards** (3-4 colunas em desktop, responsivo), pensado para print:

```text
┌──────────────────────────┐ ┌──────────────────────────┐
│ [imagem do criativo]     │ │ [imagem do criativo]     │
│                          │ │                          │
│ Nome do anúncio          │ │ Nome do anúncio          │
│ Campanha: [MSG][LEAD]... │ │ Campanha: [MSG][LEAD]... │
│ ● Ativo                  │ │ ● Ativo                  │
└──────────────────────────┘ └──────────────────────────┘
```

Header do print incluindo: **logo Muran + nome do cliente + data + total de anúncios ativos**, para o screenshot já sair pronto pra mandar.

Alternar entre **modo Galeria** (cards com imagem grande) e **modo Tabela** (linhas compactas: thumb + nome + campanha + status), via toggle.

### 4. Ações

- Botão **"Exportar como imagem"** (usa `html2canvas` ou `dom-to-image` — gera PNG do grid completo direto pro download, sem o usuário precisar dar print manual)
- Botão **"Copiar lista"** (texto puro pra colar em WhatsApp)

### 5. Backend

Reaproveitar a lógica que já está na edge function `discord-interactions`:
- Extrair a busca de ads da Meta (`act_{accountId}/ads` com fields de criativo) para uma edge function dedicada `meta-active-ads` que retorna JSON estruturado.
- A página do app chama essa função; o Discord bot também passa a chamá-la (centraliza lógica, evita duplicação).

### 6. Discord (opcional, melhoria do bot existente)

Manter o `/anuncios` mas trocar a resposta para um **link clicável** que abre a página do app já filtrada pelo cliente:
`https://app.muranmarketing.com.br/anuncios-ativos?cliente={id}`

Assim o time tem o atalho rápido no Discord e o visual bonito no app.

## Arquivos previstos

- `src/pages/AnunciosAtivos.tsx` (página principal)
- `src/components/anuncios-ativos/FiltersBar.tsx`
- `src/components/anuncios-ativos/AdCard.tsx`
- `src/components/anuncios-ativos/AdsGrid.tsx`
- `src/components/anuncios-ativos/ExportButton.tsx` (html2canvas)
- `src/hooks/useActiveAds.ts`
- `supabase/functions/meta-active-ads/index.ts`
- Refatorar `supabase/functions/discord-interactions/index.ts` para consumir a nova função
- Adicionar rota e item no menu

## Perguntas

1. **Modo padrão**: prefere abrir já em **galeria** (visual, ideal pra print) ou **tabela** (compacto)?
2. **Exportar imagem**: gerar PNG direto pelo botão é OK, ou prefere só print manual mesmo?
3. **Discord**: mantenho o `/anuncios` com cards como está hoje, ou troco pra responder com link pra página do app?
