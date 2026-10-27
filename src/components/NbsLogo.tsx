import React from 'react';

interface NbsLogoProps {
  className?: string;
  variant?: 'full' | 'emblem';
  alt?: string;
}

/**
 * Official National Bureau of Statistics (NBS) Logo Component.
 * Faithfully matches the official emblem:
 * - Deep forest green oval with bold white "nbs" ligature
 * - Crisp vector geometry with tall ascender on the 'b'
 * - Official serif title "National Bureau of Statistics" in full variant
 */
export const NbsLogo: React.FC<NbsLogoProps> = ({
  className = 'h-10 w-auto',
  variant = 'full',
  alt = 'National Bureau of Statistics Logo'
}) => {
  if (variant === 'emblem') {
    return (
      <svg
        viewBox="0 0 540 330"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={alt}
      >
        {/* Forest Green Oval */}
        <ellipse cx="270" cy="165" rx="260" ry="160" fill="#204638" />

        {/* White Letters "nbs" inside oval */}
        <g fill="#FFFFFF">
          {/* 'n' left stem */}
          <rect x="92" y="104" width="48" height="154" rx="4" />

          {/* 'n' arch and right stem */}
          <path
            d="M 136 150 C 148 118 174 100 206 100 C 238 100 252 116 252 146 L 252 258 L 204 258 L 204 154 C 204 138 194 130 180 130 C 162 130 148 142 148 164 L 148 258 L 92 258 Z"
          />

          {/* 'b' tall ascender and stem */}
          <rect x="252" y="24" width="48" height="234" rx="4" />

          {/* 'b' circular bowl */}
          <path
            d="M 295 102 C 342 102 388 132 388 181 C 388 230 342 260 295 260 L 290 260 L 290 102 Z"
          />

          {/* 's' stylized curve */}
          <path
            d="M 460 146 C 455 120 435 102 405 102 C 375 102 355 116 355 138 C 355 160 372 170 400 178 L 416 182 C 435 187 446 195 446 210 C 446 226 430 236 408 236 C 380 236 362 222 358 198 L 318 198 C 322 242 358 266 408 266 C 458 266 492 240 492 206 C 492 180 474 166 442 158 L 426 154 C 408 150 398 144 398 132 C 398 120 410 112 428 112 C 444 112 458 120 460 146 Z"
          />
        </g>

        {/* Counter cutout inside 'b' with matching oval green */}
        <path
          d="M 300 134 C 330 134 346 152 346 181 C 346 210 330 228 300 228 Z"
          fill="#204638"
        />
      </svg>
    );
  }

  // Full Variant: Oval + "National Bureau of Statistics"
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 740 420"
        className="w-full h-auto max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={alt}
      >
        {/* Forest Green Oval */}
        <ellipse cx="370" cy="175" rx="275" ry="168" fill="#204638" />

        {/* White Letters "nbs" inside oval */}
        <g fill="#FFFFFF">
          {/* 'n' left stem */}
          <rect x="180" y="112" width="50" height="162" rx="4" />

          {/* 'n' arch and right stem */}
          <path
            d="M 226 160 C 238 126 266 108 300 108 C 334 108 348 124 348 156 L 348 274 L 298 274 L 298 164 C 298 148 288 138 272 138 C 254 138 240 150 240 174 L 240 274 L 180 274 Z"
          />

          {/* 'b' tall ascender and stem */}
          <rect x="348" y="28" width="52" height="246" rx="4" />

          {/* 'b' circular bowl */}
          <path
            d="M 394 110 C 444 110 492 142 492 192 C 492 242 444 276 394 276 L 388 276 L 388 110 Z"
          />

          {/* 's' stylized curve */}
          <path
            d="M 570 156 C 564 128 542 110 510 110 C 478 110 458 124 458 148 C 458 172 476 182 504 190 L 522 194 C 542 200 554 208 554 224 C 554 242 536 252 512 252 C 482 252 464 236 460 212 L 416 212 C 420 258 458 284 512 284 C 566 284 602 256 602 220 C 602 192 582 178 548 170 L 530 166 C 512 162 502 154 502 142 C 502 128 514 120 534 120 C 552 120 566 130 570 156 Z"
          />
        </g>

        {/* Counter cutout inside 'b' with matching oval green */}
        <path
          d="M 400 144 C 432 144 448 162 448 192 C 448 222 432 242 400 242 Z"
          fill="#204638"
        />

        {/* Bottom Title: National Bureau of Statistics */}
        <text
          x="370"
          y="395"
          textAnchor="middle"
          fill="#204638"
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="800"
          fontSize="36"
          letterSpacing="0.02em"
        >
          National Bureau of Statistics
        </text>
      </svg>
    </div>
  );
};
