import type { Article } from '../context/AppContext';

/* Keywords that place an article under a topic. Matched against headline and
   body; the backend has no sub-topic field. Mirrors TOPIC_KEYWORDS in the web
   app's section page. */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  Refugees: ['refugee', 'asylum', 'humanitarian'],
  Policy: ['policy', 'policies', 'ircc', 'minister', 'levels plan', 'regulation', 'legislation', 'bill c'],
  'Study Permit': ['study permit', 'student visa', 'international student', 'study in canada', 'pgwp'],
  'Work Permit': ['work permit', 'lmia', 'open work', 'temporary foreign', 'tfw'],
  'Work Permits': ['work permit', 'lmia', 'open work', 'temporary foreign', 'tfw'],
  Citizenship: ['citizenship', 'citizen', 'naturaliz'],
  Hiring: ['hiring', 'hire', 'job posting', 'job openings', 'vacanc', 'recruit', 'layoff'],
  Careers: ['career', 'job', 'employment', 'employer', 'workforce', 'wage', 'salary'],
  Credentials: ['credential', 'certif', 'licen', 'degree', 'recognition'],
  Banking: ['bank', 'credit', 'loan', 'interest rate', 'savings', 'tfsa', 'rrsp', 'tax'],
  Renting: ['rent', 'tenant', 'landlord', 'lease'],
  Buying: ['buy', 'purchase', 'homebuyer', 'first-time', 'price', 'sales'],
  Mortgages: ['mortgage', 'down payment', 'interest rate', 'lender'],
  Market: ['market', 'prices', 'sales', 'inventory', 'listings'],
  Affordability: ['afford', 'cost', 'inflation', 'cost of living', 'crisis'],
  Insurance: ['insurance', 'insurer', 'premium'],
  EVs: ['ev', 'electric', 'hybrid', 'battery', 'charging', 'tesla'],
  Licensing: ['licen', 'driver', 'road test', 'registration', 'g1', 'g2'],
  'Newcomer Services': ['newcomer', 'settlement service', 'settlement agency', 'orientation', 'immigrant services'],
  Language: ['language', 'english', 'french', 'ielts', 'celpip', 'clb'],
  Healthcare: ['health', 'doctor', 'ohip', 'medical', 'hospital', 'clinic'],
  Education: ['school', 'education', 'university', 'college', 'student', 'child care'],
  Community: ['community', 'neighbourhood', 'volunteer', 'cultural', 'festival', 'support group'],
  Reviews: ['review', 'first drive', 'tested', 'test drive', 'versus', ' vs '],
};

export function matchesTopic(article: Article, topic: string): boolean {
  const haystack = `${article.headline} ${article.body ?? ''}`.toLowerCase();
  const keywords = TOPIC_KEYWORDS[topic] ?? [topic.toLowerCase()];
  return keywords.some(k => (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(haystack) : haystack.includes(k)));
}

export function filterByTopic(articles: Article[], topic: string | null): Article[] {
  return topic ? articles.filter(a => matchesTopic(a, topic)) : articles;
}
