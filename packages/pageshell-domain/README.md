# @pageshell/domain

Domain-specific UI components for PageShell.

## Features

- **Courses** - Course cards, lists, progress indicators
- **Sessions** - Mentorship session components
- **Credits** - Credit balance, purchase UI
- **Gamification** - Badges, achievements, leaderboards
- **Dashboard** - Stats, widgets, charts
- **Mentorship** - Q&A threads, mentor profiles
- **Profile** - User profile components

## Installation

```typescript
import { ... } from '@pageshell/domain'
```

## Usage

### Courses

```tsx
import { CourseCard, CourseProgress } from '@pageshell/domain/courses'

<CourseCard
  title="React Mastery"
  thumbnail="/course.jpg"
  price={2990}
  rating={4.8}
/>

<CourseProgress
  completed={5}
  total={12}
/>
```

### Sessions

```tsx
import { SessionCard, SessionStatus } from '@pageshell/domain/sessions'

<SessionCard
  title="1:1 Mentorship"
  mentor="John Doe"
  date={new Date()}
  status="scheduled"
/>
```

### Credits

```tsx
import { CreditBalance, CreditPackage } from '@pageshell/domain/credits'

<CreditBalance amount={500} />

<CreditPackage
  name="Starter"
  credits={100}
  price={9.99}
/>
```

### Gamification

```tsx
import { BadgeCard, LeaderboardRow } from '@pageshell/domain/gamification'

<BadgeCard
  name="First Course"
  icon="🎓"
  earned={true}
/>

<LeaderboardRow
  rank={1}
  user="Jane"
  points={1500}
/>
```

### Dashboard

```tsx
import { StatCard, ProgressWidget } from '@pageshell/domain/dashboard'

<StatCard
  label="Students"
  value={1234}
  trend="+12%"
/>
```

## Exports

| Export Path | Description |
|-------------|-------------|
| `.` | All domain components |
| `./courses` | Course-related components |
| `./sessions` | Session components |
| `./credits` | Credit system components |
| `./gamification` | Badges, achievements |
| `./dashboard` | Dashboard widgets |
| `./mentorship` | Mentorship components |
| `./primitives` | Domain primitives |
| `./profile` | Profile components |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/composites](../pageshell-composites/README.md) - Page composites
