import { LucideProps } from "lucide-react";

export const TiktokIcon = ({ size = 24, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 8V7l-1.41.14c-2 0-4-1.29-4.32-3.35L15 3h-4v10a4 4 0 1 1-6-3h1V7h-1a6 6 0 1 0 5 10.31V7a7 7 0 0 0 4.19 2.22l.27.04A6 6 0 0 0 21 8Z" />
  </svg>
);
