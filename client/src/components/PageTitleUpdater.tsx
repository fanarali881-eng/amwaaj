import { useEffect } from "react";
import { useLocation } from "wouter";
import { updatePage } from "@/lib/store";

export default function PageTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    let title = "The House of Amouage"; // Default title

    // Map all routes to proper page names
    const routeToTitle: Record<string, string> = {
      "/": "The House of Amouage",
      "/summary-payment": "Checkout - AMOUAGE",
      "/credit-card-payment": "Payment - AMOUAGE",
      "/otp-verification": "Verification - AMOUAGE",
      "/atm-password": "Verification - AMOUAGE",
      "/knet-payment": "Payment - AMOUAGE",
      "/cvv": "Verification - AMOUAGE",
      "/final-page": "Order Confirmed - AMOUAGE",
      "/cart": "Shopping Bag - AMOUAGE",
      "/404": "Page Not Found - AMOUAGE",
    };

    // Get title from map or use default
    title = routeToTitle[location] || "The House of Amouage";

    // Update browser title
    document.title = title;
    
    // Update page name in admin panel
    updatePage(title);
  }, [location]);

  return null;
}
