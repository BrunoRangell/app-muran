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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-muran-complementary">Espaços</h2>
        <Button
          onClick={handleAddSpace}
          variant="outline"
          size="sm"
          className="text-muran-primary hover:text-muran-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Espaço
        </Button>
      </div>
      <div className="space-y-2">
        {spaces.map((space) => (
          <SpaceItem key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
};