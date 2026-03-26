type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="150" cy="150" r="108" stroke="currentColor" strokeWidth="5" />
      <path
        d="M124 56C92 97 75 140 76 188C76 225 91 251 125 269C151 247 163 219 166 181C168 149 165 112 124 56Z"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M177 54C225 90 249 140 244 204C239 246 214 273 168 284"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M101 285C130 286 157 280 179 267"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="178" cy="98" r="22" stroke="currentColor" strokeWidth="5" />
      <path
        d="M164 130C145 151 135 177 135 206"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M160 72C170 63 181 58 194 56"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M192 110C212 84 227 59 229 37"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
