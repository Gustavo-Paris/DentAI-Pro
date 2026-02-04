/**
 * Media Icons Registry
 *
 * @module icons/registry/media
 */

import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';

export const mediaIcons = {
  play: Play,
  pause: Pause,
  stop: Square,
  volume: Volume2,
  'volume-x': VolumeX,
  mute: VolumeX,
  maximize: Maximize,
  minimize: Minimize,
} as const;
