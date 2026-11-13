// DEPRECATED: Icon.js is deprecated.
// Please import icons directly from 'lucide-react-native'.
// Example: import { BookOpen, Calendar, Clock, Bell, Scan, Users } from 'lucide-react-native';

import React from 'react';
import * as LucideIcons from 'lucide-react-native';

export * from 'lucide-react-native';

const LEGACY_MAP = {
  home: LucideIcons.Home,
  grid: LucideIcons.LayoutGrid,
  dashboard: LucideIcons.LayoutGrid,
  scan: LucideIcons.Scan,
  camera: LucideIcons.Camera,
  school: LucideIcons.GraduationCap,
  book: LucideIcons.BookOpen,
  person: LucideIcons.User,
  user: LucideIcons.User,
  people: LucideIcons.Users,
  time: LucideIcons.Clock,
  history: LucideIcons.History,
  calendar: LucideIcons.Calendar,
  check: LucideIcons.Check,
  warning: LucideIcons.AlertTriangle,
  alert: LucideIcons.AlertCircle,
  close: LucideIcons.X,
  add: LucideIcons.Plus,
  trash: LucideIcons.Trash2,
  'bar-chart': LucideIcons.BarChart3,
  reports: LucideIcons.BarChart3,
  'pie-chart': LucideIcons.PieChart,
  bell: LucideIcons.Bell,
  shield: LucideIcons.Shield,
  cloud: LucideIcons.Cloud,
  wifi: LucideIcons.Wifi,
  download: LucideIcons.Download,
  'arrow-back': LucideIcons.ArrowLeft,
  'arrow-forward': LucideIcons.ArrowRight,
  'chevron-down': LucideIcons.ChevronDown,
  refresh: LucideIcons.RefreshCw,
  search: LucideIcons.Search,
};

export default function Icon({ name = 'HelpCircle', size = 20, color = '#64748b', strokeWidth = 2, ...props }) {
  const Component = LEGACY_MAP[name] || LucideIcons[name] || LucideIcons.CircleHelp || LucideIcons.HelpCircle;
  if (!Component) return null;
  return <Component size={size} color={color} strokeWidth={strokeWidth} {...props} />;
}
