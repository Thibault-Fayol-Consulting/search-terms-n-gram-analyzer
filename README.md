# Search Terms N-Gram Analyzer

A Google Ads Script that analyzes search term reports to identify costly word patterns using n-gram analysis. Surfaces money-wasting unigrams, bigrams, and trigrams sorted by cost.

## What It Does

- Pulls all search terms with cost via GAQL
- Breaks each search term into configurable n-grams (1-word, 2-word, 3-word patterns)
- Aggregates cost, clicks, impressions, and conversions per n-gram
- Sorts by cost descending to surface the biggest money wasters
- Sends an email report and optionally exports to a Google Sheet

## Setup

1. In Google Ads, go to **Tools & Settings > Bulk Actions > Scripts**
2. Paste the contents of `main_en.gs` (or `main_fr.gs` for French)
3. Update the `CONFIG` values
4. Set `TEST_MODE` to `false` when ready
5. Schedule the script weekly

## CONFIG Reference

| Parameter            | Type    | Default        | Description                                              |
|----------------------|---------|----------------|----------------------------------------------------------|
| `TEST_MODE`          | Boolean | `true`         | No functional difference — report is always sent          |
| `NOTIFICATION_EMAIL` | String  | —              | Email address for the n-gram analysis report              |
| `SHEET_URL`          | String  | `''`           | Optional Google Sheet URL for export (empty = skip)       |
| `NGRAM_SIZES`        | Array   | `[1, 2, 3]`   | Which n-gram sizes to analyze                             |
| `MIN_COST`           | Number  | `5`            | Minimum aggregated cost to include an n-gram              |
| `MIN_IMPRESSIONS`    | Number  | `10`           | Minimum impressions to include                            |
| `TOP_N`              | Number  | `50`           | Number of top n-grams in the report                       |
| `DATE_RANGE`         | String  | `LAST_30_DAYS` | GAQL date range                                           |

## How It Works

1. Runs a GAQL query on `search_term_view`
2. Generates all n-grams of configured sizes from each term
3. Aggregates metrics per unique n-gram
4. Filters, sorts by cost, and takes top N
5. Sends email report and optionally writes to Sheet

## Requirements

- Google Ads account with Search campaigns
- Google Ads Scripts access

## License

MIT — Thibault Fayol Consulting
