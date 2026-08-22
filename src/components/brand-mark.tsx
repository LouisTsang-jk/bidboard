export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 32h9V21H4v11Z" fill="currentColor" />
      <path d="M17.5 32h9V13h-9v19Z" fill="currentColor" />
      <path d="M31 32h9V5h-9v27Z" fill="currentColor" />
      <path d="M3 37.5h38" stroke="currentColor" strokeWidth="3" />
      <path d="m34 4 7 1-4 6" stroke="#FF5C35" strokeWidth="3" />
    </svg>
  );
}
