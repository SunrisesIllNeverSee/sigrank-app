import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'
import { WasteCalculator } from './WasteCalculator'

export const metadata: Metadata = withOG({
  title: 'Token Waste Calculator — How Many AI Tokens Are Wasted',
  description:
    'Free AI token waste calculator. Enter your four token pillars to estimate wasted tokens, efficiency percentage, and a breakdown by category — excess input, unreused cache writes, repeated context.',
  path: '/tools/token-waste-calculator',
})

const FAQS = [
  {
    question: 'What is AI token waste?',
    answer:
      'Token waste is the share of tokens that did not plausibly contribute to useful output — over-specified prompts, context cached but never reused, and boilerplate re-sent every turn. Reducing waste raises your yield and lowers your cost without changing the model you use.',
  },
  {
    question: 'How does the token waste calculator estimate waste?',
    answer:
      'It uses three heuristic proxies: excess fresh input beyond a 10:1 input-to-output ratio, cache-write tokens that are never read back, and cache-read tokens far exceeding what plausibly shaped output. The three are summed into an estimated waste total and an efficiency percentage. These are rough proxies, not a measurement.',
  },
  {
    question: 'Is the waste breakdown accurate?',
    answer:
      'No — it is directional, not exact. The category thresholds (10:1 and 20:1) are approximations. Real waste depends on your actual prompts and workflow, which token counts alone cannot see. Use the breakdown to spot where to investigate, then use the Υ Yield metric as the rigorous counterpart.',
  },
  {
    question: 'How do I reduce wasted tokens?',
    answer:
      'The highest-leverage fixes are prompt caching (so context is read, not re-sent), trimming repeated boilerplate from prompts, and writing denser output-bearing prompts instead of long open-ended ones. The waste breakdown shows which category dominates for you.',
  },
  {
    question: 'How is this different from the yield calculator?',
    answer:
      'The yield calculator computes the rigorous Υ Yield metric (cache_read × output / input²). This tool estimates waste with heuristic category breakdowns — useful for diagnosing where tokens are being burned, but less precise than yield. Use both together: yield to track, waste to diagnose.',
  },
]

export default function TokenWasteCalculatorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Tools', path: '/tools' },
            { name: 'Token Waste Calculator', path: '/tools/token-waste-calculator' },
          ]),
          faqPage(FAQS),
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'SigRank Token Waste Calculator',
            url: 'https://signalaf.com/tools/token-waste-calculator',
            description:
              'Estimate wasted AI tokens from the four token pillars. Shows an efficiency percentage and a waste breakdown by category — excess input, unreused cache writes, and repeated context.',
            applicationCategory: 'CalculatorApplication',
            operatingSystem: 'Any (web browser)',
            browserRequirements: 'Requires JavaScript',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            featureList: [
              'Estimated wasted-token total',
              'Efficiency percentage',
              'Waste breakdown by category',
              'Heuristic diagnostic, not a measurement',
            ],
          },
        ]}
      />

      <WaveHero
        eyebrow="◈ Token Waste Calculator"
        title="Token Waste Calculator"
        subtitle={
          <>
            How many of your tokens actually contributed to output? Enter your four
            pillars and see estimated <span className="text-gold">waste</span>, efficiency,
            and a breakdown by category.
          </>
        }
      />

      <WasteCalculator />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          What &ldquo;waste&rdquo; means here
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A token is &ldquo;wasted&rdquo; when it likely did not contribute to useful output.
          The three categories the calculator surfaces — <strong className="text-text-primary">excess
          fresh input</strong> (over-specified prompts), <strong className="text-text-primary">unreused
          cache writes</strong> (context cached but never read back), and{' '}
          <strong className="text-text-primary">repeated context</strong> (boilerplate re-sent
          every turn) — are the most common ways operators burn tokens without compounding signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is a heuristic estimator. Token counts alone cannot see prompt content, so the
          category thresholds are approximations. Treat the numbers as a directional diagnostic,
          and pair them with the rigorous{' '}
          <a href="/tools/yield-calculator" className="text-text-accent underline-offset-2 hover:underline">
            Yield Calculator
          </a>{' '}
          for the precise efficiency metric.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">{f.question}</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
