'use client';

import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from 'lucide-react';
import { useMemo } from 'react';

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

function buildTree(paths: readonly string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const full of paths) {
    const parts = full.split('/');
    let level = root;
    let acc = '';
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      acc = acc ? `${acc}/${name}` : name;
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = { name, path: acc, children: isFile ? undefined : [] };
        level.push(node);
      }
      if (!isFile) {
        node.children ??= [];
        level = node.children;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aDir = a.children != null;
      const bDir = b.children != null;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children) sortNodes(n.children);
    }
  };
  sortNodes(root);
  return root;
}

function Row({
  node,
  depth,
  expanded,
  selected,
  open,
}: {
  node: TreeNode;
  depth: number;
  expanded: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  open: string;
}) {
  const isDir = node.children != null;
  const isOpen = isDir && expanded.has(node.path);
  const isSelected = selected.has(node.path);
  const isFocused = open === node.path;

  return (
    <>
      <div
        className={`flex min-w-0 items-center gap-1 rounded-md py-0.5 pr-2 font-mono text-[10px] leading-5 ${
          isSelected || isFocused
            ? 'bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] text-[var(--landing-ink)]'
            : 'text-[var(--landing-muted)]'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        title={node.path}
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center text-[var(--landing-dim)]">
          {isDir ? (
            isOpen ? (
              <ChevronDown className="size-3" aria-hidden />
            ) : (
              <ChevronRight className="size-3" aria-hidden />
            )
          ) : null}
        </span>
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          {isDir ? (
            isOpen ? (
              <FolderOpen className="size-3 text-[var(--landing-accent)]" aria-hidden />
            ) : (
              <Folder className="size-3 text-[var(--landing-subtle)]" aria-hidden />
            )
          ) : (
            <FileCode2
              className={`size-3 ${isFocused ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-dim)]'}`}
              aria-hidden
            />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
      </div>
      {isDir && isOpen
        ? node.children!.map((child) => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              open={open}
            />
          ))
        : null}
    </>
  );
}

/** Decorative IDE explorer — plain CSS truncate, no shadow-DOM middle-truncate. */
export function StudioExplorer({
  paths,
  open,
  selected,
  expanded,
}: {
  paths: readonly string[];
  open: string;
  selected: readonly string[];
  expanded: readonly string[];
}) {
  const tree = useMemo(() => buildTree(paths), [paths]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);

  return (
    <div className="flex h-full min-h-0 flex-col" aria-hidden>
      <p className="shrink-0 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-subtle)]">
        Explorer
      </p>
      <div className="landing-code-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2">
        {tree.map((node) => (
          <Row
            key={node.path}
            node={node}
            depth={0}
            expanded={expandedSet}
            selected={selectedSet}
            open={open}
          />
        ))}
      </div>
    </div>
  );
}
