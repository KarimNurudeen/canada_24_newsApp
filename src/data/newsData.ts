import type { Article } from '../context/AppContext';

export const TOP_STORIES: Article[] = [
  {
    id: 'ts1',
    headline: 'House of Commons resumes with focus on housing affordability',
    category: 'POLITICS',
    time: 'AN HOUR AGO',
    imgUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600',
    isLive: false,
  },
  {
    id: 'ts2',
    headline: 'Bank of Canada holds interest rate amid economic uncertainty',
    category: 'BUSINESS',
    time: '2 HOURS AGO',
    imgUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
  },
  {
    id: 'ts3',
    headline: 'Federal health minister announces new pandemic preparedness plan',
    category: 'HEALTH',
    time: '3 HOURS AGO',
    imgUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600',
  },
  {
    id: 'ts4',
    headline: 'New immigration pathways announced for skilled workers in Canada',
    category: 'IMMIGRATION',
    time: '4 HOURS AGO',
    imgUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600',
  },
  {
    id: 'ts5',
    headline: 'Canada launches national AI safety institute to regulate emerging tech',
    category: 'TECHNOLOGY',
    time: '5 HOURS AGO',
    imgUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
  },
];

export const TOP_STORIES_SUBITEMS = [
  { id: 's1', headline: 'Canada 247: Special Report — Live Coverage', isLive: true },
  { id: 's2', headline: "Maple Leafs advance after dramatic Game 7 comeback", isLive: false },
  { id: 's3', headline: 'First Nations leaders reach historic water rights agreement', isLive: false },
];

export const LOCAL_ARTICLES: Record<string, Article[]> = {
  Calgary: [
    { id: 'c1', headline: 'Mental health concerns for Airdrie man accused of murdering mother', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' },
    { id: 'c2', headline: "Police identify man killed in northeast Calgary shooting as city's 11th homicide victim", time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', isUpdated: true },
    { id: 'c3', headline: 'Calgary Transit to increase security presence at downtown stations', time: '8 hours ago', imgUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300' },
  ],
  Manitoba: [
    { id: 'm1', headline: 'Manitoba government announces new healthcare funding initiative', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300' },
    { id: 'm2', headline: 'Winnipeg floods prompt emergency response across the region', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?w=300' },
  ],
  'Kitchener-Waterloo': [
    { id: 'kw1', headline: 'Waterloo tech company announces major expansion plans', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300' },
    { id: 'kw2', headline: 'Region of Waterloo invests in green transit solutions', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300' },
  ],
  Edmonton: [
    { id: 'e1', headline: 'Edmonton Oilers face off in critical playoff match', time: '30 mins ago', imgUrl: 'https://images.unsplash.com/photo-1580847097346-72d80f164702?w=300' },
    { id: 'e2', headline: 'City of Edmonton unveils new park redevelopment project', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300' },
  ],
};

export const ALL_REGIONS = [
  'British Columbia', 'Calgary', 'Edmonton', 'Hamilton', 'Kitchener-Waterloo',
  'London', 'Manitoba', 'Montreal', 'NL', 'New Brunswick', 'North',
  'Nova Scotia', 'Ottawa', 'PEI', 'Quebec', 'Saskatchewan', 'Toronto', 'Windsor',
];

export const CITY_TABS = ['Calgary', 'Manitoba', 'Kitchener-Waterloo', 'Edmonton'];

export const SECTION_FALLBACK_ARTICLES: Record<string, Article[]> = {
  Business: [
    { id: 'b1', headline: 'Bank of Canada holds interest rate steady as inflation pressures ease', category: 'BUSINESS', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600' },
    { id: 'b2', headline: 'Canadian dollar gains ground against U.S. dollar amid trade optimism', category: 'BUSINESS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=600' },
    { id: 'b3', headline: 'Toronto housing market sees first price decline in three years', category: 'BUSINESS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600' },
    { id: 'b4', headline: 'Canada announces new trade deal with Indo-Pacific partners', category: 'BUSINESS', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600' },
    { id: 'b5', headline: "Shopify reports record revenue as Canada's tech sector rebounds", category: 'BUSINESS', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600' },
  ],
  Health: [
    { id: 'h1', headline: 'Federal health minister announces expanded mental health funding for youth', category: 'HEALTH', time: '30 minutes ago', imgUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600' },
    { id: 'h2', headline: 'New study links ultra-processed foods to higher dementia risk in Canadians', category: 'HEALTH', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600' },
    { id: 'h3', headline: 'Canada approves new RSV vaccine for adults over 60', category: 'HEALTH', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600' },
    { id: 'h4', headline: 'Long-term care reform bill passes third reading in Parliament', category: 'HEALTH', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600' },
    { id: 'h5', headline: 'Opioid crisis: BC declares provincial health emergency extension', category: 'HEALTH', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600' },
  ],
  Entertainment: [
    { id: 'en1', headline: 'TIFF 2025 lineup features record number of Canadian-directed films', category: 'ENTERTAINMENT', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600' },
    { id: 'en2', headline: 'Drake announces surprise stadium tour across Canadian cities', category: 'ENTERTAINMENT', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600' },
    { id: 'en3', headline: "New Canadian drama series tops streaming charts in 40 countries", category: 'ENTERTAINMENT', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600' },
    { id: 'en4', headline: 'Celine Dion makes emotional comeback at Montreal benefit concert', category: 'ENTERTAINMENT', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600' },
    { id: 'en5', headline: 'National Arts Centre announces free summer programming across Canada', category: 'ENTERTAINMENT', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600' },
  ],
  Technology: [
    { id: 't1', headline: 'Canada launches national AI safety institute to regulate emerging tech', category: 'TECHNOLOGY', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600' },
    { id: 't2', headline: 'Waterloo startup raises $200M to bring quantum computing to hospitals', category: 'TECHNOLOGY', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600' },
    { id: 't3', headline: 'Rogers and Bell expand rural 5G coverage to 500 new communities', category: 'TECHNOLOGY', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600' },
    { id: 't4', headline: 'Ottawa introduces new privacy bill targeting social media data collection', category: 'TECHNOLOGY', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600' },
    { id: 't5', headline: 'Canadian university develops biodegradable circuit board from wood pulp', category: 'TECHNOLOGY', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600' },
  ],
  Sports: [
    { id: 'sp1', headline: 'Maple Leafs advance to second round after dramatic Game 7 comeback', category: 'SPORTS', time: '45 minutes ago', imgUrl: 'https://images.unsplash.com/photo-1580847097346-72d80f164702?w=600' },
    { id: 'sp2', headline: "Canada women's soccer team qualifies for 2026 World Cup in style", category: 'SPORTS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600' },
    { id: 'sp3', headline: 'Raptors sign top free agent in biggest deal in franchise history', category: 'SPORTS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600' },
    { id: 'sp4', headline: 'CFL announces expansion franchise in Halifax set for 2027 season', category: 'SPORTS', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600' },
    { id: 'sp5', headline: 'Canada wins five medals on day three of Paris athletics championships', category: 'SPORTS', time: '7 hours ago', imgUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600' },
  ],
  Immigration: [
    { id: 'im1', headline: 'Canada announces new express entry draw targeting healthcare workers', category: 'IMMIGRATION', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600' },
    { id: 'im2', headline: 'IRCC launches new family reunification stream for 2026', category: 'IMMIGRATION', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600' },
    { id: 'im3', headline: 'Processing times for Canadian PR applications drop to 6-month average', category: 'IMMIGRATION', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600' },
    { id: 'im4', headline: 'New pathways for international students to become permanent residents', category: 'IMMIGRATION', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600' },
    { id: 'im5', headline: 'Canada signs refugee resettlement agreement with UNHCR for 2026-2028', category: 'IMMIGRATION', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1584531870082-6d06b4f83ca7?w=600' },
  ],
  Aviation: [
    { id: 'av1', headline: "Air Canada expands direct routes to Africa and the Caribbean", category: 'AVIATION', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600' },
    { id: 'av2', headline: 'WestJet launches new ultra-low-cost subsidiary targeting regional routes', category: 'AVIATION', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4aa8f71?w=600' },
    { id: 'av3', headline: 'Pearson airport ranks among top 10 most improved airports globally', category: 'AVIATION', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600' },
    { id: 'av4', headline: 'Transport Canada approves first commercial drone delivery network', category: 'AVIATION', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600' },
    { id: 'av5', headline: 'Canada invests $1.2B in sustainable aviation fuel to cut flight emissions', category: 'AVIATION', time: '7 hours ago', imgUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600' },
  ],
  Indigenous: [
    { id: 'in1', headline: 'First Nations leaders reach historic water rights agreement with federal government', category: 'INDIGENOUS', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600' },
    { id: 'in2', headline: 'Residential school survivors receive long-awaited compensation payments', category: 'INDIGENOUS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600' },
    { id: 'in3', headline: "Nunavut's first Indigenous-language university program launches this fall", category: 'INDIGENOUS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1551244072-5d12893278bc?w=600' },
    { id: 'in4', headline: 'Crown and Métis Nation sign landmark self-governance agreement', category: 'INDIGENOUS', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600' },
    { id: 'in5', headline: 'Six Nations creates Canada\'s first fully Indigenous-run renewable energy grid', category: 'INDIGENOUS', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600' },
  ],
  Politics: [
    { id: 'po1', headline: 'Liberal government survives confidence vote by narrow margin', category: 'POLITICS', time: '45 minutes ago', imgUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600' },
    { id: 'po2', headline: 'PM announces cabinet shuffle, elevates Atlantic Canada representation', category: 'POLITICS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600' },
    { id: 'po3', headline: 'House of Commons passes new anti-corruption legislation', category: 'POLITICS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
    { id: 'po4', headline: 'Federal election speculation grows as party polling narrows dramatically', category: 'POLITICS', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600' },
    { id: 'po5', headline: 'Senate blocks controversial data surveillance bill, sends it back to Commons', category: 'POLITICS', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600' },
  ],
  Events: [
    { id: 'ev1', headline: 'Caribana 2026: Toronto festival announces record-breaking lineup', category: 'EVENTS', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600' },
    { id: 'ev2', headline: 'Ottawa Bluesfest returns with 10-day outdoor celebration', category: 'EVENTS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600' },
    { id: 'ev3', headline: 'Calgary Stampede announces new Indigenous-led programming for 2026', category: 'EVENTS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1580847097346-72d80f164702?w=600' },
    { id: 'ev4', headline: 'Montreal International Jazz Festival celebrates 47th edition', category: 'EVENTS', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600' },
    { id: 'ev5', headline: 'Canada Day 2026: National Capital Region unveils largest ever event plan', category: 'EVENTS', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  ],
  'Auto News': [
    { id: 'au1', headline: 'GM unveils Canadian-built electric pickup at Toronto Auto Show', category: 'AUTO_NEWS', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600' },
    { id: 'au2', headline: 'Canada leads G7 in EV adoption rate for second consecutive year', category: 'AUTO_NEWS', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
    { id: 'au3', headline: "Ontario's new EV rebate program doubles incentive to $10,000", category: 'AUTO_NEWS', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600' },
    { id: 'au4', headline: "Canada's auto parts sector adds 8,000 jobs as EV supply chain grows", category: 'AUTO_NEWS', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600' },
    { id: 'au5', headline: 'Federal government bans sale of new gas-powered cars by 2035', category: 'AUTO_NEWS', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=600' },
  ],
  'Blacks in Canada': [
    { id: 'bc1', headline: 'Black Canadian entrepreneurs secure $50M federal innovation fund', category: 'BLACKS_IN_CANADA', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600' },
    { id: 'bc2', headline: 'Ontario launches Black excellence scholarship for university students', category: 'BLACKS_IN_CANADA', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600' },
    { id: 'bc3', headline: 'Afrofest Toronto returns as largest African music festival in North America', category: 'BLACKS_IN_CANADA', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600' },
    { id: 'bc4', headline: 'Black History Canada museum breaks ground in Ottawa', category: 'BLACKS_IN_CANADA', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600' },
    { id: 'bc5', headline: "Report highlights Black Canadians' growing influence in healthcare leadership", category: 'BLACKS_IN_CANADA', time: '6 hours ago', imgUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600' },
  ],
  'Education in Canada': [
    { id: 'ed1', headline: 'Federal government cancels interest on all student loans permanently', category: 'EDUCATION', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600' },
    { id: 'ed2', headline: 'Canada ranks 4th globally in university research output', category: 'EDUCATION', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600' },
    { id: 'ed3', headline: 'Ontario introduces free after-school tutoring program for K-12', category: 'EDUCATION', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600' },
    { id: 'ed4', headline: 'New trades apprenticeship fund targets 100,000 young Canadians', category: 'EDUCATION', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600' },
    { id: 'ed5', headline: 'International student cap causes enrolment crisis at Canadian colleges', category: 'EDUCATION', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600' },
  ],
  Opportunities: [
    { id: 'op1', headline: 'Canada announces 50,000 new job openings in healthcare sector', category: 'OPPORTUNITIES', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600' },
    { id: 'op2', headline: 'New federal grant program for Black and Indigenous entrepreneurs', category: 'OPPORTUNITIES', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600' },
    { id: 'op3', headline: 'Canada Post hiring 12,000 seasonal workers across all provinces', category: 'OPPORTUNITIES', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e6?w=600' },
    { id: 'op4', headline: 'Scholarship worth $25,000 open to first-generation university students', category: 'OPPORTUNITIES', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600' },
    { id: 'op5', headline: 'Federal small business grants: how to apply before the June deadline', category: 'OPPORTUNITIES', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600' },
  ],
  World: [
    { id: 'w1', headline: "Canada's foreign minister to lead G7 discussion on Arctic sovereignty", category: 'WORLD', time: '1 hour ago', imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600' },
    { id: 'w2', headline: 'NATO allies look to Canada to increase peacekeeping contributions', category: 'WORLD', time: '2 hours ago', imgUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600' },
    { id: 'w3', headline: 'Canadian aid workers evacuated from conflict zone in Sudan', category: 'WORLD', time: '3 hours ago', imgUrl: 'https://images.unsplash.com/photo-1584531870082-6d06b4f83ca7?w=600' },
    { id: 'w4', headline: "Canada-EU trade pact enters new phase as CETA review concludes", category: 'WORLD', time: '4 hours ago', imgUrl: 'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=600' },
    { id: 'w5', headline: 'Canada pledges $300M in humanitarian aid for climate-affected nations', category: 'WORLD', time: '5 hours ago', imgUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600' },
  ],
};
