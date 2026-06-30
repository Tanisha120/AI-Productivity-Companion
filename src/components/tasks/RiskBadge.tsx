import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, AlertCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md";
}

export function RiskBadge({ score, showScore = true, size = "md" }: RiskBadgeProps) {
  const level =
    score >= 80 ? "critical" : score >= 60 ? "high" : score >= 35 ? "medium" : "low";

  const config = {
    critical: {
      variant: "critical" as const,
      icon: Flame,
      label: "Critical Risk",
    },
    high: {
      variant: "high" as const,
      icon: AlertCircle,
      label: "High Risk",
    },
    medium: {
      variant: "medium" as const,
      icon: AlertTriangle,
      label: "Medium Risk",
    },
    low: {
      variant: "low" as const,
      icon: Shield,
      label: "Low Risk",
    },
  };

  const { variant, icon: Icon, label } = config[level];

  return (
    <Badge
      variant={variant}
      className={cn("gap-1 font-medium", size === "sm" && "text-[10px] px-1.5 py-0")}
    >
      <Icon className={cn("w-3 h-3", size === "sm" && "w-2.5 h-2.5")} />
      {showScore ? `${score}` : label}
    </Badge>
  );
}
