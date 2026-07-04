export function AegisMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 19 11.2 4.8a.9.9 0 0 1 1.6 0L19.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 13.4h9.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="4" cy="19.5" r="2" fill="currentColor" />
      <circle cx="20" cy="19.5" r="2" fill="currentColor" />
      <circle cx="12" cy="13.4" r="1.4" fill="white" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
