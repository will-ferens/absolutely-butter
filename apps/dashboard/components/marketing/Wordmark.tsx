/**
 * There is no logo mark — the name set in Bricolage Grotesque IS the identity.
 */
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display text-[17px] font-semibold tracking-[-0.02em] text-gray-900 ${className}`}
    >
      Absolutely Butter
    </span>
  )
}
