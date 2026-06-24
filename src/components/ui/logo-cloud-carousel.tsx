import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

    export interface Logo {
    _id: string;
    tool_name: string;
    description?: string;
    logoUrl?: string;
    link?: string;
    theme?: {
        primary?: string;
        accent?: string;
        secondary?: string;
    };
    }

interface LogoCloudCarouselProps {
  logos: Logo[];
  theme?: {
    primary?: string;
    accent?: string;
    secondary?: string;
  };
}

export const LogoCloudCarousel: React.FC<LogoCloudCarouselProps> = ({
  logos,
  theme = {
    primary: "#3B82F6",
    accent: "#60A5FA",
    secondary: "#1E40AF",
  },
}) => {
  const [api, setApi] = useState<CarouselApi>();

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="gap-4 md:gap-6 lg:gap-1 -ml-4">
            {logos.map((logo) => (
              <CarouselItem
                key={logo._id}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 2xl:basis-1/4 flex-shrink-0"
              >
                <Link
                  to={logo.link || "#"}
                  className="group relative flex flex-col h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, ${logo.theme?.primary || theme.primary}30, ${logo.theme?.accent || theme.accent}20, ${logo.theme?.secondary || theme.secondary}15)`,
                    }}
                  />
                  
                  {/* Card Content */}
                  <div className="relative p-6 flex flex-col h-full min-h-[240px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl">
                    {/* Title */}
                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base">
                      {logo.tool_name}
                    </h4>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3 flex-1">
                      {logo.description || "AI-powered solution for enhanced learning."}
                    </p>

                    {/* CTA */}
                    <span
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-colors group-hover:gap-2 w-fit"
                      style={{ color: logo.theme?.primary || theme.primary }}
                    >
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </div>
  );
};

export default LogoCloudCarousel;
