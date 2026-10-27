// Litpax Battery Label Generator — settings
const CONFIG = {
  COMPANY: "LITPAX",

  // Label sizes (mm) — printer ke sticker size ke hisaab se add/edit karo
  LABEL_SIZES: [
    { id: "75x50", w: 75, h: 50 },
    { id: "60x40", w: 60, h: 40 },
    { id: "100x50", w: 100, h: 50 },
    { id: "50x25", w: 50, h: 25 }
  ],
  DEFAULT_SIZE: "75x50",

  // Barcode settings (Code128)
  BARCODE_FORMAT: "CODE128",
  BAR_WIDTH: 1.6,      // ek bar ki width (px) — scan na ho to badhao
  BAR_HEIGHT: 45,      // barcode height (px)

  DEFAULT_MODEL: "51V100Ah"
};
