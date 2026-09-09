import { codeToHtml } from 'shiki'
import CopyButton from './CopyButton'

type Props = {
  code: string
  lang?: string
  /** Optional caption shown in the header bar (e.g. a filename). */
  title?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Server component. Highlights at render time with Shiki and ships static HTML —
 * no highlighter on the client. Falls back to a plain <pre> if highlighting
 * throws so a bad grammar can never fail the build.
 */
export default async function CodeBlock({ code, lang = 'ts', title }: Props) {
  const source = code.replace(/\n$/, '')

  let html: string
  try {
    html = await codeToHtml(source, {
      lang,
      theme: 'github-dark',
    })
  } catch {
    html = `<pre class="shiki" style="background-color:#24292e;color:#e1e4e8"><code>${escapeHtml(
      source,
    )}</code></pre>`
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-gray-800 bg-[#24292e]">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
        <span className="font-mono text-xs text-gray-400">{title ?? lang}</span>
        <CopyButton text={source} />
      </div>
      <div
        className="overflow-x-auto px-4 py-4 text-[13px] leading-6 [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
