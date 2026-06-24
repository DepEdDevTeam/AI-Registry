import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import PartnerLogo from "@/components/PartnerLogo";

interface PartnerUiverseCardProps {
  primary?: string;
  secondary?: string;
  accent?: string;
  name: string;
  description?: string;
  to: string;
  partnerKey: string;
  logoSvg?: string | null;
  onDelete?: () => void;
}

const FALLBACK = {
  primary: "#3B82F6",
  secondary: "#1E40AF",
  accent: "#60A5FA",
};

const truncate = (text: string, max = 90) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
};

const PartnerUiverseCard: React.FC<PartnerUiverseCardProps> = ({
  primary,
  secondary,
  accent,
  name,
  description = "",
  to,
  partnerKey,
  logoSvg,
  onDelete,
}) => {
  const p = primary || FALLBACK.primary;
  const s = secondary || FALLBACK.secondary;
  const a = accent || FALLBACK.accent;

  return (
    <StyledWrapper $primary={p} $secondary={s} $accent={a}>
      <Link to={to} className="card-link" aria-label={name}>
        <div className="card">
          <div className="card-inner">
            {/* Default state content (logo top-left + name bottom-left) */}
            <div className="default-content">
              <div className="logo-wrap">
                <PartnerLogo
                  partnerKey={partnerKey}
                  className="h-[104px] w-[104px]"
                  logoSvg={logoSvg}
                  name={name}
                />
              </div>
              <p className="default-name">{name}</p>
            </div>

            {/* Hover state content (revealed on hover) */}
            <div className="hover-content">
              <p className="heading">{name}</p>
              <p className="info">{truncate(description, 90)}</p>
            </div>

            {onDelete && (
              <button
                type="button"
                aria-label="Delete provider"
                title="Delete provider"
                className="delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </Link>
      {onDelete && (
        <button
          type="button"
          className="delete-button"
          aria-label={`Delete ${name}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={15} />
        </button>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{
  $primary: string;
  $secondary: string;
  $accent: string;
}>`
  /* Outer wrapper: owns stacking context + glow, NEVER clips overflow */
  position: relative;
  width: 240px;
  height: 276px;
  z-index: 0;
  isolation: isolate;

  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    width: 240px;
    height: 276px;
    position: relative;
  }

  .delete-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 6;
    display: inline-flex;
    height: 34px;
    width: 34px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(0, 0, 0, 0.72);
    color: #fff;
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
  }

  &:hover .delete-button,
  .delete-button:focus-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .delete-button:hover {
    background: #dc2626;
  }

  /* Gradient border halo (sibling of .card so .card's black bg masks it) */
  .card-link::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    background: ${({ $primary, $secondary }) =>
      `linear-gradient(-45deg, ${$primary} 0%, ${$secondary} 100%)`};
    z-index: 0;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.5s ease, filter 0.5s ease;
  }

  /* Soft outer glow — sits behind border, never clipped */
  .card-link::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: ${({ $accent, $primary }) =>
      `linear-gradient(-45deg, ${$accent} 0%, ${$primary} 100%)`};
    transform: scale(1.05);
    filter: blur(40px);
    opacity: 0.6;
    z-index: -1;
    pointer-events: none;
    transition: filter 0.5s ease, opacity 0.5s ease;
  }

  .card {
    position: relative;
    width: 240px;
    height: 276px;
    background-color: #000;
    border-radius: 20px;
    cursor: pointer;
    z-index: 1;
    transition: background 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* Inner wrapper: clips text content only, keeps rounded corners */
  .card-inner {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    overflow: hidden;
    z-index: 2;
  }

  /* Default content layout */
  .default-content {
    position: absolute;
    inset: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 18px;
    color: #fff;
    transition: opacity 0.4s ease, visibility 0.4s ease;
    opacity: 1;
    visibility: visible;
    z-index: 2;
  }

  .logo-wrap {
    width: 130px;
    height: 130px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    align-self: center;
    margin-top: 0;
  }

  .default-name {
    font-family: var(--font-display, inherit);
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    line-height: 1.2;
  }

  /* Hover content layout (Uiverse-style stacked at bottom) */
  .hover-content {
    position: absolute;
    inset: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 12px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.4s ease, visibility 0.4s ease;
    pointer-events: none;
    z-index: 3;
  }

  .heading {
    font-size: 20px;
    text-transform: uppercase;
    font-weight: 800;
    color: #000;
    margin: 0;
    line-height: 1.1;
  }

  .info {
    font-size: 14px;
    color: #000;
    margin: 0;
    line-height: 1.35;
  }

  .footer-name {
    font-size: 18px;
    color: #fff;
    font-weight: 700;
    margin: 0;
  }

  /* Hover state */
  .card:hover {
    background-image: ${({ $primary, $secondary }) =>
      `linear-gradient(135deg, ${$primary} 0%, ${$secondary} 100%)`};
  }

  .card:hover .default-content {
    opacity: 0;
    visibility: hidden;
  }

  .card:hover .hover-content {
    opacity: 1;
    visibility: visible;
  }

  .card-link:hover::before {
    filter: brightness(1.25);
  }

  .card-link:hover::after {
    filter: blur(50px);
    opacity: 0.9;
  }

  .delete-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    background: rgba(220, 38, 38, 0.9);
    color: #fff;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-2px);
    transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease, background 0.2s ease;
    z-index: 5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .card:hover .delete-btn {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .delete-btn:hover {
    background: rgb(185, 28, 28);
  }
`;

export default PartnerUiverseCard;
