import { defineConfig, defineCollections, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import {
  remarkMdxMermaid,
  remarkNpm,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
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
  },
});
