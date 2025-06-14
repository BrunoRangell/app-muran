
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
import { TaskList } from "@/components/tasks/TaskList";

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
    <Accordion type="single" collapsible className="border-none">
      <AccordionItem value={folder.id} className="border-none">
        <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-white/10">
          <div className="flex items-center space-x-2">
            <List className="h-4 w-4 text-muran-primary" />
            <span className="text-sm text-white">{folder.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-4 space-y-2">
            <Button
              onClick={handleAddList}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
            <div className="space-y-2">
              {lists.map((list) => (
                <div key={list.id} className="py-2 px-3 rounded-lg hover:bg-white/10">
                  <h3 className="text-sm text-white">{list.name}</h3>
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
