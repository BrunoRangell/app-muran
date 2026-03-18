

# Simplificar modal de cadastro de conta

## Problemas
1. **Campo "Nome da Conta"** desnecessário neste contexto — pode usar o nome da empresa ou um default
2. **Campo "Plataforma"** redundante — o card já indica se é Meta ou Google
3. **ID da Conta** aceita qualquer caractere — precisa validar apenas números

## Solução

### `AddSecondaryAccountModal.tsx`
- Adicionar prop opcional `platform?: 'meta' | 'google'` — quando fornecida, esconde o seletor de plataforma e usa o valor da prop
- Adicionar prop opcional `hideAccountName?: boolean` — quando true, esconde o campo nome e usa um default (ex: "Conta Principal")
- No campo ID da Conta: validar onChange para mostrar aviso inline quando contiver caracteres não numéricos (texto vermelho pequeno abaixo do input: "O ID deve conter apenas números")
- Ajustar o `disabled` do botão Salvar para considerar a validação de números no ID

### `CircularBudgetCard.tsx`
- Passar `platform={platform}` e `hideAccountName` ao `AddSecondaryAccountModal` no card vazio, eliminando campos redundantes

## Resultado
Modal simplificado com apenas 2 campos: **ID da Conta** (apenas números) e **Orçamento**. Sem perguntas desnecessárias.

