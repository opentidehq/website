import type { Metadata } from 'next';
import { siteOgImage } from '@/lib/shared';

const title = 'Privacy';
const description =
  'What opentide collects, what it does not, and where your detection content goes when you run the engine or the agent plugin.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: siteOgImage,
  },
  twitter: {
    images: siteOgImage,
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24 md:px-6 md:pt-20">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-fd-muted-foreground">
        How opentide handles data across the engine, the agent plugin, and this website.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-xl font-semibold tracking-tight">The short version</h2>
          <p className="mt-3">
            opentide is software you run, not a service we run on your behalf. The engine executes on
            your machine or in your own CI. Your detection content, your queries, and your platform
            credentials stay in your repository and your environment. We do not receive them, and
            there is nothing in the engine or the agent plugin that sends them to us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">The engine and the CLI</h2>
          <p className="mt-3">
            Installing and running opentide does not transmit your objects, schemas, queries, or
            credentials to OpenTideHQ. The engine has no telemetry and no analytics.
          </p>
          <p className="mt-3">
            Commands that reach a network do so against systems <em>you</em> configure, using
            credentials <em>you</em> supply, and they talk to those systems directly. Validating a
            query against a SIEM, deploying a rule to an EDR, or enriching a CVE goes from your
            environment to that vendor. Each of those services has its own terms and privacy
            handling, and those apply to that traffic. opentide is not an intermediary and keeps no
            copy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">The agent plugin</h2>
          <p className="mt-3">
            The{' '}
            <a
              className="underline underline-offset-4"
              href="https://github.com/OpenTideHQ/skills"
              target="_blank"
              rel="noopener noreferrer"
            >
              agent skills plugin
            </a>{' '}
            distributes instructions, not a service. The skills are text your coding agent reads
            locally. Installing or using the plugin sends nothing to OpenTideHQ, and we collect,
            store, and process no data about you, your repositories, or your detections.
          </p>
          <p className="mt-3">
            The plugin can start the opentide MCP server locally against repositories you already
            control. That server runs on your machine. Where a skill has your agent query a security
            platform, the request goes from your environment to that vendor under your own
            credentials, exactly as above.
          </p>
          <p className="mt-3">
            Your agent provider is a separate party. Whichever assistant you use — and whatever it
            transmits to its own provider as part of normal operation — is governed by that
            provider&rsquo;s terms, not by this statement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">This website</h2>
          <p className="mt-3">
            opentide.org is a static site served from GitHub Pages. It sets no advertising or
            tracking cookies and runs no analytics of its own. Documentation search runs in your
            browser against a prebuilt index; your queries are not sent to us.
          </p>
          <p className="mt-3">
            As with any web host, GitHub processes the technical request data needed to serve a page.
            That processing is GitHub&rsquo;s, under its own terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Contacting us</h2>
          <p className="mt-3">
            If you email us or open an issue, we hold what you chose to send for as long as it takes
            to deal with it. Public issues are public — do not put sensitive detection content,
            customer data, or credentials in one. Reach us at{' '}
            <a className="underline underline-offset-4" href="mailto:digit-ec-opentide@ec.europa.eu">
              digit-ec-opentide@ec.europa.eu
            </a>
            , and use email rather than a public issue for security reports.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Changes</h2>
          <p className="mt-3">
            If opentide ever operates a hosted service that processes your content, this statement
            will say so before that service is available, and will describe what is processed and on
            what basis. Today there is no such service.
          </p>
        </section>
      </div>
    </div>
  );
}
