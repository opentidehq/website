import type { Metadata } from 'next';
import { siteOgImage } from '@/lib/shared';

const title = 'Terms of use';
const description =
  'The licence that governs opentide, what it does not promise, and what remains your responsibility when you deploy detections with it.';

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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24 md:px-6 md:pt-20">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of use</h1>
      <p className="mt-3 text-fd-muted-foreground">
        What you may do with opentide, and what it does not promise.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-xl font-semibold tracking-tight">The licence governs</h2>
          <p className="mt-3">
            opentide — the engine, the specifications, and the agent skills plugin — is open source
            under the{' '}
            <a
              className="underline underline-offset-4"
              href="https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12"
              target="_blank"
              rel="noopener noreferrer"
            >
              European Union Public Licence v. 1.2
            </a>{' '}
            (EUPL-1.2). That licence sets out your rights to use, modify, and redistribute it, and it
            prevails over anything on this page if the two ever conflict. Each repository ships the
            licence text alongside the code.
          </p>
          <p className="mt-3">
            These terms cover this website and the way we publish the project. They do not add
            restrictions to the licence, and nothing here takes away a right the EUPL grants you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">No warranty</h2>
          <p className="mt-3">
            The software is provided as-is, without warranty of any kind, as the licence states.
            Detection content is security-critical: a rule that validates is not a rule that works,
            and a schema that passes is not a detection that fires. Test what you deploy in your own
            environment.
          </p>
          <p className="mt-3">
            We do not warrant that a detection authored with opentide will identify any particular
            threat, that a generated query is correct for your data, or that a deployment will
            behave identically across platform versions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">What stays yours</h2>
          <p className="mt-3">
            You own your detection content and you remain responsible for it. That includes what you
            deploy to production, the credentials you configure, the platforms you connect, and
            whether a change is safe to ship. opentide runs where you run it and does what you ask;
            it does not review your decisions.
          </p>
          <p className="mt-3">
            Where you use an AI agent with the skills plugin, you are responsible for reviewing what
            the agent produces before it reaches a detection platform. The skills are guidance for a
            model, not a guarantee about its output.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Contributions</h2>
          <p className="mt-3">
            Contributions are welcome through the project repositories and are accepted under the
            same EUPL-1.2 licence. Do not contribute content you do not have the right to publish —
            in particular, do not open a public issue or pull request containing customer data,
            production telemetry, credentials, or intelligence you are not permitted to share.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Trade marks</h2>
          <p className="mt-3">
            The licence covers the code, not the names and marks. Third-party product names and
            marks referenced in the documentation identify those products and belong to their
            respective owners; their use does not imply endorsement in either direction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
          <p className="mt-3">
            Questions about these terms:{' '}
            <a className="underline underline-offset-4" href="mailto:digit-ec-opentide@ec.europa.eu">
              digit-ec-opentide@ec.europa.eu
            </a>
            . See also our{' '}
            <a className="underline underline-offset-4" href="/legal/privacy/">
              privacy statement
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
