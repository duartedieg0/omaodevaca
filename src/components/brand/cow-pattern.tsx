import { cn } from "@/lib/utils";

/**
 * Textura decorativa de manchas de vaca. Use com opacidade bem baixa
 * (ex.: `opacity-[0.05]`) dentro de um container `relative overflow-hidden`.
 */
export function CowPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full text-foreground",
        className,
      )}
    >
      <defs>
        <pattern
          id="cow-spots"
          width="420"
          height="420"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-14)"
        >
          <g fill="currentColor">
            <path d="M58 40c22-26 70-30 94-8 14 13 9 30 24 42 17 14 12 42-10 52-20 9-34-6-56 2-25 9-52 4-62-18-8-17 6-30 2-46-3-11 0-17 8-24z" />
            <path d="M262 18c18-8 42 2 50 18 6 12-4 22 4 34 9 13-2 30-20 30-14 0-20-10-34-8-16 2-30-8-30-24 0-14 14-18 14-32 0-8 6-14 16-18z" />
            <path d="M176 196c30-14 76-6 92 22 9 16-2 30 8 46 12 20-4 46-32 50-24 4-36-12-62-6-28 6-56-8-58-34-2-20 16-28 18-46 2-16 14-24 34-32z" />
            <path d="M24 286c14-10 36-6 44 8 5 9-1 17 4 26 6 11-3 24-18 24-11 0-16-8-27-6-12 2-22-6-21-18 1-10 10-14 11-24 1-4 3-7 7-10z" />
            <path d="M338 300c16-6 36 4 40 20 3 11-5 18 0 28 6 12-4 26-20 26-12 0-18-9-30-6-13 3-25-6-24-19 1-11 11-15 13-26 2-10 9-19 21-23z" />
            <path d="M372 130c9-4 21 1 24 10 2 6-2 10 1 16 3 7-3 15-12 15-7 0-10-5-17-4-8 1-14-4-13-11 1-7 6-9 7-15 1-5 4-9 10-11z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cow-spots)" />
    </svg>
  );
}
