/**
 * Amouage Cart Drawer Functionality
 * Handles: Add to bag, cart drawer open/close, quantity controls, remove items, cart count badge
 * Uses localStorage for persistence (no backend)
 */
(function() {
  'use strict';

  // ==================== CART STORAGE ====================
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
      itemsHTML += '<div class="cart-item__price" style="font-size:14px;color:#000;font-weight:400;letter-spacing:0.3px;"><span class="money">' + item.price + '</span></div>';
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
  function updateSubtotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var priceNum = parseFloat(cart[i].priceNum) || 0;
      total += priceNum * cart[i].quantity;
    }

    var subtotalEl = document.getElementById('am-cart__total--price');
    if (subtotalEl) {
      // Format with $ sign
      var formatted = '$' + total.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
      subtotalEl.innerHTML = "<span class='money'>" + formatted + "</span>";
      subtotalEl.setAttribute('data-price', total * 100);
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

    // Price
    var priceEl = document.querySelector('.price-item--regular .money');
    if (!priceEl) priceEl = document.querySelector('.price-item--sale .money');
    if (!priceEl) priceEl = document.querySelector('.price-item .money');
    if (!priceEl) priceEl = document.querySelector('.am-price__price-item--regular .money');
    if (!priceEl) priceEl = document.querySelector('.am-price__price-item--regular');
    info.price = priceEl ? priceEl.textContent.trim() : '$0';
    // Extract numeric value
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
  function addToCart(productInfo) {
    var cart = getCart();

    // Check if item already exists (same product + variant)
    var existingIndex = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].productId === productInfo.productId && cart[i].variant === productInfo.variant) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex >= 0) {
      cart[existingIndex].quantity++;
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
        quantity: 1
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

    // Checkout button - show alert since no real checkout
    var checkoutBtn = document.getElementById('CartDrawer-Checkout');
    if (checkoutBtn) {
      checkoutBtn.removeAttribute('onclick');
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Checkout is not available on this demo site.');
      });
    }

    // View Bag link
    var viewBagLink = document.querySelector('.viewbag');
    if (viewBagLink) {
      viewBagLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Cart page is not available on this demo site.');
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
    'cart-drawer.active #CartDrawer { transform: translateX(0); visibility: visible; }',
    'cart-drawer.active #CartDrawer-Overlay { visibility: visible; opacity: 1; }',
    '#CartDrawer { position: fixed; top: 0; right: 0; width: 420px; max-width: 90vw; height: 100vh; background: #fff; z-index: 9999; transform: translateX(100%); transition: transform 0.3s ease; box-shadow: -2px 0 10px rgba(0,0,0,0.1); display: flex; flex-direction: column; }',
    '#CartDrawer-Overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 9998; visibility: hidden; opacity: 0; transition: opacity 0.3s ease, visibility 0.3s ease; }',
    'cart-drawer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9997; pointer-events: none; }',
    'cart-drawer.active { pointer-events: auto; }',
    '.drawer__inner { display: flex; flex-direction: column; height: 100%; overflow: hidden; }',
    '.drawer__header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e5e5; }',
    '.drawer__heading { font-size: 16px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin: 0; }',
    '.drawer__close { background: none; border: none; cursor: pointer; padding: 4px; }',
    'cart-drawer-items { flex: 1; overflow-y: auto; padding: 0 24px; }',
    '.drawer__contents { padding: 0; }',
    '.drawer__footer { padding: 16px 24px 24px; border-top: 1px solid #e5e5e5; }',
    '.cart-drawer__footer { padding: 0 0 12px; }',
    '.totals { display: flex; justify-content: space-between; align-items: center; }',
    '.totals__total { font-size: 14px; font-weight: 500; letter-spacing: 0.5px; margin: 0; }',
    '.totals__total-value { font-size: 14px; font-weight: 500; margin: 0; }',
    '.tax-note { font-size: 11px; color: #666; margin-top: 6px; display: block; }',
    '.cart__ctas { margin-top: 16px; }',
    '#CartDrawer-Checkout { width: 100%; padding: 14px; background: #000; color: #fff; border: none; font-size: 13px; letter-spacing: 1.5px; cursor: pointer; text-transform: uppercase; font-weight: 500; }',
    '#CartDrawer-Checkout:disabled { background: #ccc; cursor: not-allowed; }',
    '.viewbag { display: block; text-align: center; margin-top: 12px; font-size: 13px; color: #000; text-decoration: underline; letter-spacing: 0.5px; }',
    '.drawer__inner-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; text-align: center; height: 100%; }',
    '.cart__empty-text { font-size: 16px; font-weight: 400; letter-spacing: 0.5px; margin-bottom: 24px; }',
    '.cart-drawer__empty-content .button { background: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border: none; }',
    '.cart__login-title { margin-top: 32px; font-size: 14px; }',
    '.cart__login-paragraph { font-size: 13px; color: #666; }',
    'body.overflow-hidden { overflow: hidden; }',
    '.cart-item__name:hover { text-decoration: underline; }',
    '.cart-item__qty-btn:hover { background: #f5f5f5; }'
  ].join('\n');
  document.head.appendChild(style);

})();
