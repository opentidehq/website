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
import { EXTRA_LANGUAGES } from './lib/mdx/languages';

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
    // Fumadocs' defaults plus the opentide languages Shiki does not bundle (`yaral`).
    rehypeCodeOptions: { ...rehypeCodeDefaultOptions, langs: EXTRA_LANGUAGES },
  },
});
