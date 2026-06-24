import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import PartnerLogo from "@/components/PartnerLogo";

interface PartnerPortraitCardProps {
  primary?: string;
  secondary?: string;
  accent?: string;
  name: string;
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

const PartnerPortraitCard: React.FC<PartnerPortraitCardProps> = ({
  primary,
  secondary,
  accent,
  name,
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
              className="h-8 w-8"
              logoSvg={logoSvg}
              name={name}
            />
          </div>

          <div className="bottom">
            <h2 className="heading">{name}</h2>
            <span className="tools-badge">
              {tools} {tools === 1 ? "Tool" : "Tools"}
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
    width: 240px;
  }

  .card {
    position: relative;
    width: 240px;
    height: 360px;
    aspect-ratio: 2 / 3;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    border-radius: 20px;
    overflow: hidden;
    isolation: isolate;
    cursor: pointer;
    color: #fff;
    background: ${({ $primary, $secondary }) =>
      `linear-gradient(135deg, ${$primary} 0%, ${$secondary} 100%)`};
    transition: transform 0.3s ease;
  }

  .card::after {
    content: "";
    z-index: -1;
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: ${({ $accent, $primary }) =>
      `linear-gradient(-45deg, ${$accent} 0%, ${$primary} 100%)`};
    transform: translate3d(0, 0, 0) scale(0.92);
    filter: blur(40px);
    opacity: 0.55;
    transition: filter 0.4s ease, opacity 0.4s ease;
  }

  .card:hover {
    transform: translateY(-4px);
  }

  .card:hover::after {
    filter: blur(55px);
    opacity: 0.8;
  }

  .logo-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bottom {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .heading {
    font-family: var(--font-display, inherit);
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    line-height: 1.2;
  }

  .tools-badge {
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    backdrop-filter: blur(6px);
  }
`;

export default PartnerPortraitCard;
