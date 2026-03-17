import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    showDivisions?: boolean;
  }
>(({ className, showDivisions = false, ...props }, ref) => {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const step = props.step ?? 1;
  const numberOfSteps = Math.floor((max - min) / step) + 1;
  const steps = Array.from({ length: numberOfSteps }, (_, i) => min + i * step);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {showDivisions &&
        steps.map((stepValue, index) => {
          // Skip the first and last step
          if (index === 0 || index === steps.length - 1) return null;

          return (
            <div
              key={index}
              className="absolute w-px bg-gray-300 h-4"
              style={{
                left: `${((stepValue - min) / (max - min)) * 100}%`,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          );
        })}

      <SliderPrimitive.Thumb className="block h-7 w-7 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
