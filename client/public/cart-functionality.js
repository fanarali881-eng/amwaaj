/**
 * Amouage Cart Drawer Functionality
 * Handles: Add to bag, cart drawer open/close, quantity controls, remove items, cart count badge
 * Uses localStorage for persistence (no backend)
 */
(function() {
  'use strict';

  // ==================== CART STORAGE ====================
  function migrateCart() {
    // Clean up corrupted cart data from old discount script
    try {
      var cart = JSON.parse(localStorage.getItem('amouage_cart') || '[]');
      var changed = false;
      for (var i = 0; i < cart.length; i++) {
        var p = cart[i].price || '';
        // If price contains '-25%' or multiple numbers (corrupted by old discount script)
        if (p.indexOf('-25%') !== -1 || (p.match(/[\d,.]+/g) || []).length > 1) {
          // Extract just the first price number (original price)
          var nums = p.match(/[\d,.]+/g);
          var currency = p.match(/^[^\d]*/)[0] || '';
          if (nums && nums.length >= 1) {
            cart[i].price = currency + nums[0];
            cart[i].priceNum = parseFloat(nums[0].replace(/,/g, '')) || 0;
            changed = true;
          }
        }
      }
      if (changed) {
        localStorage.setItem('amouage_cart', JSON.stringify(cart));
      }
    } catch(e) {}
  }
  migrateCart();

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('amouage_cart') || '[]');
    } catch(e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('amouage_cart', JSON.stringify(cart));
  }

  // ==================== CART BADGE ====================
  function updateCartBadge() {
    var cart = getCart();
    var totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    var cartIcon = document.getElementById('cart-icon-bubble');
    if (!cartIcon) return;

    // Remove existing badge
    var existingBadge = cartIcon.querySelector('.cart-count-badge');
    if (existingBadge) existingBadge.remove();

    if (totalItems > 0) {
      var badge = document.createElement('span');
      badge.className = 'cart-count-badge';
      badge.textContent = totalItems;
      badge.style.cssText = 'position:absolute;top:-4px;right:-8px;background:#000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:600;line-height:1;pointer-events:none;';
      cartIcon.style.position = 'relative';
      cartIcon.appendChild(badge);
    }
  }

  // ==================== CART DRAWER OPEN/CLOSE ====================
  function openCartDrawer() {
    var cartDrawer = document.querySelector('cart-drawer');
    var cartDrawerDiv = document.getElementById('CartDrawer');
    if (!cartDrawer || !cartDrawerDiv) return;

    cartDrawer.classList.remove('is-empty');
    cartDrawer.classList.add('active');
    cartDrawerDiv.classList.add('active');
    document.body.classList.add('overflow-hidden');

    // Show/hide empty state vs items
    var cart = getCart();
    var emptyDiv = cartDrawer.querySelector('.drawer__inner-empty');
    var headerDiv = cartDrawer.querySelector('.drawer__header');
    var itemsDiv = document.querySelector('cart-drawer-items');
    var footerDiv = cartDrawer.querySelector('.drawer__footer');

    if (cart.length === 0) {
      cartDrawer.classList.add('is-empty');
      if (emptyDiv) emptyDiv.style.display = '';
      if (headerDiv) headerDiv.style.display = 'none';
      if (itemsDiv) itemsDiv.style.display = 'none';
      if (footerDiv) footerDiv.style.display = 'none';
    } else {
      if (emptyDiv) emptyDiv.style.display = 'none';
      if (headerDiv) headerDiv.style.display = '';
      if (itemsDiv) { itemsDiv.style.display = ''; itemsDiv.classList.remove('is-empty'); }
      if (footerDiv) footerDiv.style.display = '';
    }
  }

  function closeCartDrawer() {
    var cartDrawer = document.querySelector('cart-drawer');
    var cartDrawerDiv = document.getElementById('CartDrawer');
    if (!cartDrawer || !cartDrawerDiv) return;

    cartDrawer.classList.remove('active');
    cartDrawerDiv.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  }

  // ==================== RENDER CART ITEMS ====================
  function renderCartItems() {
    var cart = getCart();
    var container = document.getElementById('CartDrawer-CartItems');
    if (!container) return;

    // Keep the visually-hidden status elements
    var statusHTML = '<p id="CartDrawer-LiveRegionText" class="visually-hidden" role="status"></p><p id="CartDrawer-LineItemStatus" class="visually-hidden" aria-hidden="true" role="status">Loading...</p>';

    if (cart.length === 0) {
      container.innerHTML = statusHTML;
      // Disable checkout button
      var checkoutBtn = document.getElementById('CartDrawer-Checkout');
      if (checkoutBtn) checkoutBtn.disabled = true;
      updateSubtotal();
      return;
    }

    var itemsHTML = statusHTML + '<div class="cart-drawer__items">';
    
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      itemsHTML += '<div class="cart-item" data-index="' + i + '" style="display:flex;gap:16px;padding:20px 0;border-bottom:1px solid #e5e5e5;">';
      itemsHTML += '<div class="cart-item__media" style="width:90px;min-width:90px;">';
      itemsHTML += '<img src="' + item.image + '" alt="' + item.name + '" style="width:100%;height:auto;object-fit:contain;">';
      itemsHTML += '</div>';
      itemsHTML += '<div class="cart-item__details" style="flex:1;display:flex;flex-direction:column;gap:6px;">';
      itemsHTML += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
      itemsHTML += '<a href="' + (item.url || '#') + '" class="cart-item__name" style="font-size:14px;font-weight:500;color:#000;text-decoration:none;letter-spacing:0.5px;">' + item.name + '</a>';
      itemsHTML += '<button class="cart-item__remove" data-index="' + i + '" style="background:none;border:none;cursor:pointer;padding:4px;line-height:1;" aria-label="Remove">';
      itemsHTML += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#353535"/></svg>';
      itemsHTML += '</button>';
      itemsHTML += '</div>';
      if (item.variant) {
        itemsHTML += '<span class="cart-item__variant" style="font-size:12px;color:#666;letter-spacing:0.3px;">' + item.variant + '</span>';
      }
      // Show price with discount: old price strikethrough + new price + badge
      // priceNum is ALREADY in local currency (read from DOM after updatePrices converted it)
      var itemPriceNum = parseFloat(item.priceNum) || 0;
      var currInfo = getSelectedCurrency();
      var oldPriceFormatted = formatLocalPrice(itemPriceNum, currInfo);
      var newPriceFormatted = formatLocalPrice(itemPriceNum * 0.75, currInfo);
      itemsHTML += '<div class="cart-item__price" style="font-size:14px;color:#000;font-weight:400;letter-spacing:0.3px;">';
      itemsHTML += '<span style="color:#c00;text-decoration:line-through;font-size:0.85em;">' + oldPriceFormatted + '</span> ';
      itemsHTML += '<span style="font-weight:600;margin-left:4px;">' + newPriceFormatted + '</span> ';
      itemsHTML += '<span style="background:#c00;color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:bold;margin-left:4px;">-25%</span>';
      itemsHTML += '</div>';
      itemsHTML += '<div class="cart-item__quantity" style="display:flex;align-items:center;gap:0;margin-top:6px;border:1px solid #ccc;width:fit-content;">';
      itemsHTML += '<button class="cart-item__qty-btn cart-item__qty-minus" data-index="' + i + '" style="width:32px;height:32px;background:none;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">−</button>';
      itemsHTML += '<span class="cart-item__qty-value" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:13px;border-left:1px solid #ccc;border-right:1px solid #ccc;">' + item.quantity + '</span>';
      itemsHTML += '<button class="cart-item__qty-btn cart-item__qty-plus" data-index="' + i + '" style="width:32px;height:32px;background:none;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>';
      itemsHTML += '</div>';
      itemsHTML += '</div>';
      itemsHTML += '</div>';
    }

    itemsHTML += '</div>';
    container.innerHTML = itemsHTML;

    // Enable checkout button
    var checkoutBtn = document.getElementById('CartDrawer-Checkout');
    if (checkoutBtn) checkoutBtn.disabled = false;

    updateSubtotal();
    bindCartItemEvents();
  }

  // ==================== SUBTOTAL ====================
  function getSelectedCurrency() {
    var COUNTRY_CURRENCY = {
      'AM':'EUR','AU':'USD','AT':'EUR','BH':'BHD','BE':'EUR','BG':'EUR','CA':'USD',
      'HR':'EUR','CY':'EUR','CZ':'EUR','DK':'EUR','EE':'EUR','FI':'EUR','FR':'EUR',
      'DE':'EUR','GR':'EUR','GG':'GBP','HK':'USD','HU':'EUR','IN':'USD','ID':'USD',
      'IE':'EUR','IT':'EUR','JP':'USD','JE':'GBP','JO':'USD','KZ':'USD','KW':'KWD',
      'LV':'EUR','LT':'EUR','LU':'EUR','MY':'USD','MT':'EUR','NL':'EUR','NZ':'USD',
      'NO':'EUR','OM':'OMR','PH':'USD','PL':'EUR','PT':'EUR','QA':'USD','RO':'EUR',
      'SA':'SAR','SG':'USD','SK':'EUR','SI':'EUR','KR':'USD','ES':'EUR','SE':'EUR',
      'CH':'EUR','TH':'USD','AE':'AED','GB':'GBP','US':'USD'
    };
    var CURRENCY_SYMBOLS = {
      'USD':'$','EUR':'€','OMR':'OMR ','KWD':'KWD ','BHD':'BHD ','AED':'AED ','GBP':'£','SAR':'SAR '
    };
    var EXCHANGE_RATES = {
      'USD':1,'EUR':0.92,'OMR':0.385,'KWD':0.308,'BHD':0.376,'AED':3.67,'GBP':0.79,'SAR':3.75
    };
    var country = localStorage.getItem('amouage_country') || 'OM';
    var currency = COUNTRY_CURRENCY[country] || 'OMR';
    var symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
    var rate = EXCHANGE_RATES[currency] || 1;
    return { currency: currency, symbol: symbol, rate: rate };
  }

  function formatCurrencyAmount(amount, currencyInfo) {
    var converted = amount * currencyInfo.rate;
    if (['KWD','BHD','OMR'].indexOf(currencyInfo.currency) !== -1) {
      return currencyInfo.symbol + converted.toFixed(3);
    } else {
      return currencyInfo.symbol + Math.round(converted).toLocaleString('en-US');
    }
  }

  // Format price that is ALREADY in local currency (no conversion needed)
  function formatLocalPrice(amount, currencyInfo) {
    if (['KWD','BHD','OMR'].indexOf(currencyInfo.currency) !== -1) {
      return currencyInfo.symbol + amount.toFixed(3);
    } else {
      return currencyInfo.symbol + Math.round(amount).toLocaleString('en-US');
    }
  }

  function updateSubtotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var priceNum = parseFloat(cart[i].priceNum) || 0;
      total += priceNum * cart[i].quantity;
    }

    var subtotalEl = document.getElementById('am-cart__total--price');
    if (subtotalEl) {
      var currInfo = getSelectedCurrency();
      // priceNum is ALREADY in local currency, don't convert again
      var oldTotal = formatLocalPrice(total, currInfo);
      var newTotal = formatLocalPrice(total * 0.75, currInfo);
      subtotalEl.innerHTML = '<span style="color:#c00;text-decoration:line-through;font-size:0.85em;">' + oldTotal + '</span> ' +
        '<span style="font-weight:600;margin-left:4px;">' + newTotal + '</span> ' +
        '<span style="background:#c00;color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-weight:bold;margin-left:4px;">-25%</span>';
      subtotalEl.setAttribute('data-price', total * 0.75 * 100);
    }
  }

  // ==================== BIND CART ITEM EVENTS ====================
  function bindCartItemEvents() {
    // Remove buttons
    var removeBtns = document.querySelectorAll('.cart-item__remove');
    for (var i = 0; i < removeBtns.length; i++) {
      removeBtns[i].addEventListener('click', function(e) {
        e.preventDefault();
        var index = parseInt(this.getAttribute('data-index'));
        var cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCartItems();
        updateCartBadge();
        if (cart.length === 0) {
          var cartDrawer = document.querySelector('cart-drawer');
          if (cartDrawer) cartDrawer.classList.add('is-empty');
          var emptyDiv = cartDrawer ? cartDrawer.querySelector('.drawer__inner-empty') : null;
          var headerDiv = cartDrawer ? cartDrawer.querySelector('.drawer__header') : null;
          var itemsDiv = document.querySelector('cart-drawer-items');
          var footerDiv = cartDrawer ? cartDrawer.querySelector('.drawer__footer') : null;
          if (emptyDiv) emptyDiv.style.display = '';
          if (headerDiv) headerDiv.style.display = 'none';
          if (itemsDiv) itemsDiv.style.display = 'none';
          if (footerDiv) footerDiv.style.display = 'none';
        }
      });
    }

    // Quantity minus buttons
    var minusBtns = document.querySelectorAll('.cart-item__qty-minus');
    for (var i = 0; i < minusBtns.length; i++) {
      minusBtns[i].addEventListener('click', function(e) {
        e.preventDefault();
        var index = parseInt(this.getAttribute('data-index'));
        var cart = getCart();
        if (cart[index].quantity > 1) {
          cart[index].quantity--;
          saveCart(cart);
          renderCartItems();
          updateCartBadge();
        }
      });
    }

    // Quantity plus buttons
    var plusBtns = document.querySelectorAll('.cart-item__qty-plus');
    for (var i = 0; i < plusBtns.length; i++) {
      plusBtns[i].addEventListener('click', function(e) {
        e.preventDefault();
        var index = parseInt(this.getAttribute('data-index'));
        var cart = getCart();
        cart[index].quantity++;
        saveCart(cart);
        renderCartItems();
        updateCartBadge();
      });
    }
  }

  // ==================== EXTRACT PRODUCT INFO ====================
  function extractProductInfo() {
    var info = {};

    // Product name from h1
    var h1 = document.querySelector('.product__title h1');
    if (!h1) h1 = document.querySelector('h1');
    info.name = h1 ? h1.textContent.trim() : 'Product';

    // Product image - first product media image
    var img = document.querySelector('.product__media-item.is-active .product__media img');
    if (!img) img = document.querySelector('.product__media img');
    if (!img) img = document.querySelector('.product__media-item img');
    if (img) {
      var src = img.getAttribute('src') || '';
      // Make sure it's absolute
      if (src.startsWith('//')) src = 'https:' + src;
      // Use a smaller width for cart thumbnail
      src = src.replace(/width=\d+/, 'width=200');
      info.image = src;
    } else {
      info.image = '';
    }

    // Price - read the ORIGINAL price (before discount)
    // The cart will handle showing discount display itself
    // First try the strikethrough span (old price) created by discount-25.js
    var oldPriceEl = document.querySelector('.am-price__price-item--regular [style*="line-through"]');
    if (!oldPriceEl) oldPriceEl = document.querySelector('.am-price__price__regular [style*="line-through"]');
    if (oldPriceEl) {
      info.price = oldPriceEl.textContent.trim();
    } else {
      // Fallback: read from original price elements (before discount script runs)
      var priceEl = document.querySelector('.am-price__price-item--regular');
      if (!priceEl) priceEl = document.querySelector('.price-item--regular .money');
      if (!priceEl) priceEl = document.querySelector('.price-item--sale .money');
      if (!priceEl) priceEl = document.querySelector('.price-item .money');
      info.price = priceEl ? priceEl.textContent.trim() : '$0';
      // If price contains multiple numbers (discount applied), extract the FIRST (original)
      var priceNumbers = info.price.match(/[\d,.]+/g);
      if (priceNumbers && priceNumbers.length > 1) {
        var currency = info.price.match(/^[^\d]*/)[0] || '';
        info.price = currency + priceNumbers[0];
      }
    }
    // Extract numeric value (this is the ORIGINAL USD price before conversion)
    var priceText = info.price.replace(/[^0-9.,]/g, '').replace(/,/g, '');
    info.priceNum = parseFloat(priceText) || 0;

    // Variant/Size - checked radio button
    var checkedRadio = document.querySelector('variant-radios input[type="radio"]:checked');
    if (checkedRadio) {
      info.variant = checkedRadio.value;
    } else {
      // Try select element
      var variantSelect = document.querySelector('variant-radios select');
      if (variantSelect) {
        info.variant = variantSelect.value;
      } else {
        info.variant = '';
      }
    }

    // Product URL
    info.url = window.location.pathname;

    // Product ID
    var idInput = document.querySelector('input[name="product-id"]');
    info.productId = idInput ? idInput.value : '';

    // Variant ID
    var variantId = '';
    if (checkedRadio) {
      // Try to get variant ID from JSON data
      var jsonScript = document.querySelector('variant-radios script[type="application/json"]');
      if (jsonScript) {
        try {
          var variants = JSON.parse(jsonScript.textContent);
          var selectedValue = checkedRadio.value;
          for (var v = 0; v < variants.length; v++) {
            if (variants[v].title === selectedValue || variants[v].option1 === selectedValue) {
              variantId = variants[v].id;
              break;
            }
          }
        } catch(e) {}
      }
    }
    info.variantId = variantId;

    return info;
  }

  // ==================== ADD TO CART ====================
  function getSelectedQuantity() {
    // Read quantity from the product page quantity input
    var qtyInput = document.querySelector('quantity-input .quantity__input');
    if (qtyInput) {
      var val = parseInt(qtyInput.value);
      if (val && val > 0) return val;
    }
    return 1;
  }

  function addToCart(productInfo) {
    var cart = getCart();
    var addQty = getSelectedQuantity();

    // Check if item already exists (same product + variant)
    var existingIndex = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].productId === productInfo.productId && cart[i].variant === productInfo.variant) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += addQty;
    } else {
      cart.push({
        productId: productInfo.productId,
        variantId: productInfo.variantId,
        name: productInfo.name,
        image: productInfo.image,
        price: productInfo.price,
        priceNum: productInfo.priceNum,
        variant: productInfo.variant,
        url: productInfo.url,
        quantity: addQty
      });
    }

    saveCart(cart);
    updateCartBadge();
    renderCartItems();
    openCartDrawer();
  }

  // ==================== INIT ====================
  function init() {
    // Update badge on page load
    updateCartBadge();

    // Intercept Add to Bag form submissions
    var forms = document.querySelectorAll('form[action="/cart/add"]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var productInfo = extractProductInfo();
        addToCart(productInfo);
      });
    }

    // Cart icon click opens drawer
    var cartIcon = document.getElementById('cart-icon-bubble');
    if (cartIcon) {
      cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        renderCartItems();
        openCartDrawer();
      });
    }

    // Overlay click closes drawer
    var overlay = document.getElementById('CartDrawer-Overlay');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        closeCartDrawer();
      });
    }

    // Close buttons
    var closeBtns = document.querySelectorAll('.drawer__close');
    for (var i = 0; i < closeBtns.length; i++) {
      closeBtns[i].addEventListener('click', function(e) {
        e.preventDefault();
        closeCartDrawer();
      });
    }

    // Override the cart-drawer custom element close method
    var cartDrawerEl = document.querySelector('cart-drawer');
    if (cartDrawerEl) {
      cartDrawerEl.close = closeCartDrawer;
    }

    // Checkout button - goes to summary payment page
    var checkoutBtn = document.getElementById('CartDrawer-Checkout');
    if (checkoutBtn) {
      checkoutBtn.removeAttribute('onclick');
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/summary-payment';
      });
    }

    // View Bag link - goes to cart page
    var viewBagLink = document.querySelector('.viewbag');
    if (viewBagLink) {
      viewBagLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/cart';
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== CART DRAWER CSS OVERRIDES ====================
  var style = document.createElement('style');
  style.textContent = [
    '/* ===== CART DRAWER - Override all original Amouage/Shopify styles ===== */',
    '',
    '/* cart-drawer custom element - full screen overlay container */',
    'cart-drawer { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99990 !important; pointer-events: none !important; display: block !important; visibility: hidden !important; }',
    'cart-drawer.active { pointer-events: auto !important; visibility: visible !important; }',
    '',
    '/* #CartDrawer - wrapper div inside cart-drawer, also full screen */',
    '#CartDrawer { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99991 !important; pointer-events: none !important; background: none !important; transform: none !important; box-shadow: none !important; }',
    'cart-drawer.active #CartDrawer { pointer-events: auto !important; }',
    '',
    '/* Overlay - full screen semi-transparent background, BEHIND the panel */',
    '#CartDrawer-Overlay, #CartDrawer > .cart-drawer__overlay { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.4) !important; z-index: 1 !important; opacity: 0 !important; visibility: hidden !important; transition: opacity 0.3s ease !important; cursor: pointer !important; pointer-events: auto !important; }',
    'cart-drawer.active #CartDrawer-Overlay, cart-drawer.active #CartDrawer > .cart-drawer__overlay { opacity: 1 !important; visibility: visible !important; }',
    '',
    '/* .drawer__inner - the actual white sliding panel, ABOVE the overlay */',
    '#CartDrawer > .drawer__inner { position: fixed !important; top: 0 !important; right: 0 !important; width: 420px !important; max-width: 90vw !important; height: 100vh !important; background: #fff !important; z-index: 99992 !important; transform: translateX(100%) !important; transition: transform 0.3s ease !important; box-shadow: -4px 0 15px rgba(0,0,0,0.15) !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; pointer-events: auto !important; }',
    'cart-drawer.active #CartDrawer > .drawer__inner { transform: translateX(0) !important; }',
    '',
    '/* Header */',
    '#CartDrawer .drawer__header { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 20px 24px !important; border-bottom: 1px solid #e5e5e5 !important; flex-shrink: 0 !important; background: #fff !important; position: relative !important; z-index: 5 !important; }',
    '#CartDrawer .drawer__heading { font-size: 16px !important; font-weight: 500 !important; letter-spacing: 1px !important; text-transform: uppercase !important; margin: 0 !important; }',
    '#CartDrawer .drawer__close { background: none !important; border: none !important; cursor: pointer !important; padding: 8px !important; position: relative !important; z-index: 10 !important; }',
    '',
    '/* Cart items area */',
    '#CartDrawer cart-drawer-items { flex: 1 !important; overflow-y: auto !important; padding: 0 24px !important; display: block !important; position: relative !important; z-index: 5 !important; }',
    '#CartDrawer .drawer__contents { padding: 0 !important; }',
    '',
    '/* Footer */',
    '#CartDrawer .drawer__footer { padding: 16px 24px 24px !important; border-top: 1px solid #e5e5e5 !important; flex-shrink: 0 !important; background: #fff !important; position: relative !important; z-index: 5 !important; }',
    '#CartDrawer .cart-drawer__footer { padding: 0 0 12px !important; }',
    '#CartDrawer .totals { display: flex !important; justify-content: space-between !important; align-items: center !important; }',
    '#CartDrawer .totals__total { font-size: 14px !important; font-weight: 500 !important; letter-spacing: 0.5px !important; margin: 0 !important; }',
    '#CartDrawer .totals__total-value { font-size: 14px !important; font-weight: 500 !important; margin: 0 !important; }',
    '#CartDrawer .tax-note { font-size: 11px !important; color: #666 !important; margin-top: 6px !important; display: block !important; }',
    '#CartDrawer .cart__ctas { margin-top: 16px !important; }',
    '#CartDrawer #CartDrawer-Checkout { width: 100% !important; padding: 14px !important; background: #000 !important; color: #fff !important; border: none !important; font-size: 13px !important; letter-spacing: 1.5px !important; cursor: pointer !important; text-transform: uppercase !important; font-weight: 500 !important; position: relative !important; z-index: 5 !important; }',
    '#CartDrawer #CartDrawer-Checkout:disabled { background: #ccc !important; cursor: not-allowed !important; }',
    '#CartDrawer .viewbag { display: block !important; text-align: center !important; margin-top: 12px !important; font-size: 13px !important; color: #000 !important; text-decoration: underline !important; letter-spacing: 0.5px !important; cursor: pointer !important; position: relative !important; z-index: 5 !important; }',
    '',
    '/* Empty state */',
    '#CartDrawer .drawer__inner-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; text-align: center; height: 100%; }',
    '#CartDrawer .cart__empty-text { font-size: 16px; font-weight: 400; letter-spacing: 0.5px; margin-bottom: 24px; }',
    '#CartDrawer .cart-drawer__empty-content .button { background: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border: none; cursor: pointer; }',
    '',
    '/* Utility */',
    'body.overflow-hidden { overflow: hidden !important; }',
    '#CartDrawer .cart-item__name:hover { text-decoration: underline; }',
    '#CartDrawer .cart-item__qty-btn:hover { background: #f5f5f5; }',
    '#CartDrawer .cart-item__remove { cursor: pointer !important; position: relative !important; z-index: 5 !important; }',
    '#CartDrawer .cart-item__qty-btn { cursor: pointer !important; position: relative !important; z-index: 5 !important; }'
  ].join('\n');
  document.head.appendChild(style);

})();
