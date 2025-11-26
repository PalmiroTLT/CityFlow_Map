import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
        outline: "text-foreground border-2 border-border hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
