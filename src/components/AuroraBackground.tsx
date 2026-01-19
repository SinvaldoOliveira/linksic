import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({ 
  className, 
  children, 
  showRadialGradient = true, 
  ...props 
}: AuroraBackgroundProps) => {
  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center bg-[#0e0f12] text-[#F3F3F3] transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={cn(
            `
            [--orange-gradient:repeating-linear-gradient(100deg,#FF7A1A_0%,#FF5A00_7%,transparent_10%,transparent_12%,#FF7A1A_16%)]
            [--teal-gradient:repeating-linear-gradient(100deg,#2BD5C3_10%,#0d9488_15%,#2BD5C3_20%,#5eead4_25%,#2BD5C3_30%)]
            [--purple-gradient:repeating-linear-gradient(100deg,#8A5CFF_10%,#7c3aed_15%,#8A5CFF_20%,#c084fc_25%,#8A5CFF_30%)]
            [background-image:var(--orange-gradient),var(--teal-gradient),var(--purple-gradient)]
            [background-size:300%,_200%,_150%]
            [background-position:50%_50%,50%_50%,50%_50%]
            filter blur-[10px] 
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--orange-gradient),var(--teal-gradient),var(--purple-gradient)]
            after:[background-size:200%,_100%,_80%]
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-30 will-change-transform`,

            showRadialGradient && 
              `[mask-image:radial-gradient(ellipse_at_center,black_20%,var(--transparent)_70%)]`
          )} 
        ></div>
      </div>
      {children}
    </div>
  );
};