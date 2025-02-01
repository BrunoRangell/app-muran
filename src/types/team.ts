export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
  start_date: string;
  email: string;
  permission: string;
}

export interface EditFormData {
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
}