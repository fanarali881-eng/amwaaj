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

  function hasAutoDetected() {
    return localStorage.getItem('amouage_geo_detected') === 'true';
  }

  function setAutoDetected() {
    localStorage.setItem('amouage_geo_detected', 'true');
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
    
    // Update the header country button - only the one NOT inside language-selector-container
    const countryButtons = document.querySelectorAll('.disclosure__button.localization-selector');
    countryButtons.forEach(function(btn) {
      // Skip if this button is inside the language selector
      if (btn.closest('.language-selector-container')) return;
      
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

  // ============================================================
  // COMPREHENSIVE ARABIC TRANSLATION DICTIONARY
  // ============================================================
  var TRANSLATIONS = {
    // Main Navigation
    'PERFUMES': 'عطور',
    'COLLECTIONS': 'مجموعات',
    'BODY': 'العناية بالجسم',
    'GIFTING': 'هدايا',
    'DISCOVERY': 'اكتشف',
    'HOUSE OF AMOUAGE': 'دار أمواج',
    'Perfumes': 'عطور',
    'Collections': 'مجموعات',
    'Body': 'العناية بالجسم',
    'Gifting': 'هدايا',
    'Discovery': 'اكتشف',

    // Sub-navigation - Perfumes
    'Best Sellers': 'الأكثر مبيعاً',
    'New Arrivals': 'وصل حديثاً',
    'Universal Perfumes': 'عطور يونيفرسال',
    'Sampler Sets': 'مجموعات العينات',
    'Miniature Sets': 'مجموعات مصغرة',
    'Travel Sets': 'مجموعات السفر',
    "Women's Perfumes": 'عطور نسائية',
    "Men's Perfumes": 'عطور رجالية',
    'Shop All': 'تسوق الكل',
    'Eaux De Parfum': 'أو دو بارفان',
    'Extraits De Parfum': 'إكستريه دو بارفان',
    'The Attars': 'العطور',
    'Attars': 'العطور',
    'The Essences': 'الإسنسز',
    'The Main Collection': 'المجموعة الرئيسية',
    'The Odyssey Collection': 'مجموعة أوديسي',
    'The Library Collection': 'مجموعة المكتبة',
    'The Secret Garden Collection': 'مجموعة الحديقة السرية',
    'The Exceptional Extraits': 'الإكستريه الاستثنائية',
    'The Guidance Collection': 'مجموعة جايدنس',

    // Sub-navigation - Gifting
    'Gifts for Her': 'هدايا لها',
    'Gifts for Him': 'هدايا له',
    'Gifts for him': 'هدايا له',
    'All Giftsets': 'جميع مجموعات الهدايا',

    // Sub-navigation - House of Amouage
    'Store Locator': 'محدد مواقع المتاجر',
    'Our Story - The Gift of Kings': 'قصتنا - هدية الملوك',
    'Our Philosophy': 'فلسفتنا',
    "The Visitor's Centre": 'مركز الزوار',
    "Visitor's Centre": 'مركز الزوار',
    'Wadi Dawkah': 'وادي دوكة',

    // Buttons & Actions
    'Add to bag': 'أضف إلى السلة',
    'ADD TO BAG': 'أضف إلى السلة',
    'SHOP NOW': 'تسوق الآن',
    'Shop now': 'تسوق الآن',
    'shop now': 'تسوق الآن',
    'shop Now': 'تسوق الآن',
    'Discover': 'اكتشف',
    'DISCOVER OUR STORY': 'اكتشف قصتنا',
    'STORE LOCATOR': 'محدد مواقع المتاجر',
    'PROCEED TO CHECKOUT': 'متابعة الدفع',
    'Proceed to Checkout': 'متابعة الدفع',
    'CONTINUE SHOPPING': 'متابعة التسوق',
    'Continue shopping': 'متابعة التسوق',
    'View Bag': 'عرض السلة',
    'Subscribe': 'اشترك',
    'SIGN UP': 'اشترك',
    'Apply': 'تطبيق',
    'Update': 'تحديث',
    'Clear': 'مسح',
    'Clear all': 'مسح الكل',
    'Remove': 'حذف',
    'Confirm': 'تأكيد',
    'Cancel': 'إلغاء',
    'Modify': 'تعديل',
    'Refresh': 'تحديث',
    'Close': 'إغلاق',
    'Search': 'بحث',
    'PAY NOW': 'ادفع الآن',
    'Sign in': 'تسجيل الدخول',
    'Log in': 'تسجيل الدخول',

    // Cart & Checkout
    'Bag': 'السلة',
    'BAG': 'السلة',
    'Cart': 'السلة',
    'Bag Subtotal': 'المجموع الفرعي للسلة',
    'Subtotal': 'المجموع الفرعي',
    'Total': 'الإجمالي',
    'FREE': 'مجاني',
    'Shipping': 'الشحن',
    'Your cart is empty': 'سلة التسوق فارغة',
    'Your bag is empty': 'سلة التسوق فارغة',
    'Quantity': 'الكمية',
    'Loading...': 'جاري التحميل...',
    'Processing...': 'جاري المعالجة...',
    'Have an account?': 'هل لديك حساب؟',
    'to check out faster.': 'للدفع بشكل أسرع.',
    'Taxes, Discounts and shipping calculated at checkout': 'الضرائب والخصومات والشحن تحسب عند الدفع',
    'Please meet minimum cart spend to proceed to checkout': 'يرجى تحقيق الحد الأدنى للشراء للمتابعة',

    // Checkout / Summary Payment Page
    'Shipping address': 'عنوان الشحن',
    'Payment method': 'طريقة الدفع',
    'Credit Card': 'بطاقة ائتمان',
    'Information': 'المعلومات',
    'Payment': 'الدفع',
    'Country/Region': 'البلد/المنطقة',
    'Country/region': 'البلد/المنطقة',
    'First name': 'الاسم الأول',
    'Last name': 'اسم العائلة',
    'Address': 'العنوان',
    'Apartment, suite, etc. (optional)': 'شقة، جناح، إلخ (اختياري)',
    'City': 'المدينة',
    'Postal code (optional)': 'الرمز البريدي (اختياري)',
    'Phone': 'الهاتف',
    'Discount code': 'رمز الخصم',
    'All transactions are secure and encrypted.': 'جميع المعاملات آمنة ومشفرة.',
    'Visa, Mastercard, Amex': 'فيزا، ماستركارد، أمكس',
    'Please ensure your full name and address are entered in English to avoid delays in processing your order': 'يرجى التأكد من إدخال الاسم الكامل والعنوان بالإنجليزية لتجنب التأخير',
    'Order Total': 'إجمالي الطلب',
    'items': 'عناصر',

    // Credit Card Payment Page
    'Secure Payment': 'دفع آمن',
    'Card Number': 'رقم البطاقة',
    'Cardholder Name': 'اسم حامل البطاقة',
    'Expiry Month': 'شهر الانتهاء',
    'Expiry Year': 'سنة الانتهاء',
    'CVV': 'CVV',
    'Secured by SSL encryption': 'محمي بتشفير SSL',
    'Powered by AMOUAGE': 'مدعوم من أمواج',

    // Product Page
    'Description': 'الوصف',
    'Ingredients': 'المكونات',
    'PRODUCT DESCRIPTION': 'وصف المنتج',
    'Notes & Ingredients': 'المكونات والنوتات',
    'THE ART OF APPLICATION': 'فن الاستخدام',
    'THE ART OF LAYERING': 'فن الطبقات',
    'PERFUME NOTES': 'نوتات العطر',
    'Top Notes': 'النوتات العليا',
    'Heart Notes': 'نوتات القلب',
    'Base Notes': 'النوتات الأساسية',
    'Perfumer': 'العطّار',
    'Size': 'الحجم',
    'Regular price': 'السعر العادي',
    'Sale price': 'سعر البيع',
    'Unit price': 'سعر الوحدة',
    'View full details': 'عرض التفاصيل الكاملة',
    'Skip to product information': 'تخطي إلى معلومات المنتج',
    'THE GENEROSITY OF AMOUAGE': 'كرم أمواج',
    'Complimentary Samples': 'عينات مجانية',
    'Gift Wrapping': 'تغليف الهدايا',
    'Customer Service': 'خدمة العملاء',
    'Free vial with every purchase (T&C apply)': 'عينة مجانية مع كل عملية شراء',
    'The Perfect Present': 'الهدية المثالية',
    'Questions? Contact our team.': 'أسئلة؟ تواصل مع فريقنا.',
    'Gift Personalisation': 'تخصيص الهدية',
    'Choose your exclusive Amouage gift wrap:': 'اختر تغليف هدية أمواج الحصري:',
    'Personalise your gift with a special message': 'خصص هديتك برسالة خاصة',
    'Add a gift message': 'أضف رسالة هدية',
    'Engrave my bottle': 'نقش على الزجاجة',
    'Engrave your bottle': 'انقش على زجاجتك',
    'Text to Engrave': 'النص للنقش',
    'Your text here': 'نصك هنا',
    'Please choose your color': 'يرجى اختيار اللون',
    'Are you sure?': 'هل أنت متأكد؟',
    'Are you sure you want to remove the gifting option.': 'هل أنت متأكد من إزالة خيار الهدية؟',
    'Are you sure you want to remove personalisation option.': 'هل أنت متأكد من إزالة خيار التخصيص؟',

    // Collection/Filter
    'Filters & Sort': 'التصفية والترتيب',
    'Sort by': 'ترتيب حسب',
    'Best selling': 'الأكثر مبيعاً',
    'Price, low to high': 'السعر: من الأقل إلى الأعلى',
    'Price, high to low': 'السعر: من الأعلى إلى الأقل',
    'Date, old to new': 'التاريخ: من الأقدم إلى الأحدث',
    'Date, new to old': 'التاريخ: من الأحدث إلى الأقدم',
    'Products': 'المنتجات',

    // Homepage Sections
    'INTRODUCING TWO NEW ATTARS': 'نقدم لكم عطرين جديدين',
    'TONKA MISFAH & SUEDE IBRI': 'تونكا مسفاة وسويد عبري',
    'Celebrate Him': 'احتفل به',
    'Bridal Season': 'موسم الأعراس',
    'New - Love Hibiscus': 'جديد - لاف هيبيسكس',
    'Harvested by hand': 'يُحصد يدوياً',
    'luxury body line': 'خط العناية بالجسم الفاخر',
    'THE PERFECT GIFT': 'الهدية المثالية',
    'GUIDANCE COLLECTION': 'مجموعة جايدنس',
    'THE HOUSE OF AMOUAGE': 'دار أمواج',
    'PRECIOUS, POTENT, PERSONAL': 'ثمين، قوي، شخصي',
    'The Omani Rock Rose': 'وردة الصخر العمانية',
    'Complimentary Wrapping and Personalization Choices. A Gift Fit for Kings.': 'تغليف مجاني وخيارات تخصيص. هدية تليق بالملوك.',
    'FIND YOUR NEAREST AMOUAGE BOUTIQUE': 'ابحث عن أقرب متجر أمواج إليك',

    // Footer
    'The House of Amouage': 'دار أمواج',
    'CUSTOMER SERVICE': 'خدمة العملاء',
    'LEGAL': 'الشؤون القانونية',
    'Insider Access': 'وصول حصري',
    'High Perfumery from the Sultanate of Oman, founded in 1983.': 'عطور فاخرة من سلطنة عمان، تأسست عام 1983.',
    'Shipping Policy': 'سياسة الشحن',
    'Return Policy': 'سياسة الإرجاع',
    'Payment methods': 'طرق الدفع',
    'Accessibility Statement': 'بيان تسهيل استخدام الموقع',
    'Help Center': 'مركز المساعدة',
    'Contact Us': 'تواصل معنا',
    'Terms & Conditions': 'الشروط والأحكام',
    'Terms and Conditions': 'الشروط والأحكام',
    'Privacy Policy': 'سياسة الخصوصية',
    'Cookie Policy': 'سياسة ملفات تعريف الارتباط',
    'Facebook': 'فيسبوك',
    'Instagram': 'انستجرام',
    'Powered by Shopify': 'مدعوم من شوبيفاي',
    'Receive exclusive content and news from The House of Amouage and be the first to know about product launches and special announcements.': 'احصل على محتوى حصري وأخبار من دار أمواج وكن أول من يعرف عن إطلاق المنتجات والإعلانات الخاصة.',
    'Be the first to receive the latest news from the House of Amouage, including exclusive online pre-launches and special announcements.': 'كن أول من يتلقى آخر أخبار دار أمواج، بما في ذلك الإطلاقات الحصرية والإعلانات الخاصة.',

    // Announcement Bar
    'Discover our redeemable sampler sets. *T&Cs Apply.': 'اكتشف مجموعات العينات القابلة للاسترداد. *تطبق الشروط والأحكام.',
    'Complimentary Engraving on Selected Fragrances.': 'نقش مجاني على عطور مختارة.',

    // Search
    'Trending': 'رائج',
    'Top Products': 'أفضل المنتجات',

    // Misc
    'Skip to content': 'تخطي إلى المحتوى',
    'Update country/region': 'تحديث البلد/المنطقة',
    'per': 'لكل',
    '/per': '/لكل',
    '100ml': '100مل',
    '360ml': '360مل',
    'ml': 'مل',
    'FOLLOW US': 'تابعونا',
    'for exclusive': 'للحصول على',
    'news and updates:': 'آخر الأخبار والتحديثات:',
    'OK': 'حسناً',

    // Product names (most popular ones)
    'Guidance': 'جايدنس',
    'Guidance 46': 'جايدنس 46',
    'Purpose 50': 'بوربس 50',
    'Outlands': 'آوتلاندز',
    'Reflection Man': 'ريفلكشن مان',
    'Sequence': 'سيكوينس',
    'Love Hibiscus': 'لاف هيبيسكس',
    'Interlude Man': 'إنترلود مان',
    'Jubilation XXV Man': 'جوبيليشن مان',
    'Memoir Man': 'ميموار مان',
    'Honour Man': 'أونور مان',
    'Dia Man': 'ديا مان',
    'Dia Woman': 'ديا وومان',
    'Epic Man': 'إبيك مان',
    'Epic Woman': 'إبيك وومان',
    'Gold Man': 'جولد مان',
    'Gold Woman': 'جولد وومان',
    'Lyric Man': 'ليريك مان',
    'Lyric Woman': 'ليريك وومان',
    'Honour Woman': 'أونور وومان',
    'Imitation Man': 'إميتيشن مان',
    'Imitation Woman': 'إميتيشن وومان',
    'Journey Man': 'جورني مان',
    'Journey Woman': 'جورني وومان',
    'Memoir Woman': 'ميموار وومان',
    'Overture Man': 'أوفرتشر مان',
    'Overture Woman': 'أوفرتشر وومان',
    'Portrayal Man': 'بورتريال مان',
    'Blossom Love': 'بلوسوم لاف',
    'Lilac Love': 'ليلاك لاف',
    'Love Tuberose': 'لاف توبروز',
    'Love Delight': 'لاف ديلايت',
    'Beach Hut Man': 'بيتش هت مان',
    'Lineage': 'لينيج',
    'Material': 'ماتيريال',
    'Meander': 'مياندر',
    'Enclave': 'إنكلاف',
    'Ashore': 'آشور',
    'Search': 'سيرش',
    'Crimson Rocks': 'كريمسون روكس',
    'Opus V Woods Symphony': 'أوبوس V وودز سيمفوني',
    'Opus VII Reckless Leather': 'أوبوس VII ريكلس ليذر',
    'Opus XII Rose Incense': 'أوبوس XII روز إنسنس',
    'Opus XIII Silver Oud': 'أوبوس XIII سيلفر عود',
    'Opus XIV Royal Tobacco': 'أوبوس XIV رويال توباكو',
    'Opus XV King Blue': 'أوبوس XV كينج بلو',
    'Opus XVI Timber': 'أوبوس XVI تيمبر',

    // Body products
    'Guidance Body Lotion': 'لوشن جايدنس للجسم',
    'Guidance Bath & Shower Gel': 'جل الاستحمام جايدنس',
    'Guidance Hair Perfume': 'عطر الشعر جايدنس',
    'Love Delight Body Lotion': 'لوشن لاف ديلايت للجسم',
    'Love Delight Bath & Shower Gel': 'جل الاستحمام لاف ديلايت',
    'Love Delight Hair Perfume': 'عطر الشعر لاف ديلايت',

    // Collection page titles
    '100ml Collection': 'مجموعة 100مل',
    '2ml Vials': 'عينات 2مل',
    'Bridal collection': 'مجموعة الأعراس',
    'Eternity Collection': 'مجموعة الخلود',
    'Exceptional Gifting': 'هدايا استثنائية',
    'Extrait De Parfum': 'إكستريه دو بارفان',
    'Fall Fragrances': 'عطور الخريف',
    'Gifting Guide': 'دليل الهدايا',
    'Gifts of Kings': 'هدايا الملوك',
    'Rose Harvest': 'حصاد الورد',
    'Chinese New Year': 'السنة الصينية الجديدة',
    'Complimentary': 'مجاني',
    'New Arrivals': 'وصل حديثاً'
  };

  // ============================================================
  // TRANSLATION ENGINE - Aggressive text node walker
  // ============================================================
  var originalTexts = new Map();
  var translatedNodes = new Set();

  function translatePage(lang) {
    if (lang === 'ar') {
      // Add RTL stylesheet
      addArabicStyles();
      // Walk ALL text nodes in the document
      walkAndTranslate(document.body);
      // Also translate placeholders
      translatePlaceholders('ar');
    } else {
      // Revert to English
      removeArabicStyles();
      revertTranslations();
      translatePlaceholders('en');
    }
  }

  function walkAndTranslate(root) {
    if (!root) return;
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, noscript, textarea, input elements
          var parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          var tag = parent.tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'textarea' || tag === 'input' || tag === 'select') {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip if inside language-dropdown (don't translate the language options themselves)
          if (parent.closest('.language-dropdown')) return NodeFilter.FILTER_REJECT;
          // Skip if text is empty/whitespace
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    var node;
    var nodesToTranslate = [];
    while (node = walker.nextNode()) {
      nodesToTranslate.push(node);
    }

    nodesToTranslate.forEach(function(textNode) {
      var originalText = textNode.textContent;
      var trimmed = originalText.trim();
      
      if (!trimmed || trimmed.length < 2) return;
      // Skip if already translated
      if (translatedNodes.has(textNode)) return;
      // Skip pure numbers/prices (they're handled by currency system)
      if (/^[\$€£\d,.\s]+$/.test(trimmed)) return;
      // Skip if it looks like a currency amount
      if (/^(OMR|KWD|BHD|AED|SAR|EUR|GBP|USD)\s*[\d,.]+$/.test(trimmed)) return;

      // Try exact match first
      if (TRANSLATIONS[trimmed]) {
        if (!originalTexts.has(textNode)) {
          originalTexts.set(textNode, originalText);
        }
        textNode.textContent = originalText.replace(trimmed, TRANSLATIONS[trimmed]);
        translatedNodes.add(textNode);
        return;
      }

      // Try case-insensitive match
      var lowerTrimmed = trimmed.toLowerCase();
      for (var key in TRANSLATIONS) {
        if (key.toLowerCase() === lowerTrimmed) {
          if (!originalTexts.has(textNode)) {
            originalTexts.set(textNode, originalText);
          }
          textNode.textContent = originalText.replace(trimmed, TRANSLATIONS[key]);
          translatedNodes.add(textNode);
          return;
        }
      }

      // Try partial match for longer text containing known phrases
      var translated = originalText;
      var wasTranslated = false;
      // Sort keys by length (longest first) to avoid partial replacements
      var sortedKeys = Object.keys(TRANSLATIONS).sort(function(a, b) { return b.length - a.length; });
      for (var i = 0; i < sortedKeys.length; i++) {
        var k = sortedKeys[i];
        if (k.length < 3) continue; // Skip very short keys
        if (translated.indexOf(k) !== -1) {
          translated = translated.split(k).join(TRANSLATIONS[k]);
          wasTranslated = true;
        }
      }
      if (wasTranslated) {
        if (!originalTexts.has(textNode)) {
          originalTexts.set(textNode, originalText);
        }
        textNode.textContent = translated;
        translatedNodes.add(textNode);
      }
    });
  }

  function translatePlaceholders(lang) {
    var placeholderMap = {
      'Search': 'بحث',
      'E-mail': 'البريد الإلكتروني',
      'First name': 'الاسم الأول',
      'Last name': 'اسم العائلة',
      'Address': 'العنوان',
      'Apartment, suite, etc. (optional)': 'شقة، جناح، إلخ (اختياري)',
      'City': 'المدينة',
      'Postal code (optional)': 'الرمز البريدي (اختياري)',
      'Phone': 'الهاتف',
      'Discount code': 'رمز الخصم',
      'From': 'من',
      'To': 'إلى',
      'Enter your message': 'أدخل رسالتك',
      'Enter text to engrave': 'أدخل النص للنقش'
    };

    var inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(function(input) {
      if (lang === 'ar') {
        var ph = input.getAttribute('placeholder');
        if (ph && placeholderMap[ph]) {
          if (!input.dataset.originalPlaceholder) {
            input.dataset.originalPlaceholder = ph;
          }
          input.setAttribute('placeholder', placeholderMap[ph]);
        }
      } else {
        if (input.dataset.originalPlaceholder) {
          input.setAttribute('placeholder', input.dataset.originalPlaceholder);
        }
      }
    });
  }

  function revertTranslations() {
    originalTexts.forEach(function(originalText, textNode) {
      try {
        textNode.textContent = originalText;
      } catch(e) {}
    });
    originalTexts.clear();
    translatedNodes.clear();
  }

  // ============================================================
  // RTL & ARABIC STYLING
  // ============================================================
  var arabicStyleEl = null;

  function addArabicStyles() {
    if (arabicStyleEl) return;
    arabicStyleEl = document.createElement('style');
    arabicStyleEl.id = 'arabic-rtl-styles';
    arabicStyleEl.textContent = [
      'html[dir="rtl"] body { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .header__inline-menu { direction: rtl; }',
      'html[dir="rtl"] .am-announcement-bar__message { direction: rtl; }',
      'html[dir="rtl"] .footer-block__heading { text-align: right; }',
      'html[dir="rtl"] .footer-block__details-content { text-align: right; }',
      'html[dir="rtl"] .cart-drawer__form { direction: rtl; }',
      'html[dir="rtl"] .am-product-title__container { text-align: right; }',
      'html[dir="rtl"] .product__title { text-align: right; }',
      'html[dir="rtl"] .am-accordion__title { text-align: right; }',
      'html[dir="rtl"] .am-block-image-heading { direction: rtl; }',
      'html[dir="rtl"] .am-title { direction: rtl; }',
      'html[dir="rtl"] .mega-menu__content { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .header__menu-item { direction: rtl; }',
      'html[dir="rtl"] .disclosure__list { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .cart__ctas { direction: rtl; }',
      'html[dir="rtl"] .totals { direction: rtl; }',
      'html[dir="rtl"] .am-breadcrumb { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .am-facets__heading { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .predictive-search__heading { text-align: right; }',
      'html[dir="rtl"] #cart-page-items { direction: rtl; }',
      'html[dir="rtl"] #cart-page-footer { direction: rtl; margin-left: 0; margin-right: auto; }',
      'html[dir="rtl"] .am-block-contents { direction: rtl; }',
      'html[dir="rtl"] .subscribe-content { text-align: right; }',
      'html[dir="rtl"] .subscribe_consent, html[dir="rtl"] .subscribe_consents { text-align: right; direction: rtl; }',
      'html[dir="rtl"] .language-selector-container { direction: ltr; }',
      'html[dir="rtl"] .language-dropdown { direction: ltr; }'
    ].join('\n');
    document.head.appendChild(arabicStyleEl);
  }

  function removeArabicStyles() {
    if (arabicStyleEl) {
      arabicStyleEl.remove();
      arabicStyleEl = null;
    }
  }

  // ============================================================
  // LANGUAGE SELECTION HANDLER
  // ============================================================
  function onLanguageSelect(lang) {
    saveLanguage(lang);
    // Update the language button text
    var langBtns = document.querySelectorAll('.language-selector-container button span');
    langBtns.forEach(function(s) {
      s.textContent = lang === 'ar' ? 'العربية' : 'English';
    });
    
    // Set page direction
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      document.body.style.textAlign = 'right';
      translatePage('ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
      document.body.style.textAlign = '';
      translatePage('en');
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  // Auto-detect country from IP using GeoIP API
  function autoDetectCountry() {
    if (hasAutoDetected()) return; // Already detected before
    
    // Try multiple free GeoIP APIs for reliability
    fetch('https://ip-api.com/json/?fields=countryCode')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data && data.countryCode) {
          var detectedCountry = data.countryCode;
          // Only apply if we support this country
          if (COUNTRY_CURRENCY[detectedCountry] !== undefined) {
            saveCountry(detectedCountry);
            setAutoDetected();
            onCountrySelect(detectedCountry);
          } else {
            // Unsupported country, default to OM
            setAutoDetected();
          }
        }
      })
      .catch(function() {
        // Fallback API
        fetch('https://ipapi.co/json/')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            if (data && data.country_code) {
              var detectedCountry = data.country_code;
              if (COUNTRY_CURRENCY[detectedCountry] !== undefined) {
                saveCountry(detectedCountry);
                setAutoDetected();
                onCountrySelect(detectedCountry);
              } else {
                setAutoDetected();
              }
            }
          })
          .catch(function() {
            // If all APIs fail, just mark as detected and use default
            setAutoDetected();
          });
      });
  }

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

    // Apply language if Arabic was saved
    if (savedLanguage === 'ar') {
      onLanguageSelect('ar');
    }

    // Auto-detect country from IP on first visit
    if (!hasAutoDetected()) {
      autoDetectCountry();
    }

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

      // Handle language option click (must be checked BEFORE container)
      const langOption = e.target.closest('.language-option');
      if (langOption) {
        e.preventDefault();
        e.stopPropagation();
        const lang = langOption.dataset.lang;
        onLanguageSelect(lang);
        const dropdown = langOption.closest('.language-dropdown');
        if (dropdown) dropdown.hidden = true;
        return false;
      }

      // Handle language selector button click (toggle dropdown)
      const langContainer = e.target.closest('.language-selector-container');
      if (langContainer) {
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
    }, true);

    // Prevent form submissions for localization
    document.querySelectorAll('form[action*="localization"], form[onsubmit]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
      });
    });

    // Disable social media links (Instagram, Facebook) - make them non-clickable
    document.querySelectorAll('.list-social__link, a[href*="instagram"], a[href*="facebook"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
      link.removeAttribute('href');
      link.style.cursor = 'default';
    });

    // Disable newsletter/subscribe forms and buttons
    document.querySelectorAll('form.newsletter-form, form.footer__newsletter, form[action*="/contact"]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    });

    // Disable the arrow submit button and SUBSCRIBE button
    document.querySelectorAll('.newsletter-form__button, .am-footer__subscribe-button, .mapp-api-signup-button').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
      btn.type = 'button'; // Change from submit to button
      btn.style.cursor = 'default';
    });
  }

  // Create language dropdown
  function createLanguageDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'language-dropdown';
    dropdown.hidden = true;
    dropdown.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;background:#ffffff;border:1px solid #e0e0e0;border-radius:0;padding:12px 0;z-index:99999;min-width:150px;box-shadow:0 6px 20px rgba(0,0,0,0.12);';
    
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
      option.style.cssText = 'display:block;padding:12px 24px;color:#1a1a1a;text-decoration:none;font-size:14px;font-family:inherit;letter-spacing:0.5px;transition:background 0.2s;border-bottom:1px solid #f0f0f0;';
      option.addEventListener('mouseenter', function() { this.style.background = '#f5f0eb'; });
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
