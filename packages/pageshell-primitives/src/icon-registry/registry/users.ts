/**
 * Users & Social Icons Registry
 *
 * @module icons/registry/users
 */

import {
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserCog,
  UserCircle,
  Mail,
  MessageSquare,
  MessageCircle,
  Bell,
  Inbox,
  Heart,
  Star,
  ThumbsUp,
} from 'lucide-react';

export const userIcons = {
  user: User,
  users: Users,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-check': UserCheck,
  'user-cog': UserCog,
  'user-circle': UserCircle,
  mail: Mail,
  email: Mail,
  message: MessageSquare,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  bell: Bell,
  notification: Bell,
  inbox: Inbox,
  heart: Heart,
  star: Star,
  'thumbs-up': ThumbsUp,
  like: ThumbsUp,
} as const;
