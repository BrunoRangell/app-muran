
-- Inserir novos emblemas para Bruno Rangel
INSERT INTO badges (id, code, name, description, icon, team_member_id, created_at)
VALUES 
  (gen_random_uuid(), 'INNOVATION_2024', 'Inovador do Ano', 'Reconhecimento por contribuições inovadoras excepcionais em 2024', 'motivation_star', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'TEAM_LEADERSHIP', 'Líder Inspirador', 'Demonstrou excelente liderança e mentoria da equipe', 'crown', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'PERFORMANCE_2024', 'Desempenho Excepcional', 'Superou todas as metas de desempenho em 2024', '1st_place', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'PROJECT_EXCELLENCE', 'Excelência em Projetos', 'Gerenciou com sucesso projetos críticos para a empresa', 'direct_hit', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'CLIENT_SATISFACTION', 'Satisfação do Cliente', 'Reconhecido por feedback excepcional dos clientes', 'glowing_star', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'CULTURE_CHAMPION', 'Campeão da Cultura', 'Promove e fortalece a cultura organizacional da Muran', 'motivation_sparkles', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'COLLABORATION_STAR', 'Estrela da Colaboração', 'Excelente trabalho em equipe e colaboração entre departamentos', 'handshake', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'QUALITY_MASTER', 'Mestre da Qualidade', 'Mantém os mais altos padrões de qualidade em todos os entregáveis', 'hundred_points', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW()),
  
  (gen_random_uuid(), 'INNOVATION_PIONEER', 'Pioneiro em Inovação', 'Implementou soluções inovadoras que transformaram processos', 'bulb', '4d4d4fd2-4039-44df-bd63-94de78b261eb', NOW());

