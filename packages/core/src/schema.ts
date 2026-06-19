import { z } from 'zod';

/**
 * A single file that ships with a registry item. The `path` is relative to the
 * consumer project root; `content` is the literal source written to disk.
 */
export const registryFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  /** Hint used by the CLI to decide a default target directory. */
  type: z.enum(['component', 'lib', 'hook', 'style', 'file']).default('file'),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;

/**
 * The unit a consumer installs with `add <name>`. Kept intentionally generic so
 * it works for UI components, MDX blocks, snippets, configs, etc.
 */
export const registryItemSchema = z.object({
  name: z.string().min(1),
  type: z.string().default('component'),
  description: z.string().optional(),
  /** npm packages the item needs at runtime. */
  dependencies: z.array(z.string()).default([]),
  /** npm packages the item needs at build/dev time. */
  devDependencies: z.array(z.string()).default([]),
  /** Other registry items this one pulls in. */
  registryDependencies: z.array(z.string()).default([]),
  files: z.array(registryFileSchema).min(1),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;

/** Lightweight entry used by the index that lists every published item. */
export const registryIndexEntrySchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  description: z.string().optional(),
});

export type RegistryIndexEntry = z.infer<typeof registryIndexEntrySchema>;

export const registryIndexSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  homepage: z.string().url().optional(),
  items: z.array(registryIndexEntrySchema),
});

export type RegistryIndex = z.infer<typeof registryIndexSchema>;
