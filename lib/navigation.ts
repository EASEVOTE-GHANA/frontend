import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  Vote,
  Settings,
  FileText,
  DollarSign,
  BarChart3,
  Shield,
  Building2,
  MessageSquare,
  HelpCircle,
  Bell,
  Globe,
  UserCog,
  Megaphone,
  CreditCard,
  PieChart,
  TrendingUp,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: { name: string; href: string }[];
};

export type NavigationSection = {
  title?: string;
  items: NavigationItem[];
};

export const superAdminNavigation: NavigationSection[] = [
  {
    items: [{ name: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Platform Management",
    items: [
      { name: "Organizers", href: "/dashboard/organizers", icon: Building2 },
      { name: "Admins", href: "/dashboard/admins", icon: UserCog },
    ],
  },
  {
    title: "Events & Content",
    items: [
      {
        name: "All Events",
        href: "/dashboard/events",
        icon: Calendar,
        children: [
          { name: "Voting Events", href: "/dashboard/voting" },
          { name: "Ticketing", href: "/dashboard/ticketing" },
          { name: "Deleted Events", href: "/dashboard/events/deleted" },
        ],
      },
    ],
  },
  {
    title: "Financial",
    items: [
      {
        name: "Transactions",
        href: "/dashboard/transactions",
        icon: DollarSign,
      },
      { name: "Payouts", href: "/dashboard/payouts", icon: CreditCard },
      { name: "Revenue", href: "/dashboard/revenue", icon: TrendingUp },
      {
        name: "Payment Gateways",
        href: "/dashboard/finance/settings",
        icon: Settings,
      },
    ],
  },
  {
    title: "Analytics & Reports",
    items: [
      {
        name: "Platform Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
      },
      { name: "Reports", href: "/dashboard/reports", icon: PieChart },
    ],
  },
  {
    title: "CMS",
    items: [
      { name: "Blog Posts", href: "/dashboard/cms/blogs", icon: FileText },
      { name: "FAQs", href: "/dashboard/cms/faqs", icon: HelpCircle },
      { name: "Banners", href: "/dashboard/cms/banners", icon: Megaphone },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Security", href: "/dashboard/security", icon: Shield },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { name: "My Account", href: "/dashboard/account", icon: UserCog },
    ],
  },
];

export const adminNavigation: NavigationSection[] = [
  {
    items: [{ name: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Event Management",
    items: [
      {
        name: "All Events",
        href: "/dashboard/events",
        icon: Calendar,
        children: [
          { name: "Voting Events", href: "/dashboard/voting" },
          { name: "Ticketing Events", href: "/dashboard/ticketing" },
          { name: "Deleted Events", href: "/dashboard/events/deleted" },
        ],
      },
      { name: "Pending Approvals", href: "/dashboard/approvals", icon: FileText },
    ],
  },
  {
    title: "Users & Organizers",
    items: [
      { name: "Organizers", href: "/dashboard/organizers", icon: Building2 },
    ],
  },
  {
    title: "Financial",
    items: [
      { name: "Transactions", href: "/dashboard/transactions", icon: DollarSign },
      { name: "Payout Requests", href: "/dashboard/payouts", icon: CreditCard },
    ],
  },
  {
    title: "Analytics",
    items: [{ name: "Reports", href: "/dashboard/reports", icon: BarChart3 }],
  },
  {
    title: "Settings",
    items: [
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { name: "My Account", href: "/dashboard/account", icon: Settings }
    ],
  },
];

export const organizerNavigation: NavigationSection[] = [
  {
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "My Events",
    items: [
      {
        name: "All Events",
        href: "/dashboard/events",
        icon: Calendar,
        children: [
          { name: "Voting Events", href: "/dashboard/voting" },
          { name: "Ticketing", href: "/dashboard/ticketing" },
          { name: "Deleted Events", href: "/dashboard/events/deleted" },
        ],
      },
      { name: "Create Event", href: "/dashboard/events/new", icon: Vote },
    ],
  },
  {
    title: "Voting",
    items: [
      { name: "Nominations", href: "/dashboard/nominations", icon: Users },
      { name: "Vote Results", href: "/dashboard/results", icon: BarChart3 },
    ],
  },
  {
    title: "Financial",
    items: [
      { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "Profile", href: "/dashboard/account", icon: UserCog },
    ],
  },
];

export function getNavigationForRole(role: string): NavigationSection[] {
  switch (role) {
    case "SUPER_ADMIN":
      return superAdminNavigation;
    case "ADMIN":
      return adminNavigation;
    case "ORGANIZER":
      return organizerNavigation;
    default:
      return [];
  }
}
