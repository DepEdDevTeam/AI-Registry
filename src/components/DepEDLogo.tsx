import React from "react";

type DepEdLogoProps = {
  size?: "sm" | "md" | "lg";
  glow?: boolean;
};

const sizeMap = {
  sm: "text-[32px]",
  md: "text-[56px]",
  lg: "text-[80px]",
};

export default function DepEdLogo({
  size = "lg",
  glow = true,
}: DepEdLogoProps) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* WORDMARK */}
      <div className={`flex items-end font-black tracking-tight text-white ${sizeMap[size]}`}>
        {/* DEP */}
        <span>Dep</span>

        {/* TORCH */}
        <div className="relative mx-2 flex items-end">
          {/* HANDLE */}
          <div className="w-[10px] h-[60px] bg-gray-300 rounded-sm relative">
            {/* FLAME BASE */}
            <div
              className={`absolute -top-10 -left-3 w-[30px] h-[30px]
              bg-[radial-gradient(circle,#fde047_10%,#f97316_60%,#dc2626_100%)]
              rotate-45 rounded-full blur-[1px]
              ${glow ? "shadow-[0_0_20px_#fde047]" : ""}`}
            />

            {/* FLAME TIP */}
            <div
              className="absolute -top-14 -left-1 w-[14px] h-[22px]
              bg-gradient-to-t from-orange-500 to-yellow-300
              [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
            />
          </div>
        </div>

        {/* ED */}
        <span>ED</span>
      </div>

      {/* SUBTEXT */}
      <span className="text-[12px] tracking-[6px] text-gray-400 mt-[-6px]">
        DEPARTMENT OF EDUCATION
      </span>
    </div>
  );
}
