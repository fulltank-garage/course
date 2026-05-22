import type { SVGProps } from 'react'

export default function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <rect x="5" y="5" width="54" height="54" rx="14" fill="currentColor" />
      <path d="M32 24.3c-4.7-2.3-10.3-2.7-16-1v22.4c5.7-1.7 11.3-1.3 16 1V24.3Z" fill="#f8fafc" />
      <path d="M32 24.3c4.7-2.3 10.3-2.7 16-1v22.4c-5.7-1.7-11.3-1.3-16 1V24.3Z" fill="#d4d4d8" />
      <path d="M32 22.1c2.6-3.8 7.6-5.5 12.8-4.5" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 24.3v22.9" stroke="#18181b" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.5 30.4h7.8M20.5 35.1h7.8M20.5 39.8h7.8" stroke="#a1a1aa" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M36.2 31h7.3M36.2 35.7h7.3M36.2 40.4h6.1" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
