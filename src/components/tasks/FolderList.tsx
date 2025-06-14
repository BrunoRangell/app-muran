import { Folder } from "@/types/task";
import { FolderItem } from "./FolderItem";

interface FolderListProps {
  folders: Folder[];
}

export const FolderList = ({ folders }: FolderListProps) => {
  return (
    <div className="space-y-2">
      {folders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} />
      ))}
    </div>
  );
};