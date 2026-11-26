// Icon.js - Comprehensive unified icon component with full Lucide icon mappings
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
  clock: LucideIcons.Clock,
  history: LucideIcons.History,
  calendar: LucideIcons.Calendar,
  check: LucideIcons.Check,
  checkmark: LucideIcons.Check,
  'check-circle': LucideIcons.CheckCircle,
  'checkmark-circle': LucideIcons.CheckCircle,
  'checkmark-done': LucideIcons.CheckCheck,
  warning: LucideIcons.AlertTriangle,
  alert: LucideIcons.AlertCircle,
  'alert-circle': LucideIcons.AlertCircle,
  close: LucideIcons.X,
  x: LucideIcons.X,
  add: LucideIcons.Plus,
  plus: LucideIcons.Plus,
  trash: LucideIcons.Trash2,
  'bar-chart': LucideIcons.BarChart3,
  reports: LucideIcons.BarChart3,
  'pie-chart': LucideIcons.PieChart,
  bell: LucideIcons.Bell,
  shield: LucideIcons.Shield,
  cloud: LucideIcons.Cloud,
  wifi: LucideIcons.Wifi,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  'arrow-back': LucideIcons.ArrowLeft,
  'arrow-forward': LucideIcons.ArrowRight,
  'chevron-down': LucideIcons.ChevronDown,
  'chevron-up': LucideIcons.ChevronUp,
  'chevron-right': LucideIcons.ChevronRight,
  'chevron-left': LucideIcons.ChevronLeft,
  refresh: LucideIcons.RefreshCw,
  search: LucideIcons.Search,
  create: LucideIcons.Pencil,
  edit: LucideIcons.Pencil,
  pencil: LucideIcons.Pencil,
  image: LucideIcons.Image,
  images: LucideIcons.Image,
  photo: LucideIcons.Image,
  photos: LucideIcons.Image,
  location: LucideIcons.MapPin,
  'map-pin': LucideIcons.MapPin,
  pin: LucideIcons.MapPin,
  clipboard: LucideIcons.ClipboardList,
  sparkles: LucideIcons.Sparkles,
  zap: LucideIcons.Zap,
  lock: LucideIcons.Lock,
  eye: LucideIcons.Eye,
  'eye-off': LucideIcons.EyeOff,
  info: LucideIcons.Info,
  settings: LucideIcons.Settings,
};

export default function Icon({ name = 'Sparkles', size = 20, color = '#64748b', strokeWidth = 2, ...props }) {
  const normalizedKey = typeof name === 'string' ? name.toLowerCase().trim() : '';
  const Component =
    LEGACY_MAP[name] ||
    LEGACY_MAP[normalizedKey] ||
    LucideIcons[name] ||
    LucideIcons.Sparkles;

  if (!Component) return null;
  return <Component size={size} color={color} strokeWidth={strokeWidth} {...props} />;
}
