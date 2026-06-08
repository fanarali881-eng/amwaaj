// Apply 25% discount to all product prices
(function() {
  'use strict';

  function applyDiscount() {
    // Find all price elements with class 'money'
    var moneyElements = document.querySelectorAll('.money');
    
    moneyElements.forEach(function(el) {
      // Skip if already processed
      if (el.getAttribute('data-discounted')) return;
      
      // Skip cart total prices
      if (el.closest('#am-cart__total--price') || el.closest('.cart-total__price')) return;
      
      var text = el.textContent.trim();
      if (!text) return;
      
      // Extract the numeric price and currency
      // Formats: "$395", "$395 USD", "KWD 33.880", "OMR 25.000", "AED 150", "SAR 200"
      var match = text.match(/([A-Z]{3})?\s*\$?([\d,.]+)\s*([A-Z]{3})?/);
      if (!match) return;
      
      var currencyBefore = match[1] || '';
      var priceStr = match[2];
      var currencyAfter = match[3] || '';
      var currency = currencyBefore || currencyAfter || 'USD';
      
      // Parse the price
      var price = parseFloat(priceStr.replace(/,/g, ''));
      if (isNaN(price) || price === 0) return;
      
      // Calculate discounted price (25% off)
      var discountedPrice = price * 0.75;
      
      // Format the discounted price
      var formattedDiscount;
      if (['KWD', 'BHD', 'OMR'].indexOf(currency) !== -1) {
        formattedDiscount = discountedPrice.toFixed(3);
      } else if (['AED', 'SAR'].indexOf(currency) !== -1) {
        formattedDiscount = Math.round(discountedPrice).toString();
      } else {
        formattedDiscount = Math.round(discountedPrice).toString();
      }
      
      // Build the new price display
      var symbol = '';
      if (currency === 'USD') {
        symbol = '$';
      }
      
      var oldPriceText = text;
      var newPriceText;
      
      if (symbol === '$') {
        newPriceText = '$' + formattedDiscount + (currencyAfter ? ' ' + currencyAfter : '');
      } else {
        newPriceText = currency + ' ' + formattedDiscount;
      }
      
      // Mark as processed
      el.setAttribute('data-discounted', 'true');
      
      // Replace the content: old price (red, strikethrough) + new price
      el.innerHTML = '<span style="color:#cc0000;text-decoration:line-through;font-size:0.85em;margin-right:6px;">' + oldPriceText + '</span>' +
                     '<span style="color:#000;font-weight:600;">' + newPriceText + '</span>';
    });
    
    // Also handle price-item--regular elements that show prices directly
    var priceItems = document.querySelectorAll('.am-price__price-item--regular');
    priceItems.forEach(function(el) {
      if (el.getAttribute('data-discounted')) return;
      var moneyEl = el.querySelector('.money');
      if (moneyEl && moneyEl.getAttribute('data-discounted')) {
        el.setAttribute('data-discounted', 'true');
        return;
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDiscount);
  } else {
    applyDiscount();
  }

  // Also run after a short delay to catch dynamically loaded content
  setTimeout(applyDiscount, 1000);
  setTimeout(applyDiscount, 3000);
  
  // Watch for dynamic content changes
  var observer = new MutationObserver(function(mutations) {
    var hasNewMoney = false;
    mutations.forEach(function(m) {
      if (m.addedNodes.length) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (node.querySelector && node.querySelector('.money'))) {
            hasNewMoney = true;
          }
        });
      }
    });
    if (hasNewMoney) {
      applyDiscount();
    }
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
