/**
 * Figma: Badge — Body/Overline, padding 4/8, sin radio.
 * Neutral · Brand · Accent y variantes de feedback (con punto de 6 px).
 */
export type BadgeVariant = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'error' | 'info';

const BASE = 'inline-flex w-fit items-center gap-2 px-2 py-1 type-overline';

const VARIANTES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-field text-text-secondary',
  brand: 'bg-brand-primary text-text-on-brand',
  accent: 'bg-accent-primary text-text-on-accent',
  success: 'bg-feedback-success-surface text-feedback-success-text',
  warning: 'bg-feedback-warning-surface text-feedback-warning-text',
  error: 'bg-feedback-error-surface text-feedback-error-text',
  info: 'bg-feedback-info-surface text-feedback-info-text',
};

/** Las variantes de feedback llevan un punto de 6 px del color del texto. */
export const BADGE_CON_PUNTO: ReadonlySet<BadgeVariant> = new Set(['success', 'warning', 'error', 'info']);

export function badgeClasses(variant: BadgeVariant = 'neutral', className = ''): string {
  const punto = BADGE_CON_PUNTO.has(variant)
    ? "before:size-1.5 before:shrink-0 before:bg-current before:content-['']"
    : '';
  return [BASE, VARIANTES[variant], punto, className].filter(Boolean).join(' ');
}
