#!/usr/bin/env node
import { checkPublishedDocsFreshness } from './lib/docs-sync.mjs';

const source = process.argv.includes('--worktree') ? 'worktree' : 'head';

try {
  const { stamp } = checkPublishedDocsFreshness({ source });
  console.log(
    `docs freshness: ok (opentide=${stamp.opentide?.slice(0, 7)} specifications=${stamp.specifications?.slice(0, 7)} format=${stamp.format})`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`docs freshness: ${message}`);
  process.exit(1);
}
