import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PartnerLogo from "@/components/PartnerLogo";

interface PartnerCardProps {
  primary?: string;
  secondary?: string;
  accent?: string;
  name: string;
  description: string;
  tools: number;
  to: string;
  partnerKey: string;
  logoSvg?: string | null;
}

const FALLBACK = {
  primary: "#3B82F6",
  secondary: "#1E40AF",
  accent: "#60A5FA",
};

const PartnerCard: React.FC<PartnerCardProps> = ({
  primary,
  secondary,
  accent,
  name,
  description,
  tools,
  to,
  partnerKey,
  logoSvg,
}) => {
  const p = primary || FALLBACK.primary;
  const s = secondary || FALLBACK.secondary;
  const a = accent || FALLBACK.accent;

  return (
    <StyledWrapper $primary={p} $secondary={s} $accent={a}>
      <Link to={to} className="card-link">
        <div className="card">
          <div className="logo-wrap">
            <PartnerLogo
              partnerKey={partnerKey}
              className="h-10 w-10"
              logoSvg={logoSvg}
              name={name}
            />
          </div>

          <div className="middle">
            <h2 className="heading">{name}</h2>
            <p className="description">{description}</p>
            <span className="tools-badge">
              {tools} {tools === 1 ? "Tool" : "Tools"} Registered
            </span>
          </div>

          <div className="right">
            <div className="swatches">
              <span className="swatch" style={{ backgroundColor: p }} />
              <span className="swatch" style={{ backgroundColor: s }} />
              <span className="swatch" style={{ backgroundColor: a }} />
            </div>
            <span className="view-link">
              View Profile <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{
  $primary: string;
  $secondary: string;
  $accent: string;
}>`
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .card {
    position: relative;
    width: 100%;
    min-height: 120px;
    background-color: hsl(var(--card));
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    cursor: pointer;
    color: hsl(var(--card-foreground));
    overflow: hidden;
    isolation: isolate;
    transition: transform 0.3s ease;
  }

  .card::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 0.75rem;
    background: ${({ $primary, $secondary }) =>
      `linear-gradient(-45deg, ${$primary} 0%, ${$secondary} 100%)`};
    z-index: -10;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card::after {
    content: "";
    z-index: -1;
    position: absolute;
    inset: 0;
    border-radius: 0.75rem;
    background: ${({ $accent, $primary }) =>
      `linear-gradient(-45deg, ${$accent} 0%, ${$primary} 100%)`};
    transform: translate3d(0, 0, 0) scale(0.92);
    filter: blur(40px);
    opacity: 0.45;
    transition: filter 0.4s ease, opacity 0.4s ease;
  }

  .card:hover {
    transform: translateY(-2px);
  }

  .card:hover::after {
    filter: blur(55px);
    opacity: 0.7;
  }

  .card:hover::before {
    transform: rotate(-90deg) scaleX(1.34) scaleY(0.77);
  }

  .logo-wrap {
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.625rem;
    background: hsl(var(--secondary) / 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .middle {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .heading {
    font-family: var(--font-display, inherit);
    font-size: 1.125rem;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin: 0;
    line-height: 1.2;
  }

  .description {
    font-size: 0.875rem;
    line-height: 1.4;
    color: hsl(var(--muted-foreground));
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tools-badge {
    align-self: flex-start;
    margin-top: 0.125rem;
    border-radius: 9999px;
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .right {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.5rem;
    align-self: stretch;
    padding: 0.125rem 0;
  }

  .swatches {
    display: flex;
    gap: 0.125rem;
  }

  .swatch {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 9999px;
    display: inline-block;
  }

  .view-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
    transition: color 0.2s;
  }

  .card:hover .view-link {
    color: hsl(var(--primary));
  }
`;

export default PartnerCard;
