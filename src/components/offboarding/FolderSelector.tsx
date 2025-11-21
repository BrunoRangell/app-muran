import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FolderOption {
  id: string;
  name: string;
  archived: boolean;
}

interface FolderSelectorProps {
  folders: FolderOption[];
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const FolderSelector = ({
  folders,
  selectedFolderId,
  onSelect,
  onConfirm,
  isProcessing,
}: FolderSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecionar Pasta do ClickUp</CardTitle>
        <CardDescription>
          Encontramos {folders.length} pasta(s) similar(es). Selecione a pasta correta do cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 transition-all
                ${
                  selectedFolderId === folder.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  {folder.archived ? (
                    <Archive className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Folder className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">{folder.name}</p>
                  {folder.archived && (
                    <Badge variant="secondary" className="mt-1">
                      Arquivada
                    </Badge>
                  )}
                </div>
              </div>
              {selectedFolderId === folder.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={onConfirm}
          disabled={!selectedFolderId || isProcessing}
          className="w-full"
          size="lg"
        >
          Confirmar Pasta e Continuar
        </Button>
      </CardContent>
    </Card>
  );
};
