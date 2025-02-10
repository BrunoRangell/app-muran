
// Lista de emojis com seus identificadores e rótulos
interface BadgeIcon {
  icon: string;
  name: string;
  label: string;
  category: string;
}

export const BADGE_ICONS: BadgeIcon[] = [
  // Conquistas e Prêmios
  { icon: "🏆", name: "trophy", label: "Troféu", category: "Conquistas" },
  { icon: "🎖️", name: "medal_military", label: "Medalha Militar", category: "Conquistas" },
  { icon: "🏅", name: "medal_sports", label: "Medalha Esportiva", category: "Conquistas" },
  { icon: "🥇", name: "1st_place", label: "Primeiro Lugar", category: "Conquistas" },
  { icon: "🥈", name: "2nd_place", label: "Segundo Lugar", category: "Conquistas" },
  { icon: "🥉", name: "3rd_place", label: "Terceiro Lugar", category: "Conquistas" },
  { icon: "👑", name: "crown", label: "Coroa", category: "Conquistas" },
  { icon: "⭐", name: "star", label: "Estrela", category: "Conquistas" },
  { icon: "🌟", name: "glowing_star", label: "Estrela Brilhante", category: "Conquistas" },
  { icon: "✨", name: "sparkles", label: "Brilhos", category: "Conquistas" },
  { icon: "💫", name: "dizzy", label: "Brilho Espiral", category: "Conquistas" },
  { icon: "🎯", name: "dart", label: "Alvo", category: "Conquistas" },
  
  // Elementos Positivos
  { icon: "💪", name: "muscle", label: "Força", category: "Positivos" },
  { icon: "👏", name: "clap", label: "Palmas", category: "Positivos" },
  { icon: "🙌", name: "raised_hands", label: "Mãos Erguidas", category: "Positivos" },
  { icon: "👍", name: "thumbs_up", label: "Joinha", category: "Positivos" },
  { icon: "🌈", name: "rainbow", label: "Arco-íris", category: "Positivos" },
  { icon: "☀️", name: "sun", label: "Sol", category: "Positivos" },
  { icon: "🌞", name: "sun_face", label: "Sol com Rosto", category: "Positivos" },
  { icon: "⚡", name: "zap", label: "Raio", category: "Positivos" },
  { icon: "💡", name: "bulb", label: "Lâmpada", category: "Positivos" },
  { icon: "🎉", name: "party", label: "Festa", category: "Positivos" },
  { icon: "🎊", name: "confetti", label: "Confete", category: "Positivos" },
  { icon: "🎨", name: "art", label: "Paleta de Arte", category: "Positivos" },
  
  // Natureza e Elementos
  { icon: "🌺", name: "flower", label: "Flor", category: "Natureza" },
  { icon: "🌸", name: "cherry_blossom", label: "Flor de Cerejeira", category: "Natureza" },
  { icon: "🍀", name: "four_leaf_clover", label: "Trevo", category: "Natureza" },
  { icon: "🌱", name: "seedling", label: "Broto", category: "Natureza" },
  { icon: "🌲", name: "evergreen_tree", label: "Árvore", category: "Natureza" },
  { icon: "🔥", name: "fire", label: "Fogo", category: "Natureza" },
  { icon: "💧", name: "droplet", label: "Gota", category: "Natureza" },
  { icon: "🌊", name: "wave", label: "Onda", category: "Natureza" },
  
  // Objetos
  { icon: "💎", name: "gem", label: "Gema", category: "Objetos" },
  { icon: "🎭", name: "performing_arts", label: "Teatro", category: "Objetos" },
  { icon: "🎮", name: "video_game", label: "Videogame", category: "Objetos" },
  { icon: "📱", name: "mobile_phone", label: "Celular", category: "Objetos" },
  { icon: "💻", name: "laptop", label: "Laptop", category: "Objetos" },
  { icon: "🎨", name: "artist", label: "Arte", category: "Objetos" },
  { icon: "📚", name: "books", label: "Livros", category: "Objetos" },
  { icon: "✏️", name: "pencil", label: "Lápis", category: "Objetos" },
  { icon: "📎", name: "paperclip", label: "Clipe", category: "Objetos" },
  { icon: "🔍", name: "magnifying_glass", label: "Lupa", category: "Objetos" },
  
  // Tecnologia
  { icon: "🤖", name: "robot", label: "Robô", category: "Tecnologia" },
  { icon: "👾", name: "alien_monster", label: "Alien", category: "Tecnologia" },
  { icon: "💾", name: "floppy_disk", label: "Disquete", category: "Tecnologia" },
  { icon: "🔋", name: "battery", label: "Bateria", category: "Tecnologia" },
  { icon: "📡", name: "satellite", label: "Satélite", category: "Tecnologia" },
  { icon: "🛸", name: "flying_saucer", label: "OVNI", category: "Tecnologia" },
  
  // Emoções e Gestos
  { icon: "❤️", name: "heart", label: "Coração", category: "Emoções" },
  { icon: "🧡", name: "orange_heart", label: "Coração Laranja", category: "Emoções" },
  { icon: "💛", name: "yellow_heart", label: "Coração Amarelo", category: "Emoções" },
  { icon: "💚", name: "green_heart", label: "Coração Verde", category: "Emoções" },
  { icon: "💙", name: "blue_heart", label: "Coração Azul", category: "Emoções" },
  { icon: "💜", name: "purple_heart", label: "Coração Roxo", category: "Emoções" },
  { icon: "🤎", name: "brown_heart", label: "Coração Marrom", category: "Emoções" },
  { icon: "🖤", name: "black_heart", label: "Coração Preto", category: "Emoções" },
  { icon: "🤍", name: "white_heart", label: "Coração Branco", category: "Emoções" },
  
  // Símbolos
  { icon: "✅", name: "check_mark", label: "Check", category: "Símbolos" },
  { icon: "❌", name: "cross_mark", label: "X", category: "Símbolos" },
  { icon: "⭕", name: "circle", label: "Círculo", category: "Símbolos" },
  { icon: "❗", name: "exclamation", label: "Exclamação", category: "Símbolos" },
  { icon: "❓", name: "question", label: "Interrogação", category: "Símbolos" },
  { icon: "💯", name: "hundred", label: "100 Pontos", category: "Símbolos" },
  
  // Profissões e Atividades
  { icon: "👨‍💻", name: "technologist", label: "Tecnólogo", category: "Profissões" },
  { icon: "👩‍💻", name: "woman_technologist", label: "Tecnóloga", category: "Profissões" },
  { icon: "👨‍🔬", name: "scientist", label: "Cientista", category: "Profissões" },
  { icon: "👩‍🔬", name: "woman_scientist", label: "Cientista", category: "Profissões" },
  { icon: "👨‍🎨", name: "artist", label: "Artista", category: "Profissões" },
  { icon: "👩‍🎨", name: "woman_artist", label: "Artista", category: "Profissões" },
  
  // Motivacionais
  { icon: "🎯", name: "direct_hit", label: "Alvo Certeiro", category: "Motivacionais" },
  { icon: "🚀", name: "rocket", label: "Foguete", category: "Motivacionais" },
  { icon: "⚡", name: "high_voltage", label: "Alta Voltagem", category: "Motivacionais" },
  { icon: "💪", name: "flexed_biceps", label: "Força", category: "Motivacionais" },
  { icon: "🏃", name: "runner", label: "Corredor", category: "Motivacionais" },
  { icon: "🧗", name: "climbing", label: "Escalada", category: "Motivacionais" },
  
  // Extras
  { icon: "🎲", name: "game_die", label: "Dado", category: "Extras" },
  { icon: "🎰", name: "slot_machine", label: "Caça-níquel", category: "Extras" },
  { icon: "🎪", name: "circus_tent", label: "Circo", category: "Extras" },
  { icon: "🎭", name: "masks", label: "Máscaras", category: "Extras" },
  { icon: "🎪", name: "circus", label: "Tenda de Circo", category: "Extras" }
];

