/**
 * Communication & Network Icons Registry
 *
 * @module icons/registry/communication
 */

import {
  Flame,
  Reply,
  Plug,
  Send,
  Archive,
  Wifi,
  WifiOff,
  RotateCw,
  RotateCcw,
  SkipForward,
  PhoneOff,
} from 'lucide-react';

export const communicationIcons = {
  flame: Flame,
  fire: Flame,
  reply: Reply,
  plug: Plug,
  plugin: Plug,
  send: Send,
  archive: Archive,
  wifi: Wifi,
  'wifi-off': WifiOff,
  'rotate-cw': RotateCw,
  'rotate-ccw': RotateCcw,
  'skip-forward': SkipForward,
  'phone-off': PhoneOff,
} as const;
