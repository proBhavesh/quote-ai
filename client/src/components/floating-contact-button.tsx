"use client";

import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function FloatingContactButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server or if on the contact page
  if (!mounted || pathname === "/contact") {
    return null;
  }

  const handleClick = () => {
    router.push("/contact");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={handleClick}
        className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 animate-fade-in"
        aria-label="Contact Us"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Contact Us</span>
      </button>
    </div>
  );
}

// Add this to your globals.css or create a new animation
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// 
// .animate-fade-in {
//   animation: fadeIn 0.3s ease-out;
// } 