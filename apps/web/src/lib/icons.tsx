import {
  Circle,
  FileSearch,
  FlaskConical,
  LucideIcon,
  Menu,
  PencilLine,
  Quote,
  Search,
  Table2,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "file-search": FileSearch,
  quote: Quote,
  table: Table2,
  flask: FlaskConical,
  write: PencilLine,
  search: Search,
  menu: Menu,
};

export function getIcon(iconName: string) {
  return iconMap[iconName] ?? Circle;
}
