// Apply 25% discount to all product prices
// Strategy: Don't modify .money innerHTML (currency converter overwrites it)
// Instead: Style .money with red strikethrough via CSS, add a sibling element with discounted price
(function() {
  'use strict';

  var DISCOUNT = 0.25;

  // Add CSS styles for the discount display
  var style = document.createElement('style');
  style.textContent = [
    'span.money[data-discount-applied] {',
    '  color: #cc0000 !important;',
    '  text-decoration: line-through !important;',
    '  font-size: 0.85em !important;',
    '}',
    '.discount-new-price {',
    '  color: #000 !important;',
    '  font-weight: 600 !important;',
    '  margin-left: 6px;',
    '  font-size: 1em;',
    '}',
    '.discount-badge {',
    '  background: #cc0000;',
    '  color: #fff !important;',
    '  font-size: 10px;',
    '  padding: 2px 5px;',
    '  border-radius: 3px;',
    '  font-weight: bold;',
    '  margin-left: 6px;',
    '  white-space: nowrap;',
    '  display: inline-block;',
    '}',
    '.price-discount-wrapper {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 4px;',
    '  flex-wrap: wrap;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  function applyDiscount() {
    var moneyElements = document.querySelectorAll('span.money');
    
    moneyElements.forEach(function(el) {
      // Skip if already processed
      if (el.getAttribute('data-discount-applied')) return;
      
      // Skip cart totals and checkout totals
      if (el.closest('#am-cart__total--price') || el.closest('.cart-total__price') || el.closest('.totals__total-value')) return;
      
      // Skip $0 prices
      var text = el.textContent.trim();
      if (!text || text === '$0') return;
      
      // Parse the price
      var priceNum = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(priceNum) || priceNum === 0) return;
      
      // Determine currency
      var currencyMatch = text.match(/([A-Z]{3})/);
      var hasSymbol = text.indexOf('$') !== -1;
      var currency = currencyMatch ? currencyMatch[1] : (hasSymbol ? 'USD' : '');
      
      // Calculate discounted price
      var discountedPrice = priceNum * (1 - DISCOUNT);
      
      // Format the new price
      var formattedNew;
      if (['KWD', 'BHD', 'OMR'].indexOf(currency) !== -1) {
        formattedNew = currency + ' ' + discountedPrice.toFixed(3);
      } else if (hasSymbol && !currencyMatch) {
        formattedNew = '$' + Math.round(discountedPrice);
      } else if (hasSymbol && currency === 'USD') {
        formattedNew = '$' + Math.round(discountedPrice) + ' USD';
      } else if (currency) {
        formattedNew = currency + ' ' + Math.round(discountedPrice);
      } else {
        formattedNew = Math.round(discountedPrice).toString();
      }
      
      // Mark as processed
      el.setAttribute('data-discount-applied', 'true');
      
      // Check if sibling elements already exist (avoid duplicates)
      var parent = el.parentElement;
      if (parent.querySelector('.discount-new-price')) return;
      
      // Create wrapper if parent isn't already a flex container
      // Add new price element after the .money span
      var newPriceEl = document.createElement('span');
      newPriceEl.className = 'discount-new-price';
      newPriceEl.textContent = formattedNew;
      
      var badgeEl = document.createElement('span');
      badgeEl.className = 'discount-badge';
      badgeEl.textContent = '-25%';
      
      // Insert after the money element
      if (el.nextSibling) {
        parent.insertBefore(newPriceEl, el.nextSibling);
        parent.insertBefore(badgeEl, newPriceEl.nextSibling);
      } else {
        parent.appendChild(newPriceEl);
        parent.appendChild(badgeEl);
      }
      
      // Make parent flex if needed
      parent.style.display = 'inline-flex';
      parent.style.alignItems = 'center';
      parent.style.gap = '4px';
      parent.style.flexWrap = 'wrap';
    });
  }

  // Also need to UPDATE the discounted prices when currency conversion changes them
  function updateDiscountedPrices() {
    var moneyElements = document.querySelectorAll('span.money[data-discount-applied]');
    
    moneyElements.forEach(function(el) {
      var text = el.textContent.trim();
      if (!text || text === '$0') return;
      
      var priceNum = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(priceNum) || priceNum === 0) return;
      
      var currencyMatch = text.match(/([A-Z]{3})/);
      var hasSymbol = text.indexOf('$') !== -1;
      var currency = currencyMatch ? currencyMatch[1] : (hasSymbol ? 'USD' : '');
      
      var discountedPrice = priceNum * (1 - DISCOUNT);
      
      var formattedNew;
      if (['KWD', 'BHD', 'OMR'].indexOf(currency) !== -1) {
        formattedNew = currency + ' ' + discountedPrice.toFixed(3);
      } else if (hasSymbol && !currencyMatch) {
        formattedNew = '$' + Math.round(discountedPrice);
      } else if (hasSymbol && currency === 'USD') {
        formattedNew = '$' + Math.round(discountedPrice) + ' USD';
      } else if (currency) {
        formattedNew = currency + ' ' + Math.round(discountedPrice);
      } else {
        formattedNew = Math.round(discountedPrice).toString();
      }
      
      // Update the sibling new price element
      var parent = el.parentElement;
      var newPriceEl = parent.querySelector('.discount-new-price');
      if (newPriceEl) {
        newPriceEl.textContent = formattedNew;
      }
    });
  }

  // Run at various intervals to catch prices after currency conversion
  function runAll() {
    applyDiscount();
    updateDiscountedPrices();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(runAll, 100);
      setTimeout(runAll, 500);
      setTimeout(runAll, 1000);
      setTimeout(runAll, 2000);
      setTimeout(runAll, 3000);
      setTimeout(runAll, 5000);
    });
  } else {
    setTimeout(runAll, 100);
    setTimeout(runAll, 500);
    setTimeout(runAll, 1000);
    setTimeout(runAll, 2000);
    setTimeout(runAll, 3000);
    setTimeout(runAll, 5000);
  }

  // Watch for text changes in .money elements (currency conversion updates)
  var observer = new MutationObserver(function(mutations) {
    var needsUpdate = false;
    var needsNew = false;
    mutations.forEach(function(m) {
      var target = m.target;
      if (target.nodeType === 3) target = target.parentElement;
      if (!target) return;
      
      if (target.classList && target.classList.contains('money')) {
        if (target.getAttribute('data-discount-applied')) {
          needsUpdate = true;
        } else {
          needsNew = true;
        }
      }
      // Check for new .money elements added
      if (m.addedNodes && m.addedNodes.length) {
        for (var i = 0; i < m.addedNodes.length; i++) {
          var node = m.addedNodes[i];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('money')) needsNew = true;
            if (node.querySelector && node.querySelector('.money')) needsNew = true;
          }
        }
      }
    });
    
    if (needsUpdate) {
      setTimeout(updateDiscountedPrices, 50);
    }
    if (needsNew) {
      setTimeout(applyDiscount, 50);
    }
  });

  function startObserver() {
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
