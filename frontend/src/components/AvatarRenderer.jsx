import React from 'react';

export default function AvatarRenderer({ config = {}, size = 'md' }) {
  // Parse config if it is passed as a JSON string
  let avatar = { hair: 'default', clothes: 'default', accessory: 'none', mascot: 'none' };
  
  if (typeof config === 'string') {
    try {
      avatar = JSON.parse(config);
    } catch (e) {
      console.warn('Failed to parse avatarConfig string, using default.');
    }
  } else if (config && typeof config === 'object') {
    avatar = { ...avatar, ...config };
  }

  // Handle default state for equipped key
  const equipped = avatar.equipped || avatar;

  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56'
  };

  const getHairPath = () => {
    switch (equipped.hair) {
      case 'hair_blue':
        return (
          <g id="hair-blue">
            {/* Blue hair bangs and spiky sides */}
            <path d="M 15 45 C 5 15, 95 15, 85 45 C 75 35, 60 30, 50 40 C 40 30, 25 35, 15 45 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
            <path d="M 10 42 L 5 55 L 18 50 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
            <path d="M 90 42 L 95 55 L 82 50 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          </g>
        );
      case 'hair_pink':
        return (
          <g id="hair-pink">
            {/* Pigtails and pink hair bangs */}
            <circle cx="10" cy="30" r="14" fill="#ec4899" stroke="#be185d" strokeWidth="2" />
            <circle cx="90" cy="30" r="14" fill="#ec4899" stroke="#be185d" strokeWidth="2" />
            <path d="M 15 45 C 5 15, 95 15, 85 45 C 75 32, 25 32, 15 45 Z" fill="#ec4899" stroke="#be185d" strokeWidth="2" />
          </g>
        );
      case 'hair_fire':
        return (
          <g id="hair-fire">
            {/* Gold flame spikes */}
            <path d="M 15 45 L 25 10 L 38 35 L 50 5 L 62 35 L 75 10 L 85 45 C 70 30, 30 30, 15 45 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            {/* Inner fire core */}
            <path d="M 25 42 L 32 20 L 40 35 L 50 15 L 60 35 L 68 20 L 75 42 Z" fill="#f97316" />
          </g>
        );
      case 'default':
      default:
        return (
          <g id="hair-brown">
            {/* Cute brown hair helmet with single ponytail */}
            <circle cx="50" cy="22" r="12" fill="#78350f" />
            <path d="M 15 45 C 10 18, 90 18, 85 45 C 75 35, 25 35, 15 45 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          </g>
        );
    }
  };

  const getClothesPath = () => {
    switch (equipped.clothes) {
      case 'clothes_hero':
        return (
          <g id="clothes-hero">
            {/* Red cape behind shoulders */}
            <path d="M 15 85 L 0 100 L 25 100 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            <path d="M 85 85 L 100 100 L 75 100 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            {/* Blue suit with yellow shield */}
            <path d="M 25 80 C 25 70, 75 70, 75 80 L 82 100 L 18 100 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
            <path d="M 50 82 L 60 88 L 50 98 L 40 88 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            <text x="50" y="93" fill="#b91c1c" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
          </g>
        );
      case 'clothes_armor':
        return (
          <g id="clothes-armor">
            {/* Gray steel chestplate with gold shoulders */}
            <path d="M 25 80 C 25 70, 75 70, 75 80 L 82 100 L 18 100 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            {/* Shoulder pads */}
            <circle cx="23" cy="78" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="77" cy="78" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            {/* Knight Emblem */}
            <polygon points="50,82 58,90 50,98 42,90" fill="#f43f5e" />
          </g>
        );
      case 'clothes_dino':
        return (
          <g id="clothes-dino">
            {/* Green dinosaur suit with yellow back spikes */}
            <polygon points="15,82 10,72 20,77" fill="#fbbf24" />
            <polygon points="85,82 90,72 80,77" fill="#fbbf24" />
            <path d="M 25 80 C 25 70, 75 70, 75 80 L 82 100 L 18 100 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
            {/* Yellow belly oval */}
            <ellipse cx="50" cy="93" rx="15" ry="9" fill="#fef08a" />
          </g>
        );
      case 'default':
      default:
        return (
          <g id="clothes-default">
            {/* Colorful orange and yellow stripes */}
            <path d="M 25 80 C 25 70, 75 70, 75 80 L 82 100 L 18 100 Z" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
            <path d="M 33 80 L 33 100 M 50 78 L 50 100 M 67 80 L 67 100" stroke="#fef08a" strokeWidth="3" />
          </g>
        );
    }
  };

  const getAccessoryPath = () => {
    switch (equipped.accessory) {
      case 'accessory_shades':
        return (
          <g id="accessory-shades">
            {/* Cool black star or square shades */}
            <rect x="23" y="45" width="22" height="15" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <rect x="55" y="45" width="22" height="15" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="45" y1="52" x2="55" y2="52" stroke="#1e293b" strokeWidth="3" />
            {/* Lens glare reflections */}
            <line x1="26" y1="48" x2="32" y2="54" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="58" y1="48" x2="64" y2="54" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      case 'accessory_crown':
        return (
          <g id="accessory-crown" transform="translate(0, -6)">
            {/* Shiny gold crown */}
            <path d="M 25 25 L 30 10 L 42 20 L 50 5 L 58 20 L 70 10 L 75 25 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            {/* Small red rubies on tips */}
            <circle cx="30" cy="9" r="2.5" fill="#f43f5e" />
            <circle cx="50" cy="4" r="2.5" fill="#f43f5e" />
            <circle cx="70" cy="9" r="2.5" fill="#f43f5e" />
          </g>
        );
      case 'accessory_fairy':
        return (
          <g id="accessory-fairy-wings">
            {/* Large sparkly wings in the background */}
            <path d="M 22 55 C 5 45, 0 20, 15 25 C 25 30, 25 45, 25 55 Z" fill="#a5f3fc" fillOpacity="0.75" stroke="#0891b2" strokeWidth="1.5" />
            <path d="M 78 55 C 95 45, 100 20, 85 25 C 75 30, 75 45, 75 55 Z" fill="#a5f3fc" fillOpacity="0.75" stroke="#0891b2" strokeWidth="1.5" />
          </g>
        );
      case 'none':
      default:
        return null;
    }
  };

  const getMascotPath = () => {
    switch (equipped.mascot) {
      case 'mascot_dragon':
        return (
          <g id="mascot-dragon" transform="translate(74, 55)">
            {/* Cute Red Dragon sitting next to bubble */}
            <circle cx="15" cy="15" r="13" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <circle cx="10" cy="12" r="2.5" fill="#000" />
            <path d="M 18 18 C 16 23, 12 23, 10 18" fill="none" stroke="#000" strokeWidth="1" />
            {/* Yellow belly */}
            <ellipse cx="15" cy="22" rx="6" ry="4" fill="#fef08a" />
            {/* Small green horns */}
            <polygon points="12,3 8,0 10,5" fill="#fbbf24" />
            <polygon points="18,3 22,0 20,5" fill="#fbbf24" />
          </g>
        );
      case 'mascot_unicorn':
        return (
          <g id="mascot-unicorn" transform="translate(74, 55)">
            {/* Magical White Unicorn Head */}
            <path d="M 2 28 C 2 15, 15 15, 18 10 C 20 5, 28 8, 25 15 C 22 20, 22 28, 25 28 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="18" cy="15" r="2.5" fill="#ec4899" />
            {/* Horn */}
            <polygon points="20,10 24,0 17,7" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1" />
            {/* Pink Mane */}
            <path d="M 8 18 C 5 18, 5 28, 2 28 C 5 25, 8 28, 8 18 Z" fill="#f472b6" />
          </g>
        );
      case 'mascot_cat':
        return (
          <g id="mascot-cat" transform="translate(74, 55)">
            {/* Astro Kitty black cat */}
            <circle cx="15" cy="16" r="11" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            {/* Cat Ears */}
            <polygon points="5,9 2,0 9,6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="25,9 28,0 21,6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            {/* Green Eyes */}
            <ellipse cx="10" cy="14" rx="2" ry="3" fill="#10b981" />
            <ellipse cx="20" cy="14" rx="2" ry="3" fill="#10b981" />
            {/* Pink Nose */}
            <polygon points="15,18 13,16 17,16" fill="#ec4899" />
          </g>
        );
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size] || sizeClasses.md}`}>
      {/* SVG Canvas */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow or circle */}
        <circle cx="50" cy="50" r="46" fill="#8b5cf6" fillOpacity="0.1" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3" />
        
        {/* Layer 1: Mascot (Rendered behind the child) */}
        {getMascotPath()}

        {/* Layer 2: Accessories wings (Behind) */}
        {equipped.accessory === 'accessory_fairy' && getAccessoryPath()}

        {/* Layer 3: Body / Face Base */}
        <g id="body-base">
          {/* Shoulders */}
          <path d="M 28 80 C 28 72, 72 72, 72 80 L 80 100 L 20 100 Z" fill="#fb923c" />
        </g>

        {/* Layer 4: Clothes */}
        {getClothesPath()}

        {/* Layer 5: Face Base (Skin) */}
        <g id="head">
          <circle cx="50" cy="50" r="28" fill="#fed7aa" stroke="#fdba74" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="40" cy="48" r="3" fill="#1e293b" />
          <circle cx="60" cy="48" r="3" fill="#1e293b" />
          {/* Blush */}
          <circle cx="36" cy="55" r="3" fill="#f43f5e" fillOpacity="0.4" />
          <circle cx="64" cy="55" r="3" fill="#f43f5e" fillOpacity="0.4" />
          {/* Smiling Mouth */}
          <path d="M 43 56 C 45 61, 55 61, 57 56" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Layer 6: Hair */}
        {getHairPath()}

        {/* Layer 7: Head Accessories (Crown, Shades) */}
        {equipped.accessory !== 'accessory_fairy' && getAccessoryPath()}
      </svg>
    </div>
  );
}
