interface ToSmileLogoProps {
  className?: string;
}

export function ToSmileLogo({ className }: ToSmileLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient
          id="tosmile-teal"
          x1="16"
          y1="10"
          x2="48"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EDECE" />
          <stop offset="50%" stopColor="#2A9D8F" />
          <stop offset="100%" stopColor="#228B7E" />
        </linearGradient>
      </defs>
      {/* Stylized tooth — bold geometric silhouette */}
      <path
        d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z"
        fill="url(#tosmile-teal)"
      />
      {/* Smile arc highlight — subtle curve across the crown */}
      <path
        d="M20 26C24 30 28 31.5 32 31.5C36 31.5 40 30 44 26"
        stroke="#12202C"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}
