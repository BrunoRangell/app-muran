
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
  tiktok?: string;
  badges?: Badge[];
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  created_at: string;
  team_member_id: string;
}

export interface EditFormData {
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  permission?: string;
  start_date?: string;
}

export interface TeamMemberCardProps {
  member: TeamMember;
  currentUserPermission: string;
  currentUserId: string;
  onEdit: (member: TeamMember) => void;
  className?: string;
}
