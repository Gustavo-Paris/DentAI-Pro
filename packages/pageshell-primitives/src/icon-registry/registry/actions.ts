/**
 * Action Icons Registry
 *
 * @module icons/registry/actions
 */

import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Settings2,
  RefreshCw,
} from 'lucide-react';

export const actionIcons = {
  plus: Plus,
  add: Plus,
  pencil: Pencil,
  edit: Pencil,
  trash: Trash2,
  delete: Trash2,
  save: Save,
  close: X,
  x: X,
  check: Check,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  share: Share2,
  copy: Copy,
  'external-link': ExternalLink,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  settings: Settings,
  'settings-2': Settings2,
  'refresh-cw': RefreshCw,
  refresh: RefreshCw,
} as const;
