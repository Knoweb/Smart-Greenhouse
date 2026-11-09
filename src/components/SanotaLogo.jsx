import React from 'react';
import sanotaExactLogo from '../assets/sanota-logo-exact.png';
import sanotaEmblem from '../assets/sanota-emblem.png';

export default function SanotaLogo({
  variant = 'full', // 'full' | 'icon'
  height = 34,
  showSubtitle = false,
  subtitleText = 'Greenhouse Automation',
  className = '',
  onClick,
  style = {}
}) {
  if (variant === 'icon') {
    return (
      <div
        className={`sanota-icon-badge ${className}`}
        style={{ width: height, height: height, ...style }}
        onClick={onClick}
      >
        <img
          src={sanotaEmblem}
          alt="Sanota"
          className="sanota-emblem-img"
        />
      </div>
    );
  }

  return (
    <div
      className={`sanota-brand-container ${className}`}
      onClick={onClick}
      style={style}
    >
      <div className="sanota-logo-pill">
        <img
          src={sanotaExactLogo}
          alt="SANOTA"
          className="sanota-logo-img"
          style={{ height }}
        />
      </div>
      {showSubtitle && (
        <span className="sanota-brand-tagline">
          {subtitleText}
        </span>
      )}
    </div>
  );
}
