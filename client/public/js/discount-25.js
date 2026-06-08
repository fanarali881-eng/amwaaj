/**
 * 25% Discount Display
 * Applies discount display after any currency conversion
 * Works on both mobile and desktop
 */
(function() {
  'use strict';
  
  var DISCOUNT = 0.25;
  var processing = false;
  
  function applyDiscountToElement(el) {
    // Skip if already has discount applied
    if (el.getAttribute('data-discounted') === '1') return;
    // Skip if element contains HTML (already processed)
    if (el.children && el.children.length > 0) return;
    
    var text = el.textContent.trim();
    if (!text) return;
    
    // Extract number from price text like "KWD 33.880" or "$110"
    var match = text.match(/[\d,.]+/);
    if (!match) return;
    
    var price = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(price) || price <= 0) return;
    
    // Get currency symbol/prefix
    var prefix = text.replace(match[0], '').trim();
    
    // Calculate discounted price
    var discounted = price * (1 - DISCOUNT);
    
    // Format with same decimal places as original
    var decimals = 0;
    if (match[0].indexOf('.') !== -1) {
      decimals = match[0].split('.')[1].length;
    }
    var discountedStr = discounted.toFixed(decimals);
    
    // Build new price display
    var oldPriceText = text;
    var newPriceText = prefix ? (prefix + ' ' + discountedStr) : ('$' + discountedStr);
    
    processing = true;
    el.setAttribute('data-discounted', '1');
    el.innerHTML = '<span style="color:#cc0000;text-decoration:line-through;font-size:0.85em;">' + oldPriceText + '</span> <span style="font-weight:600;margin-left:6px;">' + newPriceText + '</span> <span style="background:#cc0000;color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:bold;margin-left:6px;">-25%</span>';
    processing = false;
  }
  
  function applyDiscountAll() {
    var elements = document.querySelectorAll('span.money');
    elements.forEach(function(el) {
      applyDiscountToElement(el);
    });
  }
  
  // Watch for changes to price elements (from Booster Apps or other converters)
  function observePrices() {
    var observer = new MutationObserver(function(mutations) {
      if (processing) return;
      mutations.forEach(function(mutation) {
        var el = mutation.target;
        if (el.classList && el.classList.contains('money')) {
          // Price was changed by external script, re-apply discount
          el.removeAttribute('data-discounted');
          setTimeout(function() { applyDiscountToElement(el); }, 50);
        } else if (el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('money')) {
          el.parentElement.removeAttribute('data-discounted');
          setTimeout(function() { applyDiscountToElement(el.parentElement); }, 50);
        }
      });
    });
    
    // Observe the entire document for price changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  // Run after page loads and currency conversion finishes
  function init() {
    // Initial apply after a delay to let currency converters finish
    setTimeout(applyDiscountAll, 1500);
    setTimeout(applyDiscountAll, 3000);
    setTimeout(applyDiscountAll, 5000);
    
    // Also observe for future changes
    observePrices();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
