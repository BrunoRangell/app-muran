import { useState } from "react";
import { Folder, List as ListType } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { List, Plus } from "lucide-react";
import { TaskList } from "./TaskList";

interface FolderItemProps {
  folder: Folder;
}

export const FolderItem = ({ folder }: FolderItemProps) => {
  const [lists, setLists] = useState<ListType[]>(folder.lists);

  const handleAddList = () => {
    const newList: ListType = {
      id: crypto.randomUUID(),
      name: "Nova Lista",
      folderId: folder.id,
      tasks: [],
    };
    setLists([...lists, newList]);
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={folder.id}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center space-x-2">
            <List className="h-4 w-4 text-muran-primary" />
            <span>{folder.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-4 space-y-4">
            <Button
              onClick={handleAddList}
              variant="ghost"
              size="sm"
              className="text-muran-primary hover:text-muran-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
            <div className="space-y-2">
              {lists.map((list) => (
                <div key={list.id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">{list.name}</h3>
                  <TaskList tasks={list.tasks} />
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};