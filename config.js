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
  BAR_SIZE_PCT: 90,    // default: label width ka kitna % barcode lega (30-100)
  BAR_SIZE_MM: 12,     // default: barcode height mm mein (4-30)

  DEFAULT_MODEL: "51V100Ah",

  // QR settings
  DEFAULT_CODE: "barcode",   // "barcode" | "qr" | "both"
  QR_CONTENT: "all",         // "all" = Battery No|BT No|Model,  "battery" = sirf Battery No
  QR_SEPARATOR: "|",
  QR_SIZE_MM: 22,            // default QR size mm mein (8-60)
  QR_ERROR_LEVEL: "M"        // L / M / Q / H
};
