import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-md hover:bg-brand-700",
        success:
          "bg-success-600 text-white shadow-md hover:bg-success-700",
        danger:
          "bg-danger-600 text-white shadow-md hover:bg-danger-700",
        outline:
          "border-2 border-brand-600 bg-transparent text-brand-600 hover:bg-brand-50",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      size: {
        sm:   "h-9  px-4 text-xs",
        md:   "h-11 px-6 text-sm",
        lg:   "h-14 px-8 text-base",
        xl:   "h-16 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
