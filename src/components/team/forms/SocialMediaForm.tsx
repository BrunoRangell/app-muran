
import { UseFormReturn } from "react-hook-form";
import { SocialMediaSchemaType, socialMediaFields } from "../schemas/memberSchema";
import { UnifiedFormField } from "@/components/common/UnifiedFormField";
import { Instagram, Linkedin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SocialMediaFormProps {
  form: UseFormReturn<SocialMediaSchemaType>;
}

export const SocialMediaForm = ({ form }: SocialMediaFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-[#321e32] flex items-center gap-2">
          <Instagram className="h-5 w-5 text-[#ff6e00]" />
          Redes Sociais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialMediaFields.map((field) => (
          <UnifiedFormField
            key={field.name}
            form={form}
            name={field.name}
            label={field.label}
            type="text"
            placeholder={field.placeholder}
            className="space-y-2"
          />
        ))}
      </CardContent>
    </Card>
  );
};
