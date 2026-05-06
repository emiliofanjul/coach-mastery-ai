import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Botones Closer.
 *
 * Variantes:
 *  - primary  → naranja sólido. ÚNICO uso: acción principal "avanza aquí".
 *               Sagrado. No usar como decoración.
 *  - hero     → primary con halo naranja, escala mayor. Para CTAs del Home.
 *  - secondary→ superficie elevada. Acción alternativa.
 *  - ghost    → sin fondo. Acciones terciarias.
 *  - outline  → borde fuerte. "Saltar", "Cancelar", neutral.
 *  - coach    → azul Closer Coach. Solo para abrir/usar el Coach Bubble.
 *  - destructive → solo para acciones destructivas reales.
 *
 *  Forma:
 *  - Todos completamente redondeados (rounded-full / 99px).
 *    Comunica "soy una acción", no un contenedor.
 *  - Sizes mobile-first. h-12 default = thumb-friendly.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-display font-semibold tracking-tight",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:size-[1.15em] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-orange)] hover:brightness-110",
        hero:
          "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-orange)] hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent border border-border-strong",
        ghost:
          "bg-transparent text-foreground hover:bg-accent",
        outline:
          "bg-transparent text-foreground border border-border-strong hover:bg-accent",
        coach:
          "bg-coach text-coach-foreground hover:brightness-110 shadow-[0_8px_24px_-10px_oklch(0.72_0.12_230_/_0.55)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110",
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-12 px-6 text-base",
        lg: "h-14 px-7 text-lg",
        xl: "h-16 px-8 text-xl",
        icon: "h-12 w-12 text-base",
        "icon-sm": "h-9 w-9 text-sm",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, block, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
