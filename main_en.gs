/**
 * --------------------------------------------------------------------------
 * search-terms-n-gram-analyzer - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, LOOKBACK: "LAST_30_DAYS", COST_THRESHOLD: 10, NOTIFICATION_EMAIL: "contact@domain.com" };
function main() {
  Logger.log("Starting N-gram Analyzer...");
  var report = AdsApp.report("SELECT Query, Cost FROM SEARCH_QUERY_PERFORMANCE_REPORT WHERE Cost > " + CONFIG.COST_THRESHOLD + " AND Conversions = 0 DURING " + CONFIG.LOOKBACK);
  var rows = report.rows();
  var wordsCost = {};
  while(rows.hasNext()) {
    var row = rows.next();
    var words = row["Query"].split(" ");
    for(var i=0; i<words.length; i++) {
        var w = words[i];
        if(!wordsCost[w]) wordsCost[w] = 0;
        wordsCost[w] += parseFloat(row["Cost"]);
    }
  }
  Logger.log("Top wasting words:");
  for (var w in wordsCost) { if(wordsCost[w] > CONFIG.COST_THRESHOLD) Logger.log(w + ": $" + wordsCost[w]); }
}
