export const CATEGORY_DEFINITIONS = [
  { code: 'GENERAL', label: 'General' },
  { code: 'POLITICS', label: 'Politics' },
  { code: 'WORLD', label: 'World' },
  { code: 'BUSINESS', label: 'Business' },
  { code: 'HEALTH', label: 'Health' },
  { code: 'TECHNOLOGY', label: 'Technology' },
  { code: 'SPORTS', label: 'Sports' },
  { code: 'ENTERTAINMENT', label: 'Entertainment' },
  { code: 'IMMIGRATION', label: 'Immigration' },
  { code: 'AVIATION', label: 'Aviation' },
  { code: 'INDIGENOUS', label: 'Indigenous' },
  { code: 'EVENTS', label: 'Events' },
  { code: 'AUTO_NEWS', label: 'Auto News' },
  { code: 'BLACKS_IN_CANADA', label: 'Blacks in Canada' },
  { code: 'EDUCATION', label: 'Education in Canada' },
  { code: 'OPPORTUNITIES', label: 'Opportunities' },
] as const;

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(item => [item.code, item.label]),
) as Record<string, string>;

export const CATEGORY_CODES = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(item => [item.label, item.code]),
) as Record<string, string>;

export const CREATE_POST_CATEGORIES = CATEGORY_DEFINITIONS.map(item => item.label);

export const ALERT_DEFINITIONS = [
  { label: 'Breaking News', serverKey: 'breaking_news' },
  { label: 'Top Stories', serverKey: 'top_stories' },
  { label: 'Local News', serverKey: 'local_news' },
  { label: 'Business', serverKey: 'business' },
  { label: 'Health', serverKey: 'health' },
  { label: 'Entertainment', serverKey: 'entertainment' },
  { label: 'Politics', serverKey: 'politics' },
  { label: 'Sports', serverKey: 'sports' },
  { label: 'Technology', serverKey: 'science' },
  { label: 'World', serverKey: 'environment' },
] as const;

export function formatCategoryLabel(value?: string): string | undefined {
  if (!value) return undefined;
  return CATEGORY_LABELS[value] ?? value.replace(/_/g, ' ');
}
