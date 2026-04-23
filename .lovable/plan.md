
# Novo modelo de edição Premium — separado do editor genérico

## Direção

Sim: faz sentido criar um **modo de edição premium novo**, em vez de continuar acoplando o premium ao editor atual.

O problema não é só visual. Hoje o premium está “espalhado” entre:
- `WIDGET_CATALOG`
- `WidgetRenderer`
- `TemplatePreviewDialog`
- `WidgetGridRenderer`
- migrações/templates salvos no banco

Isso cria vários pontos de divergência e explica por que um widget pode existir em um lugar e cair em “Widget não reconhecido” em outro.

A proposta é transformar o premium em um **sistema próprio, com engine própria**, mantendo:
- o template fixo atual
- o editor padrão atual para templates normais
- um **novo editor premium** para templates premium editáveis

---

## O que será construído

### 1) Novo “Premium Builder”
Criar um editor dedicado, fullscreen, tema escuro fixo, com layout pensado para dashboards premium.

#### Características
- rota própria, separada do editor atual
- preview ao vivo no mesmo layout do relatório final
- sidebar premium sempre visível
- canvas premium sem depender da lógica antiga de widgets genéricos
- experiência WYSIWYG real

Exemplo de estrutura:
```text
[ Biblioteca Premium ] [ Canvas Premium 60% ] [ Preview Real 40% ]
                       [ Painel inferior: Conteúdo | Dados | Estilo ]
```

---

### 2) Engine premium v2
Em vez de reaproveitar o formato híbrido atual, criar um schema premium explícito dentro de `sections`.

Exemplo conceitual:
```json
{
  "engine": "premium-v2",
  "theme": "dark",
  "sidebar": true,
  "layout": {
    "blocks": [...]
  }
}
```

Cada bloco premium terá:
- `id`
- `type`
- `layout`
- `dataBinding`
- `styleVariant`
- `content`

Isso evita depender de múltiplos switches manuais espalhados.

---

### 3) Registro único de blocos premium
Criar um **registry central** para os blocos premium.

Cada bloco premium define em um único lugar:
- tipo
- nome
- descrição
- preview
- configurações padrão
- renderer do editor
- renderer do preview/portal
- painel de propriedades

Exemplo de blocos iniciais:
- KPI Premium
- Bloco de Plataforma
- Ranking Gradiente
- Donut/Pie Premium
- Tendência Premium
- Header/Hero Premium
- Texto/Comentário Premium
- Divider premium
- Top Criativos premium
- Tabela premium de campanhas

Resultado: quando um bloco novo entra, ele entra uma vez só no registry, e não em 4 arquivos diferentes.

---

### 4) Biblioteca premium curada
Em vez de um repertório “solto”, montar uma biblioteca premium com blocos pensados para trabalhar juntos.

#### Primeira leva
- KPI Premium com comparativo
- KPI inline compacto
- Bloco Meta
- Bloco Google
- Ranking por regiões
- Ranking por campanhas
- Ranking por criativos
- Donut demográfico
- Linha de tendência
- Comparativo Meta x Google
- Texto estratégico / insights
- Box de destaque
- Cabeçalho premium

#### Regras visuais
- tema escuro fixo
- tipografia e espaçamentos consistentes
- tokens visuais centralizados
- sem estilos arbitrários quebrando o padrão do premium

---

### 5) Painel de propriedades melhor
Substituir a edição atual baseada em campos dispersos por um painel contextual com abas:

- **Conteúdo**: título, texto, rótulos
- **Dados**: métrica, dimensão, fonte, período, limite
- **Estilo**: variante, intensidade, alinhamento, destaque

Para premium, o ideal é usar:
- variantes controladas
- presets visuais
- menos liberdade “caótica”
- mais consistência de design

---

### 6) Compatibilidade e transição
O sistema novo coexistirá com o que já existe.

#### Manter
- `DashCortex Premium` fixo
- editor atual para templates normais

#### Descontinuar gradualmente
- template premium editável atual baseado no editor genérico

#### Compatibilidade
Criar um adaptador para templates premium antigos:
- se encontrar `premium-kpi`, `platform-block`, `ranking-table` no formato antigo, converter para blocos `premium-v2`
- se não for possível converter 100%, exibir fallback de compatibilidade claro, nunca “Widget não reconhecido”

---

### 7) Resolver a causa estrutural do erro atual
Além do novo builder, incluir uma camada temporária de robustez no sistema atual para parar de quebrar até a migração:

- normalizador de tipos ao carregar template
- validação do JSON salvo no `report_templates`
- fallback com diagnóstico legível
- mapeamento legacy → premium-v2

Exemplo:
```text
premium-kpi        -> premium.metric.kpi
platform-block     -> premium.platform.summary
ranking-table      -> premium.ranking.gradient
```

---

## Arquitetura técnica

### Novos pilares
- `premium block registry`
- `premium template schema v2`
- `premium editor route`
- `premium renderer`
- `premium preview shell`
- `legacy premium adapter`

### Arquivos principais
- novo editor premium em rota separada
- novo registry de blocos premium
- novo renderer premium compartilhado entre editor e relatório
- novo painel de propriedades premium
- migração SQL para semear template premium v2
- adaptador para templates premium antigos

### Ajustes necessários
- parar de duplicar renderização entre editor, preview modal e portal
- usar o mesmo renderer premium nos 3 contextos
- tipar `report_templates.sections` para aceitar `engine: "premium-v2"`
- manter compatibilidade com templates legados e widget-based atuais

---

## Etapas de implementação

1. Criar o schema `premium-v2` e o registry central
2. Criar a rota e shell do novo Premium Builder
3. Implementar os primeiros blocos premium no novo registry
4. Construir painel de propriedades contextual
5. Reutilizar o mesmo renderer no editor e no relatório final
6. Criar adaptador para templates premium antigos
7. Inserir um novo template global “Premium Editável v2”
8. Marcar o premium editável atual como legado
9. Validar fullscreen, preview fiel e compatibilidade

---

## Resultado esperado

- o premium deixa de ser um “anexo” do editor antigo
- some a classe de erro “Widget não reconhecido” por divergência entre arquivos
- passa a existir um **editor premium realmente melhor**, mais consistente e mais escalável
- templates normais continuam no editor atual
- premium fixo continua existindo
- premium editável vira um produto próprio, com base sólida para crescer

## Decisão recomendada

Seguir com:
- **editor atual** para templates normais
- **template fixo** para showcase instantâneo
- **novo Premium Builder v2** como solução oficial para premium editável

Essa é a opção mais limpa, mais robusta e mais alinhada com tudo que o projeto já aprendeu até aqui.
