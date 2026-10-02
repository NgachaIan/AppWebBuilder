import {
  CircleHelp, Clock, Image, Images, LayoutGrid, Megaphone, PanelBottom, PanelTop, Phone, Quote, ShoppingBag, Smartphone, Sparkles, Type,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  CircleHelp, Clock, Image, Images, LayoutGrid, Megaphone, PanelBottom, PanelTop, Phone, Quote, ShoppingBag, Smartphone, Sparkles, Type,
};

export function BlockIcon({ name, className = 'size-4' }: { name: string; className?: string }) {
  const I = MAP[name] ?? LayoutGrid;
  return <I className={className} strokeWidth={1.8} />;
}
