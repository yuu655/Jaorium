"use client"

import { X, Menu } from 'lucide-react'
import { useState } from 'react';
import DrawerDialog from './drawerMenu';

export default function Humberger() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(a => !a)}
        className="md:hidden p-2"
        aria-label="メニュー"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {mobileMenuOpen && <DrawerDialog/>}
    </>
  );
}
