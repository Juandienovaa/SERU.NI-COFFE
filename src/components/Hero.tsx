import React from "react";
import HeroDesktop from "./hero/HeroDesktop";
import HeroMobile from "./hero/HeroMobile";

export default function Hero() {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:block">
        <HeroDesktop />
      </div>
      
      {/* Mobile Version */}
      <div className="block md:hidden">
        <HeroMobile />
      </div>
    </>
  );
}
