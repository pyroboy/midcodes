import { tv } from "tailwind-variants";
import "clsx";
const alertVariants = tv({
  base: "[&>svg]:text-foreground relative w-full rounded-lg border p-4 [&:has(svg)]:pl-11 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive text-destructive dark:border-destructive [&>svg]:text-destructive"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});
export {
  alertVariants as a
};
