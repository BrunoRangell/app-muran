# Esconder anúncios de conjuntos concluídos em "Anúncios Ativos"

## Problema
O Meta mantém o anúncio e o conjunto como "ACTIVE" mesmo depois que a data de término do conjunto (ou da campanha) passou. No Gerenciador isso aparece como "Concluído", mas a busca atual só olha o status do anúncio, então esses anúncios entram na lista.

## O que muda
- Na busca de anúncios, pedir também a data de término do conjunto e da campanha.
- Remover da lista quando o conjunto ou a campanha já tiver data de término no passado.
- Conjuntos sem data de término (contínuos) continuam aparecendo normalmente.
- A numeração e o botão "Copiar links" passam a refletir só os anúncios realmente rodando.

## Detalhes técnicos
- `supabase/functions/meta-active-ads/index.ts`: adicionar `adset{id,name,end_time,effective_status}` e `campaign{id,name,stop_time,effective_status}` aos fields.
- Filtrar quando `adset.end_time` ou `campaign.stop_time` < agora, ou quando `effective_status` do conjunto/campanha não for ACTIVE (só se o filtro pedido for ACTIVE).
- Reimplantar a função e testar com um cliente real que tenha conjunto concluído.
