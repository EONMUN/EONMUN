import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary shadow-sm hover:bg-primary/90",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-600/90 focus-visible:ring-red-600/20",
        outline:
          "border border-outline bg-surface text-on-surface shadow-sm hover:bg-primary-container hover:text-on-primary-container",
        secondary:
          "bg-secondary text-on-secondary shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-primary-container hover:text-on-primary-container",
        link: "text-primary underline-offset-4 hover:underline",
        container:
          "bg-primary-container text-on-primary-container shadow-sm hover:bg-primary-container/80",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export default Button
