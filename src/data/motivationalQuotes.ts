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
    quote: "Transforme seus clientes em fãs e seus sonhos em realidade.",
    author: "Muran Marketing"
  },
  {
    quote: "A criatividade é a inteligência se divertindo.",
    author: "Albert Einstein"
  },
  {
    quote: "O marketing não é sobre produtos, é sobre pessoas.",
    author: "Seth Godin"
  },
  {
    quote: "Grandes resultados vêm de grandes parcerias.",
    author: "Muran Marketing"
  },
  {
    quote: "Sua marca é o que as pessoas dizem sobre você quando você não está na sala.",
    author: "Jeff Bezos"
  },
  {
    quote: "O digital não é o futuro, é o presente.",
    author: "Muran Marketing"
  },
  {
    quote: "Transparência e comprometimento são as chaves do sucesso.",
    author: "Muran Marketing"
  },
  {
    quote: "Juntos somos mais fortes, juntos vamos mais longe.",
    author: "Muran Marketing"
  }
];

export const getRandomQuote = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % motivationalQuotes.length;
  return motivationalQuotes[index];
};