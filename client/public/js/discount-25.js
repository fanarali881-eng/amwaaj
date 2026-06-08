// Apply 25% discount to all product prices
// Runs AFTER currency conversion script finishes
(function() {
  'use strict';

  var DISCOUNT = 0.25; // 25% off

  function applyDiscount() {
    // Target the visible price elements - the ones that show the actual price to users
    // The currency converter targets: span.money, span.price, span.price-item
    // After conversion, it sets textContent to the formatted price like "KWD 33.880"
    
    // Get all money elements (these are the primary price display)
    var moneyElements = document.querySelectorAll('span.money');
    
    moneyElements.forEach(function(el) {
      // Skip if already processed
      if (el.getAttribute('data-discount-applied')) return;
      
      // Skip cart totals
      if (el.closest('#am-cart__total--price') || el.closest('.cart-total__price') || el.closest('.totals__total-value')) return;
      
      // Skip elements inside sale price spans (avoid double processing)
      var parent = el.closest('.price__sale');
      if (parent) {
        var saleSpan = parent.querySelector('.price-item--sale .money');
        var regularSpan = parent.querySelector('.price-item--regular .money, s .money');
        // Only process the sale price span, skip the regular one inside sale div
        if (el !== saleSpan && regularSpan === el) return;
      }
      
      var text = el.textContent.trim();
      if (!text) return;
      
      // Parse price from text like "KWD 33.880", "$395", "OMR 25.000", "$395 USD"
      var price = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(price) || price === 0) return;
      
      // Calculate discounted price
      var discountedPrice = price * (1 - DISCOUNT);
      
      // Determine currency format from the text
      var currencyMatch = text.match(/([A-Z]{3})/);
      var hasSymbol = text.indexOf('$') !== -1;
      var currency = currencyMatch ? currencyMatch[1] : (hasSymbol ? 'USD' : '');
      
      // Format prices
      var formattedOld = text;
      var formattedNew;
      
      if (['KWD', 'BHD', 'OMR'].indexOf(currency) !== -1) {
        formattedNew = currency + ' ' + discountedPrice.toFixed(3);
      } else if (hasSymbol) {
        formattedNew = '$' + Math.round(discountedPrice);
        if (text.indexOf('USD') !== -1) formattedNew += ' USD';
      } else if (currency === 'AED' || currency === 'SAR') {
        formattedNew = currency + ' ' + Math.round(discountedPrice);
      } else {
        formattedNew = Math.round(discountedPrice).toString();
      }
      
      // Mark as processed
      el.setAttribute('data-discount-applied', 'true');
      
      // Replace content with old price (red strikethrough) + new price + 25% badge
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.gap = '6px';
      el.style.flexWrap = 'wrap';
      el.innerHTML = '<span style="color:#cc0000;text-decoration:line-through;font-size:0.85em;">' + formattedOld + '</span>' +
                     '<span style="color:#000;font-weight:600;">' + formattedNew + '</span>' +
                     '<span style="background:#cc0000;color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:bold;white-space:nowrap;">-25%</span>';
    });

    // Also handle price elements that don't use .money class but show converted prices
    var priceItems = document.querySelectorAll('.am-price__price-item--regular');
    priceItems.forEach(function(el) {
      if (el.getAttribute('data-discount-applied')) return;
      var moneyEl = el.querySelector('.money');
      if (moneyEl && moneyEl.getAttribute('data-discount-applied')) {
        el.setAttribute('data-discount-applied', 'true');
      }
    });
  }

  // Wait for currency conversion to finish before applying discount
  // Currency conversion runs on DOMContentLoaded or shortly after
  function waitAndApply() {
    // Check if currency conversion has run (elements will have tm-price attribute)
    var moneyEls = document.querySelectorAll('span.money');
    if (moneyEls.length === 0) return;
    
    // Apply discount
    applyDiscount();
  }

  // Run multiple times with delays to ensure we catch prices after currency conversion
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(waitAndApply, 500);
      setTimeout(waitAndApply, 1500);
      setTimeout(waitAndApply, 3000);
      setTimeout(waitAndApply, 5000);
    });
  } else {
    setTimeout(waitAndApply, 500);
    setTimeout(waitAndApply, 1500);
    setTimeout(waitAndApply, 3000);
    setTimeout(waitAndApply, 5000);
  }

  // Watch for dynamic content changes (e.g. currency conversion updating prices)
  var observerStarted = false;
  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;
    
    var observer = new MutationObserver(function(mutations) {
      var shouldReapply = false;
      mutations.forEach(function(m) {
        if (m.type === 'characterData' || m.type === 'childList') {
          var target = m.target;
          if (target.nodeType === 3) target = target.parentElement;
          if (target && target.classList && (target.classList.contains('money') || target.closest && target.closest('.money'))) {
            if (!target.getAttribute('data-discount-applied')) {
              shouldReapply = true;
            }
          }
        }
      });
      if (shouldReapply) {
        setTimeout(applyDiscount, 100);
      }
    });
    
    observer.observe(document.body || document.documentElement, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
