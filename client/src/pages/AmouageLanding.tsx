import { useEffect } from "react";

export default function AmouageLanding() {
  useEffect(() => {
    // Redirect to the static amouage page
    window.location.href = "/amouage-home.html";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}
