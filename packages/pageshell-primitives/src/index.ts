/**
 * @pageshell/primitives
 *
 * Radix-based UI primitives for PageShell composites.
 * Provides accessible, unstyled components that can be themed.
 *
 * @packageDocumentation
 */

// =============================================================================
// Button
// =============================================================================
export {
  Button,
  buttonVariants,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './button';

// =============================================================================
// Dialog
// =============================================================================
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogContentProps,
} from './dialog';

// =============================================================================
// Dropdown Menu
// =============================================================================
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown';

// =============================================================================
// Skeleton
// =============================================================================
export {
  Skeleton,
  SkeletonText,
  SkeletonHeading,
  SkeletonAvatar,
  type SkeletonProps,
} from './skeleton';

// =============================================================================
// Table
// =============================================================================
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  type TableHeadProps,
} from './table';

// =============================================================================
// Tabs
// =============================================================================
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// =============================================================================
// Tooltip
// =============================================================================
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
} from './tooltip';

// =============================================================================
// Input
// =============================================================================
export { Input, type InputProps } from './input';
export { SearchInput, type SearchInputProps } from './input';

// =============================================================================
// Select
// =============================================================================
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// =============================================================================
// Badge
// =============================================================================
export { Badge, badgeVariants, type BadgeProps } from './badge';

// =============================================================================
// Card
// =============================================================================
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
  type CardVariant,
} from './card';

// =============================================================================
// Textarea
// =============================================================================
export { Textarea, type TextareaProps } from './textarea';

// =============================================================================
// Switch
// =============================================================================
export { Switch, type SwitchProps } from './switch';

// =============================================================================
// Label
// =============================================================================
export { Label, labelVariants, type LabelProps } from './label';

// =============================================================================
// Checkbox
// =============================================================================
export { Checkbox, type CheckboxProps } from './checkbox';

// =============================================================================
// Separator
// =============================================================================
export { Separator, type SeparatorProps } from './separator';

// =============================================================================
// Icons
// =============================================================================
export {
  iconRegistry,
  resolveIcon,
  isValidIconName,
  getIconNames,
  isIconVariant,
  getAvailableIcons,
  iconCategories,
  type IconName,
  type IconProp,
} from './icons';

// Backward compatibility aliases for icon types
export type { IconName as PageIconVariant, IconProp as PageIconProp } from './icons';

// =============================================================================
// Loading State
// =============================================================================
export {
  LoadingState,
  LoadingSkeleton,
  type LoadingStateProps,
  type LoadingSkeletonProps,
  type LoadingSize,
} from './loading-state';

// =============================================================================
// Error State
// =============================================================================
export {
  ErrorState,
  type ErrorStateProps,
  type ErrorVariant,
  type LinkComponentType,
} from './error-state';

// =============================================================================
// Query Error
// =============================================================================
export {
  QueryError,
  type QueryErrorProps,
} from './query-error';

// =============================================================================
// PageText
// =============================================================================
export {
  PageText,
  type PageTextProps,
  type PageTextVariant,
  type PageTextSize,
  type PageTextAlign,
} from './page-text';

// =============================================================================
// PageCard
// =============================================================================
export {
  PageCard,
  type PageCardProps,
  type PageCardPadding,
  type PageCardVariant,
  type PageCardIconColor,
} from './page-card';

// =============================================================================
// FieldHeader
// =============================================================================
export {
  FieldHeader,
  type FieldHeaderProps,
  type FieldHeaderIconColor,
} from './field-header';

// =============================================================================
// PageGrid
// =============================================================================
export {
  PageGrid,
  type PageGridProps,
  type PageGridColumns,
  type PageGridGap,
  type PageGridAnimation,
  type PageGridResponsive,
  type PageGridEmptyState,
  type PageGridAnimationConfig,
} from './page-grid';

// =============================================================================
// PageAlert
// =============================================================================
export {
  PageAlert,
  PageAlertGroup,
  type PageAlertProps,
  type PageAlertGroupProps,
  type PageAlertVariant,
  type PageAlertAction,
} from './page-alert';

// =============================================================================
// PageIcon
// =============================================================================
export {
  PageIcon,
  type PageIconProps,
} from './page-icon';

// =============================================================================
// StatusBadge
// =============================================================================
export {
  StatusBadge,
  defineStatusConfig,
  statusPresets,
  getStatusConfig,
  isPositiveStatus,
  isNegativeStatus,
  getStatusVariant,
  type StatusBadgeProps,
  type StatusVariant,
  type StatusConfig,
  type StatusMapping,
} from './status-badge';

// =============================================================================
// KPICard
// =============================================================================
export {
  KPICard,
  KPICardGroup,
  type KPICardProps,
  type KPICardGroupProps,
  type KPICardSize,
  type KPITrend,
  type KPITrendDirection,
  type KPIComparison,
} from './kpi-card';

// =============================================================================
// TableSkeleton (from skeleton module)
// =============================================================================
export {
  TableSkeleton,
  type TableSkeletonProps,
} from './skeleton';

// =============================================================================
// Modal Utilities (shared across modal components)
// =============================================================================
export {
  // Theme detection hook
  useDetectedPortalTheme,
  // Theme styles
  getModalThemeStyles,
  // Classes
  MODAL_OVERLAY_CLASSES,
  MODAL_CONTENT_BASE_CLASSES,
  MODAL_SIZE_CLASSES,
  CONFIRM_DIALOG_SIZE_CLASSES,
  // Components
  MobileDragIndicator,
  // Types
  type PortalTheme,
  type PortalThemeResult,
  type ModalSize,
} from './modal';

// =============================================================================
// EmptyState
// =============================================================================
export {
  EmptyState,
  EmptySearchState,
  EmptyDataState,
  type EmptyStateProps,
  type EmptyStateVariant,
  type EmptyStateSize,
  type EmptyStateAction,
  type LinkComponentType as EmptyStateLinkComponent,
} from './empty-state';

// =============================================================================
// PageModal
// =============================================================================
export {
  PageModal,
  PageModalFooter,
  PageModalTrigger,
  type PageModalProps,
  type PageModalFooterProps,
  type PageModalTheme,
} from './page-modal';

// =============================================================================
// PageButton
// =============================================================================
export {
  PageButton,
  type PageButtonProps,
} from './page-button';

// =============================================================================
// PageBackLink
// =============================================================================
export {
  PageBackLink,
  type PageBackLinkProps,
  type LinkComponentType as PageBackLinkComponentType,
} from './page-back-link';

// =============================================================================
// PageConfirmDialog
// =============================================================================
export {
  PageConfirmDialog,
  type PageConfirmDialogProps,
  type PageConfirmDialogTheme,
  type PageConfirmDialogVariant,
  type ConfirmDialogMutation,
} from './page-confirm-dialog';

// =============================================================================
// PageAvatar
// =============================================================================
export {
  PageAvatar,
  PageAvatarGroup,
  type PageAvatarProps,
  type PageAvatarGroupProps,
  type PageAvatarSize,
  type PageAvatarStatus,
  type AvatarLinkComponent,
  type AvatarImageComponent,
} from './page-avatar';

// =============================================================================
// PageBreakdownCard
// =============================================================================
export {
  PageBreakdownCard,
  type PageBreakdownCardProps,
  type PageBreakdownCardItem,
  type BreakdownColor,
} from './page-breakdown-card';

// Backward compatibility alias
export type { PageBreakdownCardItem as BreakdownItem } from './page-breakdown-card';

// =============================================================================
// PageQuickAction
// =============================================================================
export {
  PageQuickAction,
  type PageQuickActionProps,
  type QuickActionVariant,
  type QuickActionLayout,
  type QuickActionLinkComponent,
} from './page-quick-action';

// =============================================================================
// GlassOverlay
// =============================================================================
export { GlassOverlay, type GlassOverlayProps } from './glass-overlay';

// =============================================================================
// FocusGlow
// =============================================================================
export { FocusGlow, type FocusGlowProps } from './focus-glow';

// =============================================================================
// AnimatedFields
// =============================================================================
export {
  AnimatedFields,
  type AnimatedFieldsProps,
  type AnimatedFieldsAnimation,
} from './animated-fields';

// =============================================================================
// BottomSheet
// =============================================================================
export { BottomSheet, type BottomSheetProps } from './bottom-sheet';

// =============================================================================
// Field (compound form field components)
// =============================================================================
export { Field } from './field';
export { FieldInput, FieldTextarea, FieldLabel, FieldSelect, FieldCheckbox } from './field';
export {
  fieldInputVariants,
  fieldTextareaVariants,
  fieldLabelVariants,
  fieldSelectVariants,
  fieldCheckboxVariants,
} from './field';
export type {
  FieldInputProps,
  FieldTextareaProps,
  FieldLabelProps,
  FieldSelectProps,
  FieldSelectOption,
  FieldSelectGroup,
  FieldCheckboxProps,
} from './field';

// =============================================================================
// Spinner (loading indicators)
// =============================================================================
export { Spinner, LoadingOverlay, type SpinnerProps, type LoadingOverlayProps } from './spinner';

// =============================================================================
// Progress
// =============================================================================
export { Progress, type ProgressProps } from './progress';

// =============================================================================
// Slider
// =============================================================================
export { Slider, type SliderProps } from './slider';

// =============================================================================
// RadioGroup
// =============================================================================
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from './radio-group';

// =============================================================================
// Alert
// =============================================================================
export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  type AlertProps,
  type AlertTitleProps,
  type AlertDescriptionProps,
  type AlertVariant,
} from './alert';

// =============================================================================
// Avatar
// =============================================================================
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  type AvatarProps,
  type AvatarImageProps,
  type AvatarFallbackProps,
} from './avatar';

// =============================================================================
// Popover
// =============================================================================
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  type PopoverContentProps,
} from './popover';

// =============================================================================
// Accordion
// =============================================================================
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
} from './accordion';

// =============================================================================
// EditorialCard
// =============================================================================
export {
  EditorialCard,
  editorialCardVariants,
  editorialShadowVariants,
  editorialInnerVariants,
  type EditorialCardProps,
  type EditorialCardVariant,
  type ShadowIntensity,
} from './editorial-card';

// =============================================================================
// Collapsible
// =============================================================================
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
} from './collapsible';

// =============================================================================
// Sheet
// =============================================================================
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetVariants,
  type SheetOverlayProps,
  type SheetContentProps,
  type SheetHeaderProps,
  type SheetFooterProps,
  type SheetTitleProps,
  type SheetDescriptionProps,
  type SheetSide,
} from './sheet';

// =============================================================================
// ScrollArea
// =============================================================================
export {
  ScrollArea,
  ScrollBar,
  type ScrollAreaProps,
  type ScrollBarProps,
} from './scroll-area';

// =============================================================================
// StarRating
// =============================================================================
export {
  StarRating,
  type StarRatingProps,
} from './star-rating';

// =============================================================================
// Rating (Distribution & Badge)
// =============================================================================
export {
  RatingDistribution,
  RatingBadge,
  type RatingDistributionProps,
  type RatingDistributionItem,
  type RatingBadgeProps,
} from './rating';

// =============================================================================
// Layout Skeletons
// =============================================================================
export {
  StatsSkeleton,
  FormSkeleton,
  ChartSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  type StatsSkeletonProps,
  type FormSkeletonProps,
  type ChartSkeletonProps,
  type ListSkeletonProps,
  type SkeletonBaseProps,
} from './layout-skeletons';

// =============================================================================
// RetryStatus
// =============================================================================
export {
  RetryStatus,
  RetryIndicator,
  type RetryStatusProps,
  type RetryIndicatorProps,
  type RetryStatusData,
} from './retry-status';

// =============================================================================
// SettingToggle (theme-aware toggle switch)
// =============================================================================
export {
  ThemeSwitch,
  SettingToggle,
  type ThemeSwitchProps,
  type SettingToggleProps,
} from './setting-toggle';

// =============================================================================
// EnumStatusBadge
// =============================================================================
export {
  EnumStatusBadge,
  defineEnumBadgeConfig,
  type EnumStatusBadgeProps,
  type EnumBadgeConfig,
  type EnumBadgeConfigItem,
} from './enum-badge';

// =============================================================================
// PageChecklistItem
// =============================================================================
export {
  PageChecklistItem,
  type PageChecklistItemProps,
} from './checklist-item';

// =============================================================================
// PageProgressBar
// =============================================================================
export {
  PageProgressBar,
  type PageProgressBarProps,
  type ProgressBarColor,
  type ProgressBarSize,
} from './progress-bar';

// =============================================================================
// MiniGauge
// =============================================================================
export { MiniGauge, type MiniGaugeProps, type MiniGaugeCompactProps } from './mini-gauge';

// =============================================================================
// RadialGauge
// =============================================================================
export { RadialGauge, type RadialGaugeProps } from './radial-gauge';

// =============================================================================
// PulsingStatusDot
// =============================================================================
export {
  PulsingStatusDot,
  type PulsingStatusDotProps,
  type StatusDotVariant,
  type StatusDotSize,
} from './pulsing-status-dot';

// =============================================================================
// HealthIndicator
// =============================================================================
export {
  HealthIndicator,
  type HealthIndicatorProps,
  type HealthStatus,
  type HealthIndicatorSize,
  type HealthStatusConfig,
} from './health-indicator';

// =============================================================================
// LabeledIndicator
// =============================================================================
export {
  LabeledIndicator,
  type LabeledIndicatorProps,
  type IndicatorVariant,
  type IndicatorSize,
} from './labeled-indicator';

// =============================================================================
// ScrollReveal
// =============================================================================
export {
  ScrollReveal,
  type ScrollRevealProps,
  type ScrollRevealAnimation,
} from './scroll-reveal';
