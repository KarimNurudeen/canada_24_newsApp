/**
 * The app's five-category navigation, mirroring the web app's `src/lib/nav.ts`.
 * `section` is the label `fetchCategoryArticles` resolves against the backend's
 * /news/sections/ catalog (see SECTION_NAME_ALIASES in newsService).
 */
export type NavCategory = {
  label: string;
  /** Param passed to the SectionDetail screen. */
  section: string;
  color: string;
  topics: string[];
  /** One-line blurb for the home category cards. */
  description: string;
};

export const NAV_CATEGORIES: NavCategory[] = [
  { label: 'Immigration', section: 'Immigration', color: '#BF360C', topics: ['Refugees', 'Policy', 'Study Permit', 'Work Permit', 'Citizenship'], description: 'Study permits, work permits, refugee and citizenship updates for newcomers.' },
  { label: 'Jobs & Money', section: 'Jobs & Money', color: '#E65100', topics: ['Work Permits', 'Hiring', 'Careers', 'Credentials', 'Banking'], description: 'Hiring, careers, credentials and banking news to help you settle in.' },
  { label: 'Housing', section: 'Housing', color: '#00695C', topics: ['Renting', 'Buying', 'Mortgages', 'Market', 'Affordability'], description: 'Renting, buying, mortgages and affordability across Canada.' },
  { label: 'Settlement', section: 'Settlement', color: '#6A1B9A', topics: ['Newcomer Services', 'Language', 'Healthcare', 'Education', 'Community'], description: 'Settling in Canada: newcomer services, language, healthcare, schools and community.' },
  { label: 'Auto', section: 'Auto', color: '#37474F', topics: ['Buying', 'Insurance', 'EVs', 'Licensing', 'Reviews'], description: 'Buying, insurance, EVs and licensing for Canadian drivers.' },
];

export function findNavCategory(section: string): NavCategory | undefined {
  return NAV_CATEGORIES.find(c => c.section.toLowerCase() === section.toLowerCase());
}
