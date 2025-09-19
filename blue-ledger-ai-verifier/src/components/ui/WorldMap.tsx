"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";

interface MapPin {
  lat: number;
  lng: number;
  // label?: string; // Removed label from interface
}

interface MapProps {
  pins?: MapPin[];
  pinColor?: string;
}

export function WorldMap({
  pins = [],
  pinColor = "#0ea5e9", // A vibrant blue
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const map = new DottedMap({ height: 100, grid: "diagonal" });
  
  const theme = 'light'; // As discussed, manual 'light' theme since next-themes isn't used.

  const svgMap = map.getSVG({
    radius: 0.22,
    color: theme === "light" ? "#00000040" : "#FFFFFF40",
    shape: "circle",
    backgroundColor: "#FFFFFF", // Made background opaque
  });

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  return (
    <div className="w-full aspect-[2/1] bg-background rounded-lg relative font-sans overflow-hidden"> {/* Added overflow-hidden */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {pins.map((pin, i) => {
          const point = projectPoint(pin.lat, pin.lng);
          return (
            <g key={`pin-group-${i}`} transform={`translate(${point.x}, ${point.y})`}>
              <motion.circle
                cx="0"
                cy="0"
                r="2.5"
                fill={pinColor}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 * i, ease: "easeOut" }}
              />
              <motion.circle
                cx="0"
                cy="0"
                r="2.5"
                fill={pinColor}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 5, 1], opacity: [0.8, 0, 0.8] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: 0.5 * i,
                  ease: "easeInOut",
                }}
              />
              {/* Removed pin.label rendering */}
            </g>
          );
        })}
      </svg>
    </div>
  );
}