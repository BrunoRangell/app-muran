
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType } from "@/components/team/schemas/memberSchema";
import { SocialMediaForm } from "@/components/team/forms/SocialMediaForm";

interface SocialMediaSectionProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const SocialMediaSection = ({ form }: SocialMediaSectionProps) => {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
        <div className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-[#321e32] text-lg">Redes Sociais</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Links para suas redes sociais profissionais
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <SocialMediaForm form={form} />
      </CardContent>
    </Card>
  );
};
