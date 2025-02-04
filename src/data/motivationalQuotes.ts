export const motivationalQuotes = [
  {
    quote: "A excelência não é um ato, mas um hábito.",
    author: "Aristóteles"
  },
  {
    quote: "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    author: "Robert Collier"
  },
  {
    quote: "Sua marca é o que as pessoas dizem sobre você quando você não está na sala.",
    author: "Jeff Bezos"
  },
  {
    quote: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.",
    author: "Eleanor Roosevelt"
  },
  {
    quote: "A melhor maneira de prever o futuro é criá-lo.",
    author: "Peter Drucker"
  },
  {
    quote: "Não espere por oportunidades, crie-as.",
    author: "George Bernard Shaw"
  },
  {
    quote: "A excelência é fazer o comum de maneira incomum.",
    author: "Booker T. Washington"
  },
  {
    quote: "As oportunidades não acontecem. Você as cria.",
    author: "Chris Grosser"
  },
  {
    quote: "A excelência é fazer o seu melhor quando o seu melhor é necessário.",
    author: "John Wooden"
  },
  {
    quote: "O segredo do seu futuro está escondido na sua rotina diária.",
    author: "Mike Murdock"
  },
  {
    quote: "A oportunidade está sempre disfarçada de trabalho duro.",
    author: "Thomas Edison"
  },
  {
    quote: "O que você faz hoje pode melhorar todos os seus amanhãs.",
    author: "Ralph Marston"
  },
  {
    quote: "Seja a mudança que você quer ver no mundo.",
    author: "Mahatma Gandhi"
  }
];

export const getRandomQuote = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % motivationalQuotes.length;
  return motivationalQuotes[index];
};
