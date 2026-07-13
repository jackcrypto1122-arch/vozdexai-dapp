import {
  ArrowLeftRight,
  PieChart,
  LineChart,
  ListOrdered,
  History,
  Mic,
  Settings,
  AudioLines,
  KeyRound,
} from "lucide-react";

export const navItems = [
  { to: "/", label: "Swap", icon: ArrowLeftRight },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/orders", label: "Orders", icon: ListOrdered },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/private-x402-payments", label: "Private x402 Payments", icon: AudioLines },
  { to: "/key-recovery", label: "Key Recovery", icon: KeyRound },
] as const;

export type NavItem = (typeof navItems)[number];
