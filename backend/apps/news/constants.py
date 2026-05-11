SECTION_DEFINITIONS = [
    # ── News ────────────────────────────────────────────────────────────────────
    {"slug": "politics",            "label": "Politics",            "code": "POLITICS",         "rss_url": "https://www.cbc.ca/cmlink/rss-politics"},
    {"slug": "world",               "label": "World",               "code": "WORLD",            "rss_url": "https://www.cbc.ca/cmlink/rss-world"},
    {"slug": "indigenous",          "label": "Indigenous",          "code": "INDIGENOUS",       "rss_url": "https://www.cbc.ca/cmlink/rss-indigenous"},
    # ── Life & Society ──────────────────────────────────────────────────────────
    {"slug": "business",            "label": "Business",            "code": "BUSINESS",         "rss_url": "https://www.cbc.ca/cmlink/rss-business"},
    {"slug": "health",              "label": "Health",              "code": "HEALTH",           "rss_url": "https://www.cbc.ca/cmlink/rss-health"},
    {"slug": "education-in-canada", "label": "Education in Canada", "code": "EDUCATION",        "rss_url": "https://www.universityaffairs.ca/feed/"},
    {"slug": "events",              "label": "Events",              "code": "EVENTS",           "rss_url": "https://www.eventbrite.ca/rss/"},
    # ── Tech, Auto & Aviation ───────────────────────────────────────────────────
    {"slug": "technology",          "label": "Technology",          "code": "TECHNOLOGY",       "rss_url": "https://www.cbc.ca/cmlink/rss-technology"},
    {"slug": "auto-news",           "label": "Auto News",           "code": "AUTO_NEWS",        "rss_url": "https://globalnews.ca/autos/feed/"},
    {"slug": "aviation",            "label": "Aviation",            "code": "AVIATION",         "rss_url": "https://www.aviationpros.com/rss/"},
    # ── Immigration & Opportunities ─────────────────────────────────────────────
    {"slug": "immigration",         "label": "Immigration",         "code": "IMMIGRATION",      "rss_url": "https://www.canada.ca/en/immigration-refugees-citizenship/news.rss"},
    {"slug": "opportunities",       "label": "Opportunities",       "code": "OPPORTUNITIES",    "rss_url": "https://www.canada.ca/en/employment-social-development/news.rss"},
    # ── Culture & Community ─────────────────────────────────────────────────────
    {"slug": "sports",              "label": "Sports",              "code": "SPORTS",           "rss_url": "https://www.cbc.ca/cmlink/rss-sports"},
    {"slug": "entertainment",       "label": "Entertainment",       "code": "ENTERTAINMENT",    "rss_url": "https://www.cbc.ca/cmlink/rss-entertainment"},
    {"slug": "blacks-in-canada",    "label": "Blacks in Canada",    "code": "BLACKS_IN_CANADA", "rss_url": "https://www.blackcanadians.ca/feed/"},
]

# Additional multi-source RSS feeds for broader coverage
EXTRA_RSS_FEEDS = [
    # ── General / Top Stories ────────────────────────────────────────────────
    {"feed_key": "globalnews-top",      "label": "Global News",           "category": "GENERAL",         "url": "https://globalnews.ca/feed/"},
    {"feed_key": "nationalpost",        "label": "National Post",         "category": "GENERAL",         "url": "https://nationalpost.com/feed/"},
    {"feed_key": "thestar",             "label": "Toronto Star",          "category": "GENERAL",         "url": "https://www.thestar.com/content/thestar/feed.rss.xml"},
    {"feed_key": "ctvnews",             "label": "CTV News",              "category": "GENERAL",         "url": "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822731"},

    # ── Politics ─────────────────────────────────────────────────────────────
    {"feed_key": "globalnews-politics", "label": "Global News Politics",  "category": "POLITICS",        "url": "https://globalnews.ca/politics/feed/"},
    {"feed_key": "nationalpost-politics","label": "NP Politics",          "category": "POLITICS",        "url": "https://nationalpost.com/category/news/politics/feed/"},

    # ── Business / Economy ───────────────────────────────────────────────────
    {"feed_key": "globalnews-money",    "label": "Global News Money",     "category": "BUSINESS",        "url": "https://globalnews.ca/money/feed/"},
    {"feed_key": "financialpost",       "label": "Financial Post",        "category": "BUSINESS",        "url": "https://financialpost.com/feed/"},

    # ── Health ───────────────────────────────────────────────────────────────
    {"feed_key": "globalnews-health",   "label": "Global News Health",    "category": "HEALTH",          "url": "https://globalnews.ca/health/feed/"},
    {"feed_key": "canada-health",       "label": "Health Canada",         "category": "HEALTH",          "url": "https://www.canada.ca/en/public-health/news.rss"},

    # ── Sports ───────────────────────────────────────────────────────────────
    {"feed_key": "globalnews-sports",   "label": "Global News Sports",    "category": "SPORTS",          "url": "https://globalnews.ca/sports/feed/"},
    {"feed_key": "sportsnet",           "label": "Sportsnet",             "category": "SPORTS",          "url": "https://www.sportsnet.ca/feed/"},

    # ── Technology ───────────────────────────────────────────────────────────
    {"feed_key": "mobilesyrup",         "label": "MobileSyrup",           "category": "TECHNOLOGY",      "url": "https://mobilesyrup.com/feed/"},
    {"feed_key": "itworldca",           "label": "IT World Canada",       "category": "TECHNOLOGY",      "url": "https://www.itworldcanada.com/feed"},

    # ── Immigration ──────────────────────────────────────────────────────────
    {"feed_key": "cbc-immigration",     "label": "CBC Immigration",       "category": "IMMIGRATION",     "url": "https://www.cbc.ca/cmlink/rss-canada"},
    {"feed_key": "cicnews",             "label": "CIC News Immigration",  "category": "IMMIGRATION",     "url": "https://www.cicnews.com/feed"},

    # ── Aviation ─────────────────────────────────────────────────────────────
    {"feed_key": "ch-aviation",         "label": "CH Aviation",           "category": "AVIATION",        "url": "https://www.ch-aviation.com/portal/rss/"},
    {"feed_key": "avweb",               "label": "AVweb Canada",          "category": "AVIATION",        "url": "https://www.avweb.com/feed/"},

    # ── Education ────────────────────────────────────────────────────────────
    {"feed_key": "canada-education-gov","label": "Canada Education Gov",  "category": "EDUCATION",       "url": "https://www.canada.ca/en/employment-social-development/news.rss"},
    {"feed_key": "macleans-education",  "label": "Macleans Education",    "category": "EDUCATION",       "url": "https://macleans.ca/education/feed/"},

    # ── Events ───────────────────────────────────────────────────────────────
    {"feed_key": "cbc-arts-events",     "label": "CBC Arts & Events",     "category": "EVENTS",          "url": "https://www.cbc.ca/cmlink/rss-arts"},
    {"feed_key": "canada-events-gov",   "label": "Canada Events Gov",     "category": "EVENTS",          "url": "https://www.canada.ca/en/canadian-heritage/news.rss"},

    # ── Auto News ────────────────────────────────────────────────────────────
    {"feed_key": "driving-ca",          "label": "Driving.ca",            "category": "AUTO_NEWS",       "url": "https://driving.ca/feed/"},
    {"feed_key": "motortrend-canada",   "label": "MotorTrend Canada",     "category": "AUTO_NEWS",       "url": "https://www.motortrend.com/rss/news/"},

    # ── Blacks in Canada ─────────────────────────────────────────────────────
    {"feed_key": "cbc-black-canada",    "label": "CBC Black Canada",      "category": "BLACKS_IN_CANADA","url": "https://www.cbc.ca/cmlink/rss-canada"},

    # ── Indigenous ───────────────────────────────────────────────────────────
    {"feed_key": "aptn",                "label": "APTN National News",    "category": "INDIGENOUS",      "url": "https://www.aptnnews.ca/feed/"},

    # ── World ────────────────────────────────────────────────────────────────
    {"feed_key": "globalnews-world",    "label": "Global News World",     "category": "WORLD",           "url": "https://globalnews.ca/world/feed/"},
    {"feed_key": "nationalpost-world",  "label": "NP World",              "category": "WORLD",           "url": "https://nationalpost.com/category/news/world/feed/"},

    # ── Entertainment ────────────────────────────────────────────────────────
    {"feed_key": "etcanada",            "label": "ET Canada",             "category": "ENTERTAINMENT",   "url": "https://etcanada.com/feed/"},

    # ── Opportunities ────────────────────────────────────────────────────────
    {"feed_key": "canada-jobs-gov",     "label": "Canada Jobs Gov",       "category": "OPPORTUNITIES",   "url": "https://www.canada.ca/en/treasury-board-secretariat/news.rss"},
]

RSS_FEEDS = [
    {"feed_key": "top-stories", "label": "Top Stories", "category": "GENERAL", "url": "https://www.cbc.ca/cmlink/rss-topstories"},
    *[
        {
            "feed_key": item["slug"],
            "label": item["label"],
            "category": item["code"],
            "url": item["rss_url"],
        }
        for item in SECTION_DEFINITIONS
        if item["rss_url"]
    ],
    *EXTRA_RSS_FEEDS,
]

SECTION_BY_SLUG  = {item["slug"]: item for item in SECTION_DEFINITIONS}
SECTION_BY_CODE  = {item["code"]: item for item in SECTION_DEFINITIONS}
CATEGORY_LABEL_TO_CODE = {item["label"].lower(): item["code"] for item in SECTION_DEFINITIONS}
CATEGORY_LABEL_TO_CODE.update(
    {
        "top stories": "GENERAL",
        "canada": "GENERAL",
        "general": "GENERAL",
        "education": "EDUCATION",
        "auto": "AUTO_NEWS",
        "autos": "AUTO_NEWS",
        "automotive": "AUTO_NEWS",
        "aviation": "AVIATION",
        "black canadians": "BLACKS_IN_CANADA",
        "blacks in canada": "BLACKS_IN_CANADA",
        "opportunities": "OPPORTUNITIES",
        "jobs": "OPPORTUNITIES",
        "jobs & careers": "OPPORTUNITIES",
        "scholarships": "OPPORTUNITIES",
        "grants": "OPPORTUNITIES",
        "immigration": "IMMIGRATION",
        "nation": "POLITICS",
        "breaking-news": "GENERAL",
        "money": "BUSINESS",
        "arts": "ENTERTAINMENT",
        "science": "TECHNOLOGY",
    }
)
