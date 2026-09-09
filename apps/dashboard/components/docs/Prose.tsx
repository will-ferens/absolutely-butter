/**
 * Typographic wrapper for hand-written docs JSX. No @tailwindcss/typography
 * dependency — spacing and rhythm are applied via descendant selectors so the
 * page components stay readable plain JSX. Inline <code> is styled only inside
 * text elements so it never clashes with <CodeBlock>'s own <pre><code>.
 */
export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        max-w-none text-[15px] leading-7 text-gray-700
        [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:scroll-mt-24
        [&_h2:first-child]:mt-0
        [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:scroll-mt-24
        [&_p]:my-4
        [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5
        [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5
        [&_li]:my-1.5 [&_li>ul]:my-1.5
        [&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-indigo-700
        [&_strong]:font-semibold [&_strong]:text-gray-900
        [&_hr]:my-12 [&_hr]:border-gray-200
        [&_p_code]:rounded [&_p_code]:bg-gray-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:font-mono [&_p_code]:text-[13px] [&_p_code]:text-gray-800
        [&_li_code]:rounded [&_li_code]:bg-gray-100 [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:font-mono [&_li_code]:text-[13px] [&_li_code]:text-gray-800
        [&_td_code]:rounded [&_td_code]:bg-gray-100 [&_td_code]:px-1.5 [&_td_code]:py-0.5 [&_td_code]:font-mono [&_td_code]:text-[12px] [&_td_code]:text-gray-800
        [&_th_code]:font-mono [&_th_code]:text-[12px]
        [&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm
        [&_thead]:border-b [&_thead]:border-gray-300
        [&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900
        [&_td]:border-t [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top
        [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600
      "
    >
      {children}
    </div>
  )
}
