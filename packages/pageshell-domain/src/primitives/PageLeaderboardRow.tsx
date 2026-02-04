/**
 * PageLeaderboardRow (stub)
 *
 * TODO: Implement leaderboard row component.
 */

import type { ReactNode } from 'react';

export interface LeaderboardLabels {
  rank?: string;
  points?: string;
  level?: string;
}

export interface LeaderboardLinkProps {
  href: string;
  children: ReactNode;
}

export interface LeaderboardUserData {
  id: string;
  name: string;
  avatarUrl?: string;
  rank: number;
  points: number;
  level?: number;
}

export interface PageLeaderboardRowProps {
  user: LeaderboardUserData;
  labels?: LeaderboardLabels;
  renderLink?: (props: LeaderboardLinkProps) => ReactNode;
  className?: string;
}

export function PageLeaderboardRow(_props: PageLeaderboardRowProps) {
  return null;
}
