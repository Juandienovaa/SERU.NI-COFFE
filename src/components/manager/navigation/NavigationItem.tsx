"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";

interface NavigationItemProps {
  title: string;
  description: string;
  href: string;
  index: number;
  onClose: () => void;
}

export const NavigationItem = React.memo(({ title, description, href, index, onClose }: NavigationItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group/item relative transition-opacity duration-300 ease-in-out group-hover/nav:opacity-[0.35] hover:!opacity-100"
    >
      <Link
        href={href}
        onClick={onClose}
        className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500 rounded-2xl"
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-center gap-6 transition-transform duration-500 ease-out group-hover/item:translate-x-6 active:scale-[0.98] py-1">
          
          {/* Active / Hover Indicator (Thick Vertical Line) */}
          <div className="w-[6px] self-stretch rounded-full bg-white/5 relative overflow-hidden transition-colors duration-300 group-hover/item:bg-orange-500/20">
            {isActive && (
              <m.div 
                layoutId="active-nav-indicator"
                className="absolute inset-0 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <div className="absolute inset-0 bg-orange-500 rounded-full scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-bottom" />
          </div>

          <div className="flex flex-col justify-center">
            <h2 
              className={`font-black uppercase tracking-tight transition-all duration-300 ease-out group-hover/item:tracking-wide group-hover/item:text-white ${
                isActive ? "text-white" : "text-neutral-500"
              }`}
              style={{ fontSize: 'clamp(32px, min(6vw, 6vh), 88px)', lineHeight: 0.95 }}
            >
              {title}
            </h2>
            <m.p 
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className={`font-medium tracking-widest uppercase transition-colors duration-300 ${
                isActive ? "text-orange-400 opacity-100" : "text-neutral-500 opacity-0 group-hover/item:text-orange-400 group-hover/item:opacity-100"
              }`}
              style={{ fontSize: '18px', marginTop: 'clamp(2px, 1vh, 8px)' }}
            >
              {description}
            </m.p>
          </div>
        </div>
      </Link>
    </m.div>
  );
});

NavigationItem.displayName = "NavigationItem";
