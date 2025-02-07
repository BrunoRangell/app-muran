
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
  start_date: string;
  email: string;
  permission: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
}

export interface EditFormData {
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
}

export interface TeamMemberCardProps {
  member: TeamMember;
  currentUserPermission: string;
  currentUserId: string;
  onEdit: (member: TeamMember) => void;
  className?: string;
}
