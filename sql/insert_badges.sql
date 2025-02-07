
-- Inserir novos emblemas para Bruno Rangel
INSERT INTO badges (id, code, name, description, icon, team_member_id, created_at)
VALUES 
  (gen_random_uuid(), 'INNOVATION_2024', 'Inovador do Ano', 'Reconhecimento por contribuições inovadoras excepcionais em 2024', 'award', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'TEAM_LEADERSHIP', 'Líder Inspirador', 'Demonstrou excelente liderança e mentoria da equipe', 'star', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'PERFORMANCE_2024', 'Desempenho Excepcional', 'Superou todas as metas de desempenho em 2024', 'medal', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'PROJECT_EXCELLENCE', 'Excelência em Projetos', 'Gerenciou com sucesso projetos críticos para a empresa', 'ribbon', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'CLIENT_SATISFACTION', 'Satisfação do Cliente', 'Reconhecido por feedback excepcional dos clientes', 'gem', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'CULTURE_CHAMPION', 'Campeão da Cultura', 'Promove e fortalece a cultura organizacional da Muran', 'flag', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'COLLABORATION_STAR', 'Estrela da Colaboração', 'Excelente trabalho em equipe e colaboração entre departamentos', 'badge', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'QUALITY_MASTER', 'Mestre da Qualidade', 'Mantém os mais altos padrões de qualidade em todos os entregáveis', 'badge_check', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'INNOVATION_PIONEER', 'Pioneiro em Inovação', 'Implementou soluções inovadoras que transformaram processos', 'star', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW());

