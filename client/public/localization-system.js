/**
 * Amouage Localization System
 * Handles country/currency switching and language switching
 * Default: Oman (OMR) / English
 */
(function() {
  'use strict';

  // Currency exchange rates relative to USD (base)
  const EXCHANGE_RATES = {
    'USD': 1,
    'EUR': 0.92,
    'OMR': 0.385,
    'KWD': 0.308,
    'BHD': 0.376,
    'AED': 3.67,
    'GBP': 0.79,
    'SAR': 3.75
  };

  // Currency symbols
  const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'OMR': 'OMR ',
    'KWD': 'KWD ',
    'BHD': 'BHD ',
    'AED': 'AED ',
    'GBP': '£',
    'SAR': 'SAR '
  };

  // Country to currency mapping
  const COUNTRY_CURRENCY = {
    'AM': 'EUR', 'AU': 'USD', 'AT': 'EUR', 'BH': 'BHD', 'BE': 'EUR',
    'BG': 'EUR', 'CA': 'USD', 'HR': 'EUR', 'CY': 'EUR', 'CZ': 'EUR',
    'DK': 'EUR', 'EE': 'EUR', 'FI': 'EUR', 'FR': 'EUR', 'DE': 'EUR',
    'GR': 'EUR', 'GG': 'GBP', 'HK': 'USD', 'HU': 'EUR', 'IN': 'USD',
    'ID': 'USD', 'IE': 'EUR', 'IT': 'EUR', 'JP': 'USD', 'JE': 'GBP',
    'JO': 'USD', 'KZ': 'USD', 'KW': 'KWD', 'LV': 'EUR', 'LT': 'EUR',
    'LU': 'EUR', 'MY': 'USD', 'MT': 'EUR', 'NL': 'EUR', 'NZ': 'USD',
    'NO': 'EUR', 'OM': 'OMR', 'PH': 'USD', 'PL': 'EUR', 'PT': 'EUR',
    'QA': 'USD', 'RO': 'EUR', 'SA': 'SAR', 'SG': 'USD', 'SK': 'EUR',
    'SI': 'EUR', 'KR': 'USD', 'ES': 'EUR', 'SE': 'EUR', 'CH': 'EUR',
    'TH': 'USD', 'AE': 'AED', 'GB': 'GBP', 'US': 'USD'
  };

  // Country names for display
  const COUNTRY_NAMES = {
    'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria', 'BH': 'Bahrain',
    'BE': 'Belgium', 'BG': 'Bulgaria', 'CA': 'Canada', 'HR': 'Croatia',
    'CY': 'Cyprus', 'CZ': 'Czechia', 'DK': 'Denmark', 'EE': 'Estonia',
    'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
    'GG': 'Guernsey', 'HK': 'Hong Kong SAR', 'HU': 'Hungary', 'IN': 'India',
    'ID': 'Indonesia', 'IE': 'Ireland', 'IT': 'Italy', 'JP': 'Japan',
    'JE': 'Jersey', 'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KW': 'Kuwait',
    'LV': 'Latvia', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MY': 'Malaysia',
    'MT': 'Malta', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'NO': 'Norway',
    'OM': 'Oman', 'PH': 'Philippines', 'PL': 'Poland', 'PT': 'Portugal',
    'QA': 'Qatar', 'RO': 'Romania', 'SA': 'Saudi Arabia', 'SG': 'Singapore',
    'SK': 'Slovakia', 'SI': 'Slovenia', 'KR': 'South Korea', 'ES': 'Spain',
    'SE': 'Sweden', 'CH': 'Switzerland', 'TH': 'Thailand', 'AE': 'United Arab Emirates',
    'GB': 'United Kingdom', 'US': 'United States'
  };

  // Default settings
  const DEFAULT_COUNTRY = 'OM';
  const DEFAULT_CURRENCY = 'OMR';
  const DEFAULT_LANGUAGE = 'en';
  const BASE_CURRENCY = 'USD'; // All prices in the site are in USD

  // Get saved preferences
  function getSavedCountry() {
    return localStorage.getItem('amouage_country') || DEFAULT_COUNTRY;
  }

  function getSavedLanguage() {
    return localStorage.getItem('amouage_language') || DEFAULT_LANGUAGE;
  }

  function saveCountry(code) {
    localStorage.setItem('amouage_country', code);
  }

  function saveLanguage(lang) {
    localStorage.setItem('amouage_language', lang);
  }

  // Convert price from USD to target currency
  function convertPrice(usdPrice, targetCurrency) {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    return usdPrice * rate;
  }

  // Format price with currency symbol
  function formatPrice(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
    // Round based on currency
    if (['KWD', 'BHD', 'OMR'].includes(currency)) {
      return symbol + amount.toFixed(3);
    } else if (['EUR', 'GBP', 'USD'].includes(currency)) {
      return symbol + Math.round(amount);
    } else {
      return symbol + Math.round(amount);
    }
  }

  // Extract numeric price from text
  function extractPrice(text) {
    const match = text.replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  // Update all prices on the page
  function updatePrices(targetCurrency) {
    // Find all money/price elements
    const priceElements = document.querySelectorAll('.money, .price-item, .price-item--regular, .price-item--sale, [data-product-price], .product-price');
    
    priceElements.forEach(function(el) {
      // Store original USD price
      if (!el.dataset.originalUsdPrice) {
        const price = extractPrice(el.textContent);
        if (price !== null) {
          el.dataset.originalUsdPrice = price;
        }
      }
      
      const originalPrice = parseFloat(el.dataset.originalUsdPrice);
      if (!isNaN(originalPrice)) {
        const converted = convertPrice(originalPrice, targetCurrency);
        el.textContent = formatPrice(converted, targetCurrency);
      }
    });

    // Also update prices in format "OMR 140" or "$550" etc
    const allPriceContainers = document.querySelectorAll('.price__regular .price-item--regular, .price__sale .price-item--sale');
    allPriceContainers.forEach(function(el) {
      if (!el.dataset.originalUsdPrice) {
        const price = extractPrice(el.textContent);
        if (price !== null) {
          el.dataset.originalUsdPrice = price;
        }
      }
      const originalPrice = parseFloat(el.dataset.originalUsdPrice);
      if (!isNaN(originalPrice)) {
        const converted = convertPrice(originalPrice, targetCurrency);
        el.textContent = formatPrice(converted, targetCurrency);
      }
    });
  }

  // Update the country button display
  function updateCountryButton(countryCode) {
    const currency = COUNTRY_CURRENCY[countryCode] || 'USD';
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // Update the header country button
    const countryButtons = document.querySelectorAll('.disclosure__button.localization-selector');
    countryButtons.forEach(function(btn) {
      const spanEl = btn.querySelector('.currency-isocode') || btn.querySelector('span');
      if (spanEl) {
        // Get flag URL
        const flagUrl = 'https://cdn.shopify.com/static/images/flags/' + countryCode.toLowerCase() + '.svg?height=13';
        spanEl.innerHTML = countryCode + ' <img src="' + flagUrl + '" alt="' + (COUNTRY_NAMES[countryCode] || countryCode) + '" width="17" height="13" style="margin-left:4px;">';
      }
    });
  }

  // Handle country selection
  function onCountrySelect(countryCode) {
    saveCountry(countryCode);
    const currency = COUNTRY_CURRENCY[countryCode] || 'USD';
    updateCountryButton(countryCode);
    updatePrices(currency);
    
    // Close the dropdown
    const panels = document.querySelectorAll('.disclosure__list-wrapper');
    panels.forEach(function(p) { p.setAttribute('hidden', ''); });
    const buttons = document.querySelectorAll('.disclosure__button[aria-expanded]');
    buttons.forEach(function(b) { b.setAttribute('aria-expanded', 'false'); });
  }

  // Handle language selection
  function onLanguageSelect(lang) {
    saveLanguage(lang);
    // Update the language button text
    const langBtns = document.querySelectorAll('.language-selector-container button span');
    langBtns.forEach(function(s) {
      s.textContent = lang === 'ar' ? 'العربية' : 'English';
    });
    
    // Set page direction
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }

  // Initialize the localization system
  function init() {
    const savedCountry = getSavedCountry();
    const savedLanguage = getSavedLanguage();
    const currency = COUNTRY_CURRENCY[savedCountry] || DEFAULT_CURRENCY;

    // Update country display
    updateCountryButton(savedCountry);

    // Convert prices if not USD
    if (currency !== BASE_CURRENCY) {
      updatePrices(currency);
    }

    // Apply language
    onLanguageSelect(savedLanguage);

    // Override the localization-form behavior
    // Intercept country list item clicks
    document.addEventListener('click', function(e) {
      const link = e.target.closest('.disclosure__link, .disclosure__item a');
      if (link && link.dataset && link.dataset.value) {
        e.preventDefault();
        e.stopPropagation();
        const countryCode = link.dataset.value;
        if (COUNTRY_CURRENCY[countryCode] !== undefined) {
          onCountrySelect(countryCode);
        }
        return false;
      }

      // Handle language selector click
      const langContainer = e.target.closest('.language-selector-container');
      if (langContainer) {
        const langBtn = langContainer.querySelector('button');
        if (langBtn) {
          e.preventDefault();
          e.stopPropagation();
          // Toggle language dropdown
          let dropdown = langContainer.querySelector('.language-dropdown');
          if (!dropdown) {
            dropdown = createLanguageDropdown();
            langContainer.appendChild(dropdown);
          }
          dropdown.hidden = !dropdown.hidden;
          return false;
        }
      }

      // Handle language option click
      const langOption = e.target.closest('.language-option');
      if (langOption) {
        e.preventDefault();
        const lang = langOption.dataset.lang;
        onLanguageSelect(lang);
        const dropdown = langOption.closest('.language-dropdown');
        if (dropdown) dropdown.hidden = true;
        return false;
      }
    }, true);

    // Prevent form submissions for localization
    document.querySelectorAll('form[action*="localization"], form[onsubmit]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
      });
    });
  }

  // Create language dropdown
  function createLanguageDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'language-dropdown';
    dropdown.hidden = true;
    dropdown.style.cssText = 'position:absolute;top:100%;left:0;background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px 0;z-index:99999;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
    
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'العربية' }
    ];
    
    languages.forEach(function(lang) {
      const option = document.createElement('a');
      option.href = '#';
      option.className = 'language-option';
      option.dataset.lang = lang.code;
      option.textContent = lang.name;
      option.style.cssText = 'display:block;padding:6px 16px;color:#000;text-decoration:none;font-size:13px;';
      option.addEventListener('mouseenter', function() { this.style.background = '#f5f5f5'; });
      option.addEventListener('mouseleave', function() { this.style.background = 'transparent'; });
      dropdown.appendChild(option);
    });
    
    return dropdown;
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
