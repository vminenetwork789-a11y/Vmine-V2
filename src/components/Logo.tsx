import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: 'h-16 w-16',
    md: 'h-48 w-48',
    lg: 'h-64 w-64',
  }[size];

  return (
    <div id="vmines-logo-container" className={`relative flex items-center justify-center ${dimensions} ${className}`}>
      {/* Outer spinning glowing gold ring */}
      <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-[spin_20s_linear_infinite]" />
      
      {/* Second dashed spinning reverse ring */}
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-yellow-500/50 animate-[spin_12s_linear_infinite_reverse]" />
      
      {/* Inner solid ring with golden glow */}
      <div className="absolute inset-4 rounded-full border-4 border-amber-600/60 shadow-[0_0_25px_rgba(234,179,8,0.4)]" />

      {/* Gold Radial Background */}
      <div className="absolute inset-5 rounded-full bg-radial from-amber-950/90 via-slate-950/95 to-slate-900" />

      {/* Embedded High Tech Decentrilized Web3 Graphics */}
      <svg
        id="vmines-logo-svg"
        viewBox="0 0 100 100"
        className="absolute inset-6 h-[80%] w-[80%] text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nodes and Links */}
        <circle cx="50" cy="18" r="3" className="fill-yellow-300 animate-pulse" />
        <circle cx="22" cy="45" r="3" className="fill-amber-400" />
        <circle cx="78" cy="45" r="3" className="fill-amber-400" />
        <circle cx="35" cy="78" r="3" className="fill-yellow-400 animate-pulse" />
        <circle cx="65" cy="78" r="3" className="fill-yellow-400" />
        
        {/* Network connections */}
        <path d="M50 18 L22 45 M50 18 L78 45" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M22 45 L35 78 M78 45 L65 78" stroke="currentColor" strokeWidth="1" />
        <path d="M35 78 L65 78" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
        
        {/* Hexagon Outline */}
        <polygon
          points="50,14 82,32 82,68 50,86 18,68 18,32"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Center stylized V Letter with a wallet pocket and coin */}
        <path
          d="M34 32 L46 64 C48 68, 52 68, 54 64 L66 32"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Wallet symbol at the center top of V */}
        <rect x="42" y="38" width="16" height="11" rx="2" fill="#0f172a" stroke="currentColor" strokeWidth="1.5" />
        <path d="M50 38 L50 43" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="54" cy="43" r="1" className="fill-yellow-300" />

        {/* Gradients */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
      </svg>

      {/* Gold Star sparklers around the logo */}
      <div className="absolute top-4 left-6 h-1 w-1 rounded-full bg-yellow-300 animate-ping" />
      <div className="absolute bottom-8 right-6 h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
      <div className="absolute top-24 right-2 h-1 w-1 rounded-full bg-yellow-200 animate-ping" />
    </div>
  );
};
