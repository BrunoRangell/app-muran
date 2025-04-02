
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface Token {
  name: string;
  value: string;
  status: "valid" | "invalid" | "unknown";
}

export const GoogleAdsTokenTest = () => {
  const [showTokenValues, setShowTokenValues] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([
    { 
      name: "google_ads_access_token", 
      value: "ya29.a0AfB_byDzgho56tGLV-...", 
      status: "valid" 
    },
    { 
      name: "google_ads_refresh_token", 
      value: "1//0gTUhcVvlD-k8CgYIARAAGBAS...", 
      status: "valid" 
    },
    { 
      name: "google_ads_client_id", 
      value: "104638799476-j8mghjlp8g7...", 
      status: "valid" 
    },
    { 
      name: "google_ads_client_secret", 
      value: "GOCSPX-dhGqQrRJgt9Dy...", 
      status: "valid" 
    },
    { 
      name: "google_ads_developer_token", 
      value: "KgVPXbwe73F8jf6I8ObP_g", 
      status: "valid" 
    }
  ]);

  const toggleTokenVisibility = () => {
    setShowTokenValues(!showTokenValues);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Tokens configurados</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTokenVisibility}
          className="h-8"
        >
          {showTokenValues ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Esconder valores
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Mostrar valores
            </>
          )}
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Token</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.name}>
                <TableCell className="font-mono text-sm">{token.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {showTokenValues ? token.value : "••••••••••••••••••••••"}
                </TableCell>
                <TableCell>
                  {token.status === "valid" ? (
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" /> Válido
                    </div>
                  ) : token.status === "invalid" ? (
                    <div className="flex items-center text-red-600">
                      <X className="h-4 w-4 mr-1" /> Inválido
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      ? Desconhecido
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
