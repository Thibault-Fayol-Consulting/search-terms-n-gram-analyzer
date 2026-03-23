/**
 * --------------------------------------------------------------------------
 * Analyseur de N-Grammes de Termes de Recherche — Script Google Ads
 * --------------------------------------------------------------------------
 * Analyse les rapports de termes de recherche via GAQL pour identifier les
 * patterns de mots couteux (unigrammes, bigrammes, trigrammes). Classe les
 * resultats par cout decroissant et exporte par email et optionnellement Sheet.
 *
 * Auteur : Thibault Fayol — Thibault Fayol Consulting
 * Site   : https://thibaultfayol.com
 * Licence: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  NOTIFICATION_EMAIL: 'vous@exemple.com',
  SHEET_URL: '',
  NGRAM_SIZES: [1, 2, 3],
  MIN_COST: 5,
  MIN_IMPRESSIONS: 10,
  TOP_N: 50,
  DATE_RANGE: 'LAST_30_DAYS'
};

function main() {
  try {
    Logger.log('Analyseur de N-Grammes — demarrage');

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

    var report = 'Analyse N-Grammes\nCompte : ' + accountName +
      '\nDate : ' + today + '\nPeriode : ' + CONFIG.DATE_RANGE +
      '\nCout min : ' + CONFIG.MIN_COST + ' EUR\n\n';

    report += 'N-Gramme | Taille | Cout | Clics | Impr | Conv | Termes\n';
    report += '---------|--------|------|-------|------|------|-------\n';

    var sheetData = [['N-Gramme', 'Taille', 'Cout', 'Clics', 'Impressions', 'Conversions', 'Termes']];

    for (var j = 0; j < results.length; j++) {
      var r = results[j];
      report += r.text + ' | ' + r.size + '-gramme | ' + r.cost.toFixed(2) + ' EUR' +
        ' | ' + r.clicks + ' | ' + r.impressions + ' | ' + r.conversions.toFixed(1) +
        ' | ' + r.terms + '\n';
      sheetData.push([r.text, r.size + '-gramme', r.cost.toFixed(2), r.clicks, r.impressions, r.conversions.toFixed(1), r.terms]);
    }

    report += '\n' + (CONFIG.TEST_MODE ? '(MODE TEST)\n' : '');

    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL,
      '[Analyse N-Grammes] ' + accountName + ' — ' + results.length + ' patterns', report);

    if (!CONFIG.TEST_MODE && CONFIG.SHEET_URL && sheetData.length > 1) {
      var ss = SpreadsheetApp.openByUrl(CONFIG.SHEET_URL);
      var sheet = ss.getSheetByName('N-Grammes') || ss.insertSheet('N-Grammes');
      sheet.clearContents();
      sheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
    }

    Logger.log('Termine.');

  } catch (e) {
    Logger.log('ERREUR : ' + e.message);
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL,
      '[Analyse N-Grammes] Erreur', e.message + '\n' + e.stack);
  }
}
