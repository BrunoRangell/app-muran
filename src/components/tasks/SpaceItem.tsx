
import { useState } from "react";
import { Space, Folder as FolderType } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderList } from "@/components/tasks/FolderList";
import { Folder, Plus } from "lucide-react";

interface SpaceItemProps {
  space: Space;
}

export const SpaceItem = ({ space }: SpaceItemProps) => {
  const [folders, setFolders] = useState<FolderType[]>(space.folders);

  const handleAddFolder = () => {
    const newFolder: FolderType = {
      id: crypto.randomUUID(),
      name: "Nova Pasta",
      spaceId: space.id,
      lists: [],
    };
    setFolders([...folders, newFolder]);
  };

  return (
    <Accordion type="single" collapsible className="border-none">
      <AccordionItem value={space.id} className="border-none">
        <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-white/10">
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4 text-muran-primary" />
            <span className="text-sm text-white">{space.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-4 space-y-2">
            <Button
              onClick={handleAddFolder}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Pasta
            </Button>
            <FolderList folders={folders} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
