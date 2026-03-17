
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className, delay = 0 }: FadeProps) => {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={cn("animate-fade-in", className)} 
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export const ScaleIn = ({ children, className, delay = 0 }: FadeProps) => {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={cn("animate-scale-in", className)} 
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export const SlideInBottom = ({ children, className, delay = 0 }: FadeProps) => {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={cn("animate-slide-in-bottom", className)} 
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export const SlideInRight = ({ children, className, delay = 0 }: FadeProps) => {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={cn("animate-slide-in-right", className)} 
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export const SlideInLeft = ({ children, className, delay = 0 }: FadeProps) => {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={cn("animate-slide-in-left", className)} 
      style={delayStyle}
    >
      {children}
    </div>
  );
};

export const StaggeredChildren = ({ 
  children, 
  className, 
  baseDelay = 100, 
  staggerDelay = 50 
}: { 
  children: ReactNode[]; 
  className?: string; 
  baseDelay?: number;
  staggerDelay?: number;
}) => {
  return (
    <div className={className}>
      {Array.isArray(children) ? 
        children.map((child, index) => (
          <SlideInBottom 
            key={index} 
            delay={baseDelay + (index * staggerDelay)}
          >
            {child}
          </SlideInBottom>
        )) : 
        <SlideInBottom delay={baseDelay}>{children}</SlideInBottom>
      }
    </div>
  );
};
