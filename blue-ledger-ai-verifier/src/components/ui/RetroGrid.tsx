import { cn } from "@/lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function RetroGrid({ className, ...props }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden opacity-75 [perspective:200px]",
        className
      )}
      {...props}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(65deg)]">
        <div
          className={cn(
            "animate-[grid_15s_linear_infinite]",
            // ✅ UPDATED: Changed grid lines to semi-transparent black for light mode
            "[background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1.5px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1.5px,transparent_0)]",
            // ✅ UPDATED: Changed grid lines to semi-transparent white for dark mode
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1.5px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1.5px,transparent_0)]",
            
            // Unchanged styles for grid structure and animation
            "[background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]"
          )}
        />
      </div>

      {/* Background Gradient Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%" />
    </div>
  );
}

