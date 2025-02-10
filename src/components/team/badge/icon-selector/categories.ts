
// Define as categorias de ícones disponíveis
export const BADGE_CATEGORIES = [
  "Conquistas",
  "Positivos", 
  "Natureza",
  "Objetos",
  "Tecnologia",
  "Emoções",
  "Símbolos",
  "Profissões",
  "Motivacionais",
  "Extras"
] as const;

export type BadgeCategory = typeof BADGE_CATEGORIES[number];
