/**
 * --------------------------------------------------------------------------
 * Search Terms N-Gram Analyzer — Google Ads Script
 * --------------------------------------------------------------------------
 * Analyzes search term reports using GAQL to identify costly n-gram patterns
 * (unigrams, bigrams, trigrams). Surfaces money-wasting word patterns sorted
 * by cost, and exports results via email and optionally to a Google Sheet.
 *
 * Author : Thibault Fayol — Thibault Fayol Consulting
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  NOTIFICATION_EMAIL: 'you@example.com',
  SHEET_URL: '',
  NGRAM_SIZES: [1, 2, 3],
  MIN_COST: 5,
  MIN_IMPRESSIONS: 10,
  TOP_N: 50,
  DATE_RANGE: 'LAST_30_DAYS'
};

function main() {
  try {
    Logger.log('Search Terms N-Gram Analyzer — start');

    var tz = AdsApp.currentAccount().getTimeZone();
    var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var accountName = AdsApp.currentAccount().getName();

    var query =
      'SELECT search_term_view.search_term, ' +
      'metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions ' +
      'FROM search_term_view ' +
      'WHERE metrics.cost_micros > 0 ' +
      'AND segments.date DURING ' + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var ngrams = {};

    while (rows.hasNext()) {
      var row = rows.next();
      var term = row.searchTermView.searchTerm.toLowerCase();
      var cost = row.metrics.costMicros / 1000000;
      var clicks = row.metrics.clicks;
      var impressions = row.metrics.impressions;
      var conversions = row.metrics.conversions;

      var words = term.split(/\s+/);

      for (var s = 0; s < CONFIG.NGRAM_SIZES.length; s++) {
        var size = CONFIG.NGRAM_SIZES[s];
        for (var i = 0; i <= words.length - size; i++) {
          var gram = words.slice(i, i + size).join(' ');
          var key = size + '_' + gram;

          if (!ngrams[key]) {
            ngrams[key] = { text: gram, size: size, cost: 0, clicks: 0, impressions: 0, conversions: 0, terms: 0 };
          }
          ngrams[key].cost += cost;
          ngrams[key].clicks += clicks;
          ngrams[key].impressions += impressions;
          ngrams[key].conversions += conversions;
          ngrams[key].terms++;
        }
      }
    }

    var results = [];
    for (var k in ngrams) {
      var ng = ngrams[k];
      if (ng.cost >= CONFIG.MIN_COST && ng.impressions >= CONFIG.MIN_IMPRESSIONS) {
        results.push(ng);
      }
    }

    results.sort(function(a, b) { return b.cost - a.cost; });
    results = results.slice(0, CONFIG.TOP_N);

    Logger.log('Found ' + results.length + ' n-grams above threshold.');

    var report = 'Search Terms N-Gram Analysis\n' +
      'Account: ' + accountName + '\nDate: ' + today +
      '\nPeriod: ' + CONFIG.DATE_RANGE +
      '\nMin cost: $' + CONFIG.MIN_COST + '\n\n';

    report += 'N-Gram | Size | Cost | Clicks | Impr | Conv | Terms\n';
    report += '-------|------|------|--------|------|------|------\n';

    var sheetData = [['N-Gram', 'Size', 'Cost', 'Clicks', 'Impressions', 'Conversions', 'Terms']];

    for (var j = 0; j < results.length; j++) {
      var r = results[j];
      report += r.text + ' | ' + r.size + '-gram | $' + r.cost.toFixed(2) +
        ' | ' + r.clicks + ' | ' + r.impressions + ' | ' + r.conversions.toFixed(1) +
        ' | ' + r.terms + '\n';
      sheetData.push([r.text, r.size + '-gram', r.cost.toFixed(2), r.clicks, r.impressions, r.conversions.toFixed(1), r.terms]);
    }

    report += '\n' + (CONFIG.TEST_MODE ? '(TEST MODE)\n' : '');

    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL,
      '[N-Gram Analysis] ' + accountName + ' — ' + results.length + ' patterns', report);

    if (!CONFIG.TEST_MODE && CONFIG.SHEET_URL && sheetData.length > 1) {
      var ss = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL);
      var sheet = ss.getSheetByName('N-Grams') || ss.insertSheet('N-Grams');
      sheet.clearContents();
      sheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
    }

    Logger.log('Done.');

  } catch (e) {
    Logger.log('ERROR: ' + e.message);
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL,
      '[N-Gram Analysis] Error', e.message + '\n' + e.stack);
  }
}
