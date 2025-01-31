import { useState } from "react";
import { Space, Folder as FolderType } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderList } from "./FolderList";
import { Folder } from "lucide-react";

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
    <Accordion type="single" collapsible>
      <AccordionItem value={space.id}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4 text-muran-primary" />
            <span>{space.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-4 space-y-4">
            <Button
              onClick={handleAddFolder}
              variant="ghost"
              size="sm"
              className="text-muran-primary hover:text-muran-primary/90"
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