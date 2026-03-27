type EyeLogoProps = {
  className?: string;
};

export function EyeLogo({ className = "" }: EyeLogoProps) {
  return (
    <svg
      viewBox="0 0 1076 754"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left eye shape */}
      <path
        d="M270 150C200 220 150 330 150 460C150 590 200 670 270 740C320 680 350 580 350 460C350 340 320 220 270 150Z"
        fill="currentColor"
      />
      
      {/* Right eye shape */}
      <path
        d="M806 150C876 220 926 330 926 460C926 590 876 670 806 740C756 680 726 580 726 460C726 340 756 220 806 150Z"
        fill="currentColor"
      />
      
      {/* Center iris/pupil area */}
      <circle cx="538" cy="300" r="110" fill="currentColor" opacity="0.8" />
      
      {/* Highlight/shine effect */}
      <circle cx="500" cy="260" r="35" fill="white" opacity="0.3" />
      
      {/* Bottom curved line */}
      <path
        d="M270 740Q538 850 806 740"
        stroke="currentColor"
        strokeWidth="40"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
