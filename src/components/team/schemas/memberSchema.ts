
import * as z from "zod";

export const socialMediaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().optional(),
  photo_url: z.string().optional(),
  birthday: z.string().min(1, "Data de aniversário é obrigatória"),
  bio: z.string().optional(),
  instagram: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?instagram\.com\/.+/), {
      message: "O link do Instagram deve começar com 'https://www.instagram.com/' ou 'https://instagram.com/'"
    }),
  linkedin: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?linkedin\.com\/.+/), {
      message: "O link do LinkedIn deve começar com 'https://www.linkedin.com/' ou 'https://linkedin.com/'"
    }),
  tiktok: z.string().optional()
    .refine(value => !value || value.match(/^https:\/\/(www\.)?tiktok\.com\/.+/), {
      message: "O link do TikTok deve começar com 'https://www.tiktok.com/' ou 'https://tiktok.com/'"
    }),
  permission: z.string().optional(),
  start_date: z.string().optional()
});

export type SocialMediaSchemaType = z.infer<typeof socialMediaSchema>;

// Opções para permissões
export const permissionOptions = [
  { label: "Administrador", value: "admin" },
  { label: "Membro", value: "member" },
];

// Opções para redes sociais
export const socialMediaFields = [
  { name: "instagram" as const, label: "Instagram", placeholder: "https://www.instagram.com/seu.perfil/" },
  { name: "linkedin" as const, label: "LinkedIn", placeholder: "https://www.linkedin.com/in/seu-perfil/" },
  { name: "tiktok" as const, label: "TikTok", placeholder: "https://www.tiktok.com/@seu.perfil" },
];
