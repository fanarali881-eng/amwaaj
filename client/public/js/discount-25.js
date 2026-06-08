/**
 * 25% Discount Display - v3
 * Shows old price (strikethrough) + new discounted price + -25% badge
 * 
 * After page load, the custom updatePrices() function converts span.money elements
 * to "KWD 33.880" text (removing the span.money child). On desktop, Booster Apps
 * may also modify prices. This script handles ALL scenarios.
 */
(function() {
  'use strict';
  var DISCOUNT = 0.25;
  var DONE = 'data-disc25';

  function applyTo(el) {
    if (!el || el.getAttribute(DONE)) return;
    // Get visible text
    var text = el.textContent.trim();
    if (!text || text.length < 2) return;
    // Must contain a number
    var m = text.match(/([\d]+[.,]?[\d]*)/);
    if (!m) return;
    var num = parseFloat(m[1].replace(/,/g, ''));
    if (!num || num <= 0) return;
    // Get prefix (currency) and format
    var idx = text.indexOf(m[1]);
    var prefix = text.substring(0, idx).trim();
    var after = text.substring(idx + m[1].length).trim();
    // Discount
    var dec = m[1].indexOf('.') > -1 ? m[1].split('.')[1].length : 0;
    var newNum = (num * (1 - DISCOUNT)).toFixed(dec);
    var oldTxt = text;
    var newTxt = (prefix ? prefix + ' ' : '') + newNum + (after ? ' ' + after : '');
    // Apply
    el.setAttribute(DONE, '1');
    el.innerHTML =
      '<span style="color:#c00;text-decoration:line-through;font-size:0.85em;white-space:nowrap;">' + oldTxt + '</span> ' +
      '<span style="font-weight:600;margin-left:4px;white-space:nowrap;">' + newTxt + '</span> ' +
      '<span style="background:#c00;color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:bold;margin-left:4px;white-space:nowrap;">-25%</span>';
  }

  function run() {
    // Target 1: span.money with actual price (before updatePrices converts them)
    document.querySelectorAll('span.money').forEach(function(el) {
      if (el.getAttribute(DONE)) return;
      var n = parseFloat(el.textContent.replace(/[^\d.]/g, ''));
      if (n > 0) applyTo(el);
    });

    // Target 2: The regular price span (after updatePrices sets textContent)
    document.querySelectorAll('span.am-price__price-item--regular').forEach(function(el) {
      if (el.getAttribute(DONE)) return;
      // Skip if it has an un-processed span.money child
      var mc = el.querySelector('span.money');
      if (mc && !mc.getAttribute(DONE)) return;
      var t = el.textContent.trim();
      if (t && parseFloat(t.replace(/[^\d.]/g, '')) > 0) applyTo(el);
    });

    // Target 3: Elements marked by Booster Apps
    document.querySelectorAll('[data-original-usd-price]').forEach(function(el) {
      if (el.getAttribute(DONE)) return;
      if (parseFloat(el.getAttribute('data-original-usd-price')) <= 0) return;
      // Only apply if this element is a direct price display (not a container)
      if (el.classList.contains('am-price__price-item--regular') ||
          el.classList.contains('money') ||
          (el.classList.contains('price-item') && el.classList.contains('price-item--sale'))) {
        var t = el.textContent.trim();
        if (t && parseFloat(t.replace(/[^\d.]/g, '')) > 0) applyTo(el);
      }
    });

    // Target 4: Product detail page price (single product pages may use different structure)
    document.querySelectorAll('.product__price .price-item--regular, .product-price .money').forEach(function(el) {
      if (el.getAttribute(DONE)) return;
      var t = el.textContent.trim();
      if (t && parseFloat(t.replace(/[^\d.]/g, '')) > 0) applyTo(el);
    });
  }

  // Hide duplicate sale price section to avoid showing discount twice
  function hideSaleDuplicates() {
    document.querySelectorAll('.price__sale').forEach(function(saleDiv) {
      var container = saleDiv.closest('.am-price__container');
      if (!container) return;
      var regularDiv = container.querySelector('.am-price__price__regular');
      if (regularDiv) {
        var regPrice = regularDiv.textContent.replace(/[^\d.]/g, '');
        var salePrice = saleDiv.textContent.replace(/[^\d.]/g, '');
        // If regular and sale show same price, hide sale section
        if (regPrice === salePrice && regPrice.length > 0) {
          saleDiv.style.display = 'none';
        }
      }
    });
  }

  // MutationObserver for when Booster Apps or updatePrices changes things after our script
  function watch() {
    var timer = null;
    new MutationObserver(function(muts) {
      var dominated = false;
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (t && t.nodeType === 3) t = t.parentElement;
        if (!t || !t.getAttribute) continue;
        // Check if our work was overwritten
        if (t.getAttribute(DONE) === '1' && t.innerHTML.indexOf('data-disc25') === -1 && t.innerHTML.indexOf('line-through') === -1) {
          t.removeAttribute(DONE);
          dominated = true;
        }
        if (t.parentElement && t.parentElement.getAttribute && t.parentElement.getAttribute(DONE) === '1') {
          if (t.parentElement.innerHTML.indexOf('line-through') === -1) {
            t.parentElement.removeAttribute(DONE);
            dominated = true;
          }
        }
      }
      if (dominated) {
        clearTimeout(timer);
        timer = setTimeout(function() { run(); hideSaleDuplicates(); }, 100);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    run();
    hideSaleDuplicates();
    setTimeout(function() { run(); hideSaleDuplicates(); }, 300);
    setTimeout(function() { run(); hideSaleDuplicates(); }, 800);
    setTimeout(function() { run(); hideSaleDuplicates(); }, 1500);
    setTimeout(function() { run(); hideSaleDuplicates(); }, 3000);
    setTimeout(function() { run(); hideSaleDuplicates(); }, 5000);
    setTimeout(function() { run(); hideSaleDuplicates(); }, 8000);
    watch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
