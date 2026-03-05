/**
 * Design OS configuration.
 * Consumed by the designos CLI to locate content directories.
 */
import { defineConfig } from '@parisgroup-ai/design-os/types'

export default defineConfig({
  designDir: './design',
  designSrcDir: './design-src',
})
