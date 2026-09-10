import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { appDescription, appName, siteUrl } from '@/lib/shared';

export const ogSize = { width: 1200, height: 630 } as const;

export type OgImageProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

const INTER_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.8';

type OgFonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts'];

let fontsPromise: Promise<OgFonts> | undefined;
let iconPromise: Promise<string> | undefined;

async function loadOgFonts() {
  fontsPromise ??= Promise.all(
    [400, 600, 700].map(async (weight) => {
      const res = await fetch(`${INTER_CDN}/latin-${weight}-normal.ttf`);
      if (!res.ok) {
        throw new Error(`Failed to load Inter ${weight}: ${res.status}`);
      }
      return {
        name: 'Inter',
        data: await res.arrayBuffer(),
        weight: weight as 400 | 600 | 700,
        style: 'normal' as const,
      };
    }),
  );
  return fontsPromise;
}

async function loadOgIcon() {
  iconPromise ??= readFile(
    join(process.cwd(), 'public/brand/png/icon-normal-256px.png'),
  ).then((buf) => `data:image/png;base64,${buf.toString('base64')}`);
  return iconPromise;
}

function clip(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).replace(/\s+\S*$/, '').trimEnd()}…`;
}

function titleSize(title: string) {
  if (title.length > 72) return 48;
  if (title.length > 44) return 56;
  return 68;
}

function OgFrame({
  title,
  description,
  eyebrow,
  iconSrc,
}: OgImageProps & { iconSrc: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        color: '#fafafa',
        padding: '56px 64px',
        fontFamily: 'Inter',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '-80px',
          bottom: '-96px',
          display: 'flex',
          opacity: 0.12,
        }}
      >
        <img alt="" src={iconSrc} width={400} height={400} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img alt="" src={iconSrc} width={72} height={72} />
          <div
            style={{
              display: 'flex',
              marginLeft: 20,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {appName}
          </div>
        </div>
        {eyebrow ? (
          <div
            style={{
              display: 'flex',
              color: '#ffcc00',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {eyebrow}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 'auto',
          marginBottom: 'auto',
          maxWidth: 920,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
          }}
        >
          {clip(title, 110)}
        </div>
        {description ? (
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.35,
              color: '#c4c4cc',
            }}
          >
            {clip(description, 168)}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            width: 72,
            height: 6,
            backgroundColor: '#ffcc00',
          }}
        />
        <div
          style={{
            display: 'flex',
            marginLeft: 20,
            fontSize: 22,
            fontWeight: 600,
            color: '#9a9aa3',
          }}
        >
          {new URL(siteUrl).host}
        </div>
      </div>
    </div>
  );
}

export async function generateOgImage(props: OgImageProps) {
  const [fonts, iconSrc] = await Promise.all([loadOgFonts(), loadOgIcon()]);

  return new ImageResponse(<OgFrame {...props} iconSrc={iconSrc} />, {
    ...ogSize,
    fonts,
  });
}

export const defaultOgProps: OgImageProps = {
  title: 'The DetectionOps engine',
  description: appDescription,
};
