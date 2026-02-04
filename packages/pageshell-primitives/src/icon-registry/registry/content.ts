/**
 * Content Icons Registry
 *
 * @module icons/registry/content
 */

import {
  File,
  FileText,
  FileSearch,
  Folder,
  FolderOpen,
  Image,
  Video,
  Music,
  Link,
  Link2,
  BookOpen,
  StickyNote,
} from 'lucide-react';

export const contentIcons = {
  file: File,
  'file-text': FileText,
  document: FileText,
  'file-search': FileSearch,
  folder: Folder,
  'folder-open': FolderOpen,
  image: Image,
  video: Video,
  music: Music,
  link: Link,
  'link-2': Link2,
  'book-open': BookOpen,
  book: BookOpen,
  'sticky-note': StickyNote,
  note: StickyNote,
} as const;
