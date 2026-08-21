/*
  This is a React context module: it deliberately exports the provider
  component alongside the `useTheme` hook and the `themes` palette map that
  consumers need. Splitting them apart only to satisfy Fast Refresh would
  fragment the theme definition for no runtime benefit.
*/
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/*
  Each theme is built from a 5-color palette:
  ┌─────────┬──────────────────────────────────────────────┐
  │  Role   │  Maps to                                     │
  ├─────────┼──────────────────────────────────────────────┤
  │  c1     │  Body bg, input bg (lightest / darkest)      │
  │  c2     │  Panel bg, card bg, tab bg, borders          │
  │  c3     │  Accent — glow, active tabs, buttons, links  │
  │  c4     │  accentSoft — titles, active nav, labels     │
  │  c5     │  Primary text, headings (darkest / lightest) │
  └─────────┴──────────────────────────────────────────────┘
  For dark themes (isDark=true), c1 is darkest and c5 is lightest.

  Contrast targets (WCAG AA+):
    textPrimary    ≥ 10:1 on bgBody
    textSecondary  ≥  6:1 on panel bg
    textMuted      ≥  4.5:1 on panel bg
    accentSoft     ≥  8:1 on bgBody / 6:1 on panel bg
*/

function hex2rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbStr([r, g, b]: [number, number, number]): string {
  return `${r}, ${g}, ${b}`;
}

function buildTheme(
  name: string,
  c1: string,
  c2: string,
  c3: string,
  c4: string,
  c5: string,
  isDark = false,
  customRed: string | null = null,
  customSuccess: string | null = null,
  customWarning: string | null = null
) {
  const rgb3 = hex2rgb(c3);
  const rgb2 = hex2rgb(c2);
  const rgb4 = hex2rgb(c4);
  const rgb5 = hex2rgb(c5);
  const [r, g, b] = rgb3;
  const [r2, g2, b2] = rgb2;
  const [r5, g5, b5] = rgb5;
  const red = customRed || (isDark ? "#ff4466" : "#db2740");
  // Same idea as `red`: a status hue every theme shares, nudged per-theme only
  // when the default would clash with that theme's own accent (e.g. Ember's
  // orange accent vs. amber warning).
  const success = customSuccess || (isDark ? "#4ade80" : "#2e7d32");
  const warning = customWarning || (isDark ? "#ffb020" : "#ed6c02");
  const redRgb = rgbStr(hex2rgb(red));

  return {
    name,
    isDark,
    palette: [c1, c2, c3, c4, c5],
    accent: c3,
    accentRgb: rgbStr(rgb3),
    accentGlow: `rgba(${r}, ${g}, ${b}, 0.35)`,
    accentBg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    accentBorder: `rgba(${r}, ${g}, ${b}, 0.25)`,
    accentFill: `rgba(${r}, ${g}, ${b}, 0.55)`,
    accentSoft: c4,
    accentSoftRgb: rgbStr(rgb4),
    red,
    redRgb,
    success,
    successRgb: rgbStr(hex2rgb(success)),
    warning,
    warningRgb: rgbStr(hex2rgb(warning)),
    textPrimary: c5,
    // Bumped from 0.78 → 0.85 for better legibility on translucent panel bgs
    textSecondary: `rgba(${r5}, ${g5}, ${b5}, 0.85)`,
    // Bumped from 0.65/0.70 → 0.70/0.75 — still de-emphasised but meets 4.5:1 on panels
    textMuted: isDark
      ? `rgba(${r5}, ${g5}, ${b5}, 0.75)`
      : `rgba(${r5}, ${g5}, ${b5}, 0.70)`,
    textOnAccent: isDark ? c1 : "#ffffff",
    bgBody: c1,
    bgSurface: isDark
      ? `rgba(${r2}, ${g2}, ${b2}, 0.92)`
      : `rgba(255, 255, 255, 0.88)`,
    bgPanel: isDark
      ? `rgba(${r2}, ${g2}, ${b2}, 0.9)`
      : `rgba(${r2}, ${g2}, ${b2}, 0.9)`,
    bgElevated: isDark
      ? `rgba(${Math.min(r2 + 15, 255)}, ${Math.min(g2 + 15, 255)}, ${Math.min(b2 + 15, 255)}, 0.95)`
      : `rgba(255, 255, 255, 0.95)`,
    bgInput: isDark ? c2 : "#ffffff",
    bgOverlay: isDark
      ? "rgba(0, 0, 0, 0.65)"
      : `rgba(${r5}, ${g5}, ${b5}, 0.4)`,
    // Solid (opaque) panel color — for spots that need a flat fill/text-on-panel
    // color rather than one of the translucent bgSurface/bgPanel/bgElevated composites.
    panel: c2,
    panelRgb: rgbStr(rgb2),
    borderLight: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.12 : 0.15})`,
    borderMedium: `rgba(${r}, ${g}, ${b}, 0.25)`,
    borderInput: c2,
    shadowGlow: `0 0 12px rgba(${r}, ${g}, ${b}, 0.2)`,
    tabBg: isDark
      ? `rgba(${r2}, ${g2}, ${b2}, 0.6)`
      : `rgba(${r2}, ${g2}, ${b2}, 0.3)`,
    tabActive: `rgba(${r}, ${g}, ${b}, 0.1)`,
    cardBg: isDark
      ? `rgba(${r2}, ${g2}, ${b2}, 0.8)`
      : "rgba(255, 255, 255, 0.9)",
    counterBg: `rgba(${r}, ${g}, ${b}, 0.04)`,
  };
}

const themes = {
  // ── Light Themes ─────────────────────────────────────────

  linen: buildTheme(
    // Warm neutral ivory — comfortable, editorial
    "Linen",
    "#F3F1EE", // Warm Ivory
    "#DDD6D2", // Warm Gray
    "#5E606E", // Slate Blue
    "#3D4470", // Deep Slate-Blue (accentSoft — was washed Quick Silver #B1A6A4)
    "#1A1818" // Near-Black (was mid-dark #413F3D)
  ),

  arctic: buildTheme(
    // Cold ocean teal — professional, clear
    "Arctic",
    "#F4F7F6", // White Smoke
    "#B5DBDF", // Powder Blue
    "#2A7580", // Deep Teal
    "#144A52", // Dark Teal (accentSoft — was washed Moonstone #6FB3B8)
    "#0C2028" // Near-black Teal (was #1a2e35)
  ),

  rosewood: buildTheme(
    // Soft blush — bold deep rose
    "Rosewood",
    "#FEF3F3", // Lavender Blush
    "#E8CECE", // Tea Rose
    "#A84C55", // Deep Rose
    "#5E2830", // Dark Rose (accentSoft — was pale French Beige #D1A080)
    "#2A1215", // Near-black Rose (was #5a3035)
    false,
    "#F53163" // Radical Red
  ),

  amethyst: buildTheme(
    // Rich lavender — purple depth
    "Amethyst",
    "#EDEAF2", // Soft Lavender Blush
    "#CFC7E2", // Lavender Panel
    "#6560B0", // Toolbox Purple
    "#3A2868", // Deep Indigo (accentSoft — was bright Lavender #BD9DEA)
    "#1C1435", // Near-black Purple (was #3a3450)
    false,
    "#EA7186" // Tango Pink
  ),

  cerulean: buildTheme(
    // Deep ocean blue — bold water
    "Cerulean",
    "#E4EEF8", // Glitter Blue
    "#A8D0E0", // Powder Blue
    "#1C68B4", // Deep Cerulean
    "#0C3055", // Dark Navy (accentSoft — was mid-blue #7aaed0)
    "#071825", // Near-black Navy (was #1a3a5c)
    false,
    "#DF4C73" // Fandango Pink
  ),

  ember: buildTheme(
    // Warm orange fire — earthy heat
    "Ember",
    "#FFF0E6", // Linen
    "#EAD0C0", // Dust Storm
    "#E04A00", // Orange Pantone
    "#7A2500", // Dark Burnt Orange (accentSoft — was pale Copper #CF8B64)
    "#2C1000", // Near-black Brown (was #692705)
    false,
    null,
    null,
    "#B8860B" // Dark Goldenrod — accent is already orange, keep "warning" visually distinct
  ),

  pacific: buildTheme(
    // Sky and sea blue — bold, energetic
    "Pacific",
    "#EEF4F8", // Light Blue Tint
    "#C0D8EE", // Light Blue
    "#2E7EC0", // Carolina Blue
    "#0F3860", // Deep Navy (accentSoft — was Sea Serpent #53BAC1)
    "#081E35", // Near-black Navy (was #1e3248)
    false,
    "#DB0038" // Rich Carmine
  ),

  crimson: buildTheme(
    // English red on warm ivory — vivid and sharp
    "Crimson",
    "#F5F0F0", // Warm Ivory
    "#EEC8C5", // Orchid Pink
    "#C03038", // English Red
    "#6A1818", // Dark Crimson (accentSoft — was Spanish Gray #8C8C8C, ~2.7:1 fail)
    "#220C0C" // Near-black Wine (was #3a2020)
  ),

  cobalt: buildTheme(
    // Deep indigo — ocean monochrome authority
    "Cobalt",
    "#FAFAF8", // Baby Powder
    "#BDC8E8", // Pale Aqua
    "#3840B0", // Ocean Blue
    "#181880", // Deep Indigo (accentSoft — was mid Toolbox #6F7BC5)
    "#0A0A60" // Near-black Navy (was #15158F)
  ),

  royal: buildTheme(
    // Deep navy — authoritative command
    "Royal",
    "#F8F9FC", // White
    "#DBE3EF", // Glitter
    "#0D2E7F", // Royal Blue
    "#1A3A88", // Medium-Dark Royal Blue (accentSoft — was Payne's Grey #535F80)
    "#040E28" // Near-black (was #051747)
  ),

  aura: buildTheme(
    // Cool lavender-gray bg + vibrant purple — matches the dribbble light palette
    "Aura",
    "#EDEEF5", // Light lavender-gray (body bg — image primary bg)
    "#CCCAE8", // Soft lavender (panel bg, borders)
    "#5B4CF7", // Vibrant purple (accent: buttons, glow, active)
    "#2A15A0", // Deep indigo (accentSoft: titles, nav labels — 10:1 on body bg)
    "#0C0A20" // Near-black indigo (text)
  ),

  // ── Dark Themes ──────────────────────────────────────────

  jungle: buildTheme(
    // Earthy dark green + warm gold — organic
    "Jungle",
    "#2A2115", // Bistre
    "#3C3020", // Dark Earth
    "#78B83C", // Palm Leaf
    "#E8CC5A", // Bright Gold (accentSoft — brighter than #C7AB59)
    "#F2ECC8", // Bright Desert Cream (was #DED2A8)
    true
  ),

  midnight: buildTheme(
    // Deep navy — authority in darkness
    "Midnight",
    "#08101E", // Maastricht Blue
    "#101C30", // Oxford Blue
    "#4E96E8", // Steel Blue
    "#B0C8E0", // Light Steel Blue (accentSoft — was dim Shadow Blue #7b9cc0)
    "#E8F0F8", // Near-white (was dim #c8d6e5)
    true
  ),

  slate: buildTheme(
    // Dark gray + teal — industrial precision
    "Slate",
    "#2E2E32", // Onyx
    "#404044", // Dim Gray
    "#3C9CB0", // Queen Blue
    "#C8C8C5", // Bright Taupe (accentSoft — was dark Taupe Gray #8D8C8A)
    "#F4F4F4", // Near-white (was #e8e8e8)
    true,
    "#E9322E" // Geranium Lake
  ),

  cyber: buildTheme(
    // Dark navy + mint — cyberpunk glow
    "Cyber",
    "#262840", // Gunmetal
    "#32365C", // Arsenic
    "#2ECFA5", // Keppel Mint
    "#A8D8CC", // Light Mint (accentSoft — was dim Rhythm #707793, wrong hue entirely)
    "#EEF8F4", // Near-white Mint (was dim #d4e4df)
    true
  ),

  onyx: buildTheme(
    // Near-black + red — maximum drama
    "Onyx",
    "#161418", // Eerie Black
    "#242228", // Dark Gray
    "#EE3530", // Geranium Red
    "#C8C7C5", // Light Silver (accentSoft — was dim Spanish Gray #959794)
    "#F2F2F2", // Near-white (was #e8e8e8)
    true
  ),

  carbon: buildTheme(
    // Pure grayscale — minimal, typographic
    "Carbon",
    "#1A1A1A", // Raisin Black
    "#2A2A2A", // Dark Charcoal
    "#A0A0A0", // Gray
    "#D0D0D0", // Bright Silver (accentSoft — was Dim Gray #6B6B6B, only ~3.1:1!)
    "#ECECEC", // Near-white (was Silver #BFBFBF)
    true,
    "#E9322E"
  ),

  spectra: buildTheme(
    // Deep indigo + vibrant purple + lime — maximum contrast
    "Spectra",
    "#1C1A2E", // Very dark indigo (body bg)
    "#272440", // Dark purple panel
    "#5B4CF7", // Vibrant purple (accent: buttons, active, glow)
    "#C6F754", // Bright lime (accentSoft: titles, nav labels — 14:1 on dark bg)
    "#E8E6F8", // Near-white with purple tint (text)
    true,
    "#FF6B6B" // Coral red
  ),
};

type ThemeName = keyof typeof themes;
type Theme = ReturnType<typeof buildTheme>;

const isThemeName = (value: string | null): value is ThemeName => {
  return !!value && value in themes;
};

interface ThemeContextValue {
  themeName: ThemeName;
  setThemeName: React.Dispatch<React.SetStateAction<ThemeName>>;
  theme: Theme;
  themes: typeof themes;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("wd2-theme");
    return isThemeName(saved) ? saved : "arctic";
  });

  const theme = themes[themeName];

  useEffect(() => {
    localStorage.setItem("wd2-theme", themeName);
    const root = document.documentElement;
    root.setAttribute("data-theme", themeName);

    Object.entries({
      "--theme-accent": theme.accent,
      "--theme-accent-rgb": theme.accentRgb,
      "--theme-accent-glow": theme.accentGlow,
      "--theme-accent-bg": theme.accentBg,
      "--theme-accent-border": theme.accentBorder,
      "--theme-accent-fill": theme.accentFill,
      "--theme-accent-soft": theme.accentSoft,
      "--theme-accent-soft-rgb": theme.accentSoftRgb,
      "--theme-red": theme.red,
      "--theme-red-rgb": theme.redRgb,
      "--theme-success": theme.success,
      "--theme-success-rgb": theme.successRgb,
      "--theme-warning": theme.warning,
      "--theme-warning-rgb": theme.warningRgb,
      "--theme-text-primary": theme.textPrimary,
      "--theme-text-secondary": theme.textSecondary,
      "--theme-text-muted": theme.textMuted,
      "--theme-text-on-accent": theme.textOnAccent,
      "--theme-bg-body": theme.bgBody,
      "--theme-bg-surface": theme.bgSurface,
      "--theme-bg-panel": theme.bgPanel,
      "--theme-bg-elevated": theme.bgElevated,
      "--theme-bg-input": theme.bgInput,
      "--theme-bg-overlay": theme.bgOverlay,
      "--theme-panel": theme.panel,
      "--theme-panel-rgb": theme.panelRgb,
      "--theme-border-light": theme.borderLight,
      "--theme-border-medium": theme.borderMedium,
      "--theme-border-input": theme.borderInput,
      "--theme-shadow-glow": theme.shadowGlow,
      "--theme-tab-bg": theme.tabBg,
      "--theme-tab-active": theme.tabActive,
      "--theme-card-bg": theme.cardBg,
      "--theme-counter-bg": theme.counterBg,
    }).forEach(([key, value]) => root.style.setProperty(key, value));
  }, [themeName, theme]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, theme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

export { themes };
