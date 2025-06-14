
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
