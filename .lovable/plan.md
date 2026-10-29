# Seletor de cliente compacto e modal com altura controlada

## O que o usuário verá
1. **Campo fechado por padrão**: "Cliente" volta a ser um único botão do tamanho dos outros campos, mostrando o cliente escolhido (ou "Selecione um cliente").
2. **Ao clicar**, abre logo abaixo um painel flutuante com:
   - campo de pesquisa já focado (ignora acentos e maiúsculas);
   - lista de todos os clientes ativos com rolagem própria (até ~8 itens visíveis);
   - check no cliente selecionado; o painel fecha ao escolher.
   - funciona com mouse, rolagem da roda e teclado (setas + Enter, Esc fecha).
3. **Modal com altura limitada**: no máximo 90% da tela, cabeçalho fixo e conteúdo rolando por dentro, com os botões Cancelar/Salvar sempre visíveis no rodapé. Nada fica cortado em telas baixas.

## Como vou testar antes de entregar
Como não consigo entrar logado na sua conta pelo navegador de testes, vou montar uma página de teste temporária (só no ambiente de desenvolvimento, removida no fim) que renderiza o mesmo modal com uma lista fictícia de 120 clientes incluindo "Verena Imóveis". Vou automatizar e conferir com capturas de tela:
- abrir o modal em tela baixa (874x706) e confirmar que nada fica cortado e o rodapé aparece;
- abrir o seletor, rolar a lista com a roda do mouse até o fim;
- digitar "verena" e ver só Verena Imóveis; clicar e confirmar que o botão mostra o nome e o painel fecha;
- navegar por teclado e selecionar com Enter.
Só depois disso removo a página de teste e entrego.

## Detalhes técnicos
- `CustomBudgetForm.tsx`: voltar ao Popover + Command (cmdk), porém com `Popover modal` desligado e `PopoverContent` renderizado dentro do container do Dialog (portal com `container` = conteúdo do diálogo) para evitar o bloqueio de rolagem/cliques do `react-remove-scroll` do Dialog; `CommandList` com `max-h-64 overflow-y-auto` e `onWheel` stopPropagation; filtro próprio normalizado; `value` do item = nome + id.
- `CustomBudgetDialog.tsx`: `DialogContent` com `max-h-[90vh] flex flex-col p-0`; corpo `overflow-y-auto`; botões do formulário em rodapé fixo (sticky bottom).
- Consulta de clientes ativos completa permanece como está.
