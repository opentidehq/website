import { defineConfig, defineCollections, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import {
  rehypeCodeDefaultOptions,
  remarkMdxMermaid,
  remarkNpm,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';
import { rehypeCliOutput } from './lib/mdx/cli-output.mjs';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      status: z.string().optional(),
      rfc: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const blogPosts = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkMdxMermaid,
      remarkSteps,
      [remarkNpm, { persist: { id: 'package-manager' } }],
    ],
    // Before rehype-code: CLI output samples are highlighted as `ansi`.
    rehypePlugins: (plugins) => [rehypeCliOutput, ...plugins],
    // A fence in a language Shiki does not bundle (a synced spec's `ebnf` grammar) renders as
    // plain text instead of failing the build. Options replace the defaults, so spread them.
    rehypeCodeOptions: { ...rehypeCodeDefaultOptions, fallbackLanguage: 'plaintext' },
  },
});
