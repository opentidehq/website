/**
 * Synced documentation is compiled as MDX during `next build`.
 * Imports and non-literal expressions run in the website deploy job.
 * Docs may use a fixed set of components and static prop literals only.
 */
import { createProcessor } from '@mdx-js/mdx';

const ALLOWED_COMPONENTS = new Set([
  'Callout',
  'Card',
  'Cards',
  'RfcBanner',
  'RfcIndex',
  'Step',
  'Steps',
  'Tab',
  'Tabs',
]);

let processor;

function mdxProcessor() {
  processor ??= createProcessor({ format: 'mdx' });
  return processor;
}

function bodyAfterFrontmatter(content) {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return content;
  return content.slice(end + 5);
}

function isStatic(node) {
  if (!node) return false;
  if (node.type === 'Literal') return node.regex == null;
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0;
  if (node.type === 'ArrayExpression') {
    return node.elements.every((element) => element && isStatic(element));
  }
  return false;
}

function isStaticProgram(estree) {
  if (!estree || estree.type !== 'Program' || estree.body.length !== 1) return false;
  const statement = estree.body[0];
  if (!statement || statement.type !== 'ExpressionStatement') return false;
  return isStatic(statement.expression);
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visit);
  }
  if (Array.isArray(node.attributes)) {
    for (const attribute of node.attributes) walk(attribute, visit);
  }
  if (node.value && typeof node.value === 'object') walk(node.value, visit);
}

function clip(value) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

/**
 * @param {string} content
 * @param {string} [label]
 * @returns {string[]}
 */
export function publishedMdxViolations(content, label = 'MDX') {
  const body = bodyAfterFrontmatter(content);
  let tree;
  try {
    tree = mdxProcessor().parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : 'parse failed';
    return [`${label}: MDX could not be parsed (${message})`];
  }

  const violations = [];
  walk(tree, (node) => {
    if (node.type === 'mdxjsEsm') {
      violations.push(`${label}: import/export statements are not allowed (${clip(node.value)})`);
      return;
    }
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      if (!isStaticProgram(node.data?.estree)) {
        violations.push(`${label}: expression is not a static literal (${clip(node.value)})`);
      }
      return;
    }
    if (node.type === 'mdxJsxExpressionAttribute') {
      violations.push(`${label}: JSX spread attributes are not allowed`);
      return;
    }
    if (node.type === 'mdxJsxAttributeValueExpression') {
      if (!isStaticProgram(node.data?.estree)) {
        violations.push(`${label}: prop expression is not a static literal (${clip(node.value)})`);
      }
      return;
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (!node.name || !ALLOWED_COMPONENTS.has(node.name)) {
        violations.push(`${label}: JSX component <${node.name || ''}> is not allowed`);
      }
    }
  });
  return violations;
}

/**
 * @param {string} content
 * @param {string} [label]
 */
export function assertSafePublishedMdx(content, label = 'MDX') {
  const violations = publishedMdxViolations(content, label);
  if (violations.length === 0) return;
  const preview = violations.slice(0, 5).join('\n');
  const extra = violations.length > 5 ? `\n${violations.length - 5} more` : '';
  throw new Error(`Refusing to publish MDX that would execute while the docs site builds.\n${preview}${extra}`);
}
