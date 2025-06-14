import { useState } from "react";
import { Space } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { SpaceItem } from "./SpaceItem";

export const SpaceList = () => {
  const [spaces, setSpaces] = useState<Space[]>([
    {
      id: "1",
      name: "Meu Espaço",
      folders: [],
    },
  ]);

  const handleAddSpace = () => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name: "Novo Espaço",
      folders: [],
    };
    setSpaces([...spaces, newSpace]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Espaços</h2>
        <Button
          onClick={handleAddSpace}
          variant="ghost"
          size="sm"
          className="text-white hover:text-muran-primary hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {spaces.map((space) => (
          <SpaceItem key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
};