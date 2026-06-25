import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig, navLinks } from './shared';

function BrandTitle() {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span
        className="inline-flex size-7 items-center justify-center rounded-full text-xs font-bold text-[#003399] dark:text-[#003399]"
        style={{
          background: 'linear-gradient(135deg, #FFCC00 0%, #FFE566 50%, #FFCC00 100%)',
        }}
        aria-hidden
      >
        OT
      </span>
      <span className="bg-gradient-to-r from-[#003399] to-[#4d7fd4] bg-clip-text text-transparent dark:from-[#5b8fd9] dark:to-[#FFCC00]">
        {appName}
      </span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <BrandTitle />,
      url: '/',
    },
    links: [
      ...navLinks.map((link) => ({
        text: link.label,
        url: link.href,
        active: 'nested-url' as const,
      })),
      {
        type: 'icon' as const,
        label: 'GitHub',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
            <path
              fill="currentColor"
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
        ),
        text: 'GitHub',
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
