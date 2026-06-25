'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function render() {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      });

      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg(null);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme, mounted]);

  if (!mounted || !svg) {
    return (
      <pre className="overflow-x-auto rounded-lg border bg-fd-muted p-4 font-mono text-xs text-fd-muted-foreground">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-lg border bg-fd-card p-4 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
