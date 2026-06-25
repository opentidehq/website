import { codeToHtml } from 'shiki';

const snippet = `$ pip install "opentide[sentinel,cli,mcp]>=0.1"
$ export OPENTIDE_REPO_ROOT=./rules

$ opentide setup --yes --platform sentinel
$ opentide generate
$ opentide validate --strict
$ opentide deploy --platform sentinel --dry-run

✓ 142 rules · 0 errors · 7 platforms indexed`;

export async function HeroTerminal() {
  const html = await codeToHtml(snippet, {
    lang: 'bash',
    theme: 'github-dark-dimmed',
  });

  return (
    <div className="hero-terminal overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
        <span className="ml-1 font-mono text-[11px] text-zinc-500">detection-repo</span>
        <span className="ml-auto font-mono text-[10px] text-zinc-600">bash</span>
      </div>
      <div
        className="hero-terminal-body overflow-x-auto p-4 font-mono text-[11px] leading-[1.65] sm:text-xs [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_code]:bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
