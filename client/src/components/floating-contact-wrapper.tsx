"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";

export function FloatingContactWrapper() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("FloatingContactWrapper mounted, pathname:", pathname);
  }, [pathname]);

  // Don't show on the contact page
  if (pathname === "/contact") {
    console.log("On contact page, not showing button");
    return null;
  }

  const handleClick = () => {
    console.log("Contact button clicked");
    router.push("/contact");
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] cursor-pointer"
      onClick={handleClick}
      style={{ 
        backgroundColor: "blue",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div className="bg-blue-600 hover:bg-blue-700 text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105">
        <MessageSquare size={24} color="white" />
      </div>
    </div>
  );
} 