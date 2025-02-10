
export interface BadgeIcon {
  icon: string;
  name: string;
  label: string;
  category: string;
}

export interface IconButtonProps {
  icon: string;
  name: string;
  label: string;
  isSelected: boolean;
  onSelect: (name: string) => void;
}
