# Application Shell Specification

## Layout Pattern
sidebar-dashboard

## Theme Preset
odonto-ai

## Overview
AURIA (ToSmile.ai) uses a sidebar-dashboard layout with a collapsible sidebar, top header bar with credit badge, and a wide content area. The sidebar has two navigation sections: main features and account management. The shell includes custom brand identity (tooth SVG with teal gradient), avatar fallback chain, and a credits footer.

## Navigation Structure

### Main Section (no label)
- **Dashboard** → `/dashboard` — LayoutDashboard icon — Home/default view
- **Evaluations** → `/evaluations` — FileText icon — Clinical evaluation list
- **Patients** → `/patients` — Users icon — Patient management
- **Inventory** → `/inventory` — Package icon — Resin/material inventory

### Account Section (label: "Conta")
- **Profile** → `/profile` — User icon — User profile settings
- **Subscription** → `/profile?tab=assinatura` — CreditCard icon — Billing/plan management
- **Support** → `mailto:suporte@tosmile.ai` — HelpCircle icon — External support link

## Header Slots
- **Right**: CreditBadge (compact) — shows remaining AI credits
- **Theme Toggle**: Dark/light mode switch

## Sidebar Slots
- **Footer**: SidebarCredits — credits usage display
- **Theme Toggle**: Dark/light mode switch (duplicated in sidebar)

## Brand
- **Logo**: `/logo.svg` (tooth SVG with teal gradient)
- **Icon**: Custom `BrandToothIcon` component (inline SVG with `#brand-teal` gradient)
- **Title**: "ToSmile" in sidebar-foreground color
- **Home link**: `/dashboard`

## User Menu
- Theme toggle
- Sign out
- Profile, Subscription, and Support moved to sidebar navigation (not in dropdown)

## Avatar
- Fallback chain: Supabase Storage → Google OAuth → Initials
- Custom `renderAvatar` with `AvatarWithFallback` component

## Key Routes (not in nav)
- `/new-case` — New case wizard (accessed from Dashboard/Evaluations)
- `/evaluations/:id` — Evaluation detail view
- `/results/:id` — Individual result
- `/group-results/:id` — Group result
- `/patients/:id` — Patient profile
- `/shared/:id` — Shared evaluation (public, no shell)
- `/pricing` — Pricing page

## Responsive Behavior
- Handled by PageShell's built-in responsive system
- Sidebar collapses to hamburger menu on mobile
- Navigation adapts across breakpoints automatically
- Mobile header shows brand tooth icon with glow effect
