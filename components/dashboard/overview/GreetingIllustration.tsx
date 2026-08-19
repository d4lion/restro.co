import React from "react";

export function GreetingIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="240"
      height="160"
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Table Top */}
      <path
        d="M20 100H230V108H20V100Z"
        fill="#D97706"
      />
      <path
        d="M20 100H230V103H20V100Z"
        fill="#F59E0B"
      />

      {/* Table Legs */}
      <line x1="35" y1="108" x2="25" y2="155" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="108" x2="60" y2="155" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="205" y1="108" x2="190" y2="155" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="215" y1="108" x2="225" y2="155" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

      {/* Coffee Cup */}
      <path
        d="M32 90H42V100H32V90Z"
        fill="#78350F"
        rx="2"
      />
      <path
        d="M42 93H45V97H42V93Z"
        stroke="#78350F"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Laptop */}
      {/* Screen */}
      <rect x="75" y="70" width="36" height="24" rx="3" fill="#0F172A" />
      <rect x="77" y="72" width="32" height="20" rx="2" fill="#1E293B" />
      <circle cx="93" cy="82" r="2.5" fill="#FFFFFF" opacity="0.8" />
      {/* Keyboard Base */}
      <path d="M68 99L74 94H112L118 99H68Z" fill="#334155" />

      {/* Person Chair */}
      <path d="M140 115C140 108 145 105 155 105H170V125H140V115Z" fill="#64748B" />
      <path d="M150 125V155M165 125V155" stroke="#0F172A" strokeWidth="3" />

      {/* Person Body & Legs */}
      {/* Pants/Legs */}
      <path d="M135 110L130 155H144L147 122L155 155H168L160 110H135Z" fill="#0F172A" />

      {/* Torso/Shirt */}
      <path
        d="M136 70C136 65 142 60 152 60C162 60 168 65 168 70L165 110H135L136 70Z"
        fill="#475569"
      />

      {/* Collar */}
      <path d="M148 60L152 66L156 60" stroke="#0F172A" strokeWidth="2" />

      {/* Left Arm (Reaching to laptop) */}
      <path
        d="M140 68L110 88L120 92L145 76Z"
        fill="#FCA5A5"
      />

      {/* Right Arm (Waving/Gesturing) */}
      <path
        d="M160 68L180 48C183 45 188 47 186 52L170 76Z"
        fill="#FCA5A5"
      />
      {/* Hand Waving */}
      <circle cx="184" cy="46" r="5" fill="#FCA5A5" />

      {/* Head & Hair */}
      <circle cx="152" cy="46" r="10" fill="#FCA5A5" />
      {/* Ear */}
      <circle cx="161" cy="46" r="2" fill="#FCA5A5" />
      <circle cx="161" cy="48" r="1" fill="#D97706" />

      {/* Hair & Bun */}
      <path
        d="M143 45C143 38 147 34 154 34C161 34 163 38 163 45C161 41 155 40 148 43Z"
        fill="#0F172A"
      />
      {/* Hair Bun */}
      <circle cx="160" cy="30" r="6" fill="#0F172A" />

      {/* Face features (Eye & Smile) */}
      <circle cx="147" cy="45" r="1.2" fill="#0F172A" />
      <path d="M145 49C147 51 149 51 150 49" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
