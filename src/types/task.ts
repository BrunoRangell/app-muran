export interface Space {
  id: string;
  name: string;
  folders: Folder[];
}

export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  lists: List[];
}

export interface List {
  id: string;
  name: string;
  folderId: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  listId: string;
}