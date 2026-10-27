// Litpax Battery Label Generator
(function () {
  const $ = (id) => document.getElementById(id);
  let labels = [];   // { battery, bt, model }

  const els = {
    form: $("singleForm"), battery: $("inBattery"), bt: $("inBt"), model: $("inModel"),
    bulk: $("inBulk"), bulkAdd: $("bulkAdd"), bulkBody: $("bulkBody"),
    size: $("selSize"), mode: $("selMode"), btBar: $("chkBtBarcode"), code: $("selCode"),
    preview: $("preview"), empty: $("previewEmpty"), count: $("labelCount"),
    printArea: $("printArea"), msg: $("msg")
  };

  // ---------- init ----------
  CONFIG.LABEL_SIZES.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id; o.textContent = `${s.w} × ${s.h} mm`;
    els.size.appendChild(o);
  });
  const optCustom = document.createElement("option");
  optCustom.value = "custom"; optCustom.textContent = "Custom…";
  els.size.appendChild(optCustom);
  els.size.value = CONFIG.DEFAULT_SIZE;

  // custom size: pichli baar wala size yaad rakho
  const inW = $("inW"), inH = $("inH");
  try {
    const saved = JSON.parse(localStorage.getItem("litpaxLabelSize") || "null");
    if (saved) { els.size.value = saved.id; inW.value = saved.w || ""; inH.value = saved.h || ""; }
  } catch (e) {}
  if (!els.size.value) els.size.value = CONFIG.DEFAULT_SIZE;

  // barcode size sliders
  const rngW = $("rngBarW"), rngH = $("rngBarH");
  rngW.value = CONFIG.BAR_SIZE_PCT;
  rngH.value = CONFIG.BAR_SIZE_MM;
  try {
    const b = JSON.parse(localStorage.getItem("litpaxBarSize") || "null");
    if (b) { rngW.value = b.w; rngH.value = b.h; }
  } catch (e) {}
  function showBarVals() {
    $("valBarW").textContent = rngW.value + "%";
    $("valBarH").textContent = rngH.value + " mm";
  }
  showBarVals();

  // JsBarcode ke baad svg ko slider ke size pe set karo
  function sizeBar(svg, heightMm) {
    const w = svg.getAttribute("width"), h = svg.getAttribute("height");
    if (w && h && !svg.getAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.width = rngW.value + "%";
    svg.style.height = heightMm + "mm";
  }
  $("customSize").hidden = els.size.value !== "custom";
  els.model.value = CONFIG.DEFAULT_MODEL;
  els.code.value = CONFIG.DEFAULT_CODE;
  const bulkHint = document.querySelector("#bulkBody .hint");
  bulkHint.textContent = bulkHint.textContent.replace("{{model}}", CONFIG.DEFAULT_MODEL);

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
      const bulk = t.dataset.tab === "bulk";
      els.form.hidden = bulk;
      els.bulkBody.hidden = !bulk;
    });
  });

  // ---------- helpers ----------
  const clean = (v) => String(v || "").trim();
  const cleanBt = (v) => clean(v).replace(/\s+/g, "").toUpperCase(); // "A4:C1:37:\n19:AF:1B" -> ek line

  function showMsg(text, isErr) {
    els.msg.textContent = text;
    els.msg.classList.toggle("err", !!isErr);
  }

  function getSize() {
    if (els.size.value === "custom") {
      const w = parseFloat(inW.value), h = parseFloat(inH.value);
      if (w >= 20 && h >= 10) return { id: "custom", w, h };
      return CONFIG.LABEL_SIZES[0];   // galat value ho to default
    }
    return CONFIG.LABEL_SIZES.find((s) => s.id === els.size.value) || CONFIG.LABEL_SIZES[0];
  }

  function saveSize() {
    try {
      localStorage.setItem("litpaxLabelSize",
        JSON.stringify({ id: els.size.value, w: inW.value, h: inH.value }));
    } catch (e) {}
  }

  function addLabel(battery, bt, model) {
    battery = clean(battery);
    if (!battery) return "empty";
    if (labels.some((l) => l.battery === battery)) return "dup";
    labels.push({ battery, bt: cleanBt(bt), model: clean(model) || CONFIG.DEFAULT_MODEL });
    return "ok";
  }

  // ---------- QR ----------
  function qrText(item) {
    if (CONFIG.QR_CONTENT === "battery") return item.battery;
    return [item.battery, item.bt, item.model].join(CONFIG.QR_SEPARATOR);
  }

  function buildQr(item) {
    const box = document.createElement("div");
    box.className = "qr";
    try {
      const qr = qrcode(0, CONFIG.QR_ERROR_LEVEL);
      qr.addData(qrText(item));
      qr.make();
      box.innerHTML = qr.createSvgTag(4, 0);
      const s = box.querySelector("svg");
      s.removeAttribute("width"); s.removeAttribute("height");
      s.setAttribute("viewBox", `0 0 ${qr.getModuleCount() * 4} ${qr.getModuleCount() * 4}`);
    } catch (e) {
      box.textContent = "QR error";
    }
    return box;
  }

  // ---------- build one label ----------
  function buildLabel(item) {
    const size = getSize();
    const codeType = els.code.value;
    const div = document.createElement("div");
    div.className = "label" + (size.h <= 30 ? " small" : "");
    div.style.width = size.w + "mm";
    div.style.height = size.h + "mm";

    // QR only / both: QR left, baaki right
    if (codeType !== "barcode") {
      div.classList.add("with-qr");
      const qrBox = buildQr(item);
      qrBox.style.width = qrBox.style.height = (size.h - 4) + "mm";
      div.appendChild(qrBox);
      const right = document.createElement("div");
      right.className = "qr-side";
      div.appendChild(right);
      fillLabelBody(right, item, codeType === "both");
      return div;
    }

    fillLabelBody(div, item, true);
    return div;
  }

  function fillLabelBody(div, item, withBarcode) {
    const showBtBar = withBarcode && els.btBar.checked && item.bt;
    const barH = showBtBar ? CONFIG.BAR_HEIGHT * 0.7 : CONFIG.BAR_HEIGHT;
    if (withBarcode) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      div.appendChild(svg);
      try {
        JsBarcode(svg, item.battery, {
          format: CONFIG.BARCODE_FORMAT, width: CONFIG.BAR_WIDTH, height: barH,
          displayValue: false, margin: 0
        });
        sizeBar(svg, showBtBar ? rngH.value * 0.7 : rngH.value);
      } catch (e) {
        svg.outerHTML = `<div style="color:#b42318">Invalid: ${item.battery}</div>`;
      }
    }

    const no = document.createElement("div");
    no.className = "batno";
    no.textContent = item.battery;
    div.appendChild(no);

    if (showBtBar) {
      const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg2.classList.add("btbar");
      div.appendChild(svg2);
      JsBarcode(svg2, item.bt, {
        format: CONFIG.BARCODE_FORMAT, width: CONFIG.BAR_WIDTH, height: barH * 0.7,
        displayValue: false, margin: 0
      });
      sizeBar(svg2, rngH.value * 0.5);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML =
      `<span>BT No: <b class="mono"></b></span><span>Model: <b></b></span>`;
    meta.querySelectorAll("b")[0].textContent = item.bt || "-";
    meta.querySelectorAll("b")[1].textContent = item.model;
    div.appendChild(meta);
    return div;
  }

  // ---------- render ----------
  function render() {
    els.preview.innerHTML = "";
    labels.forEach((item, i) => {
      const wrap = document.createElement("div");
      wrap.className = "preview-item";
      wrap.appendChild(buildLabel(item));
      const del = document.createElement("button");
      del.className = "del"; del.title = "Remove"; del.textContent = "×";
      del.onclick = () => { labels.splice(i, 1); render(); };
      wrap.appendChild(del);
      const sn = document.createElement("div");
      sn.className = "sn"; sn.textContent = "#" + (i + 1);
      wrap.appendChild(sn);
      els.preview.appendChild(wrap);
    });
    els.empty.hidden = labels.length > 0;
    els.count.textContent = labels.length;
  }

  // ---------- single entry ----------
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = addLabel(els.battery.value, els.bt.value, els.model.value);
    if (r === "dup") return showMsg("Ye Battery No pehle se list mein hai.", true);
    if (r === "empty") return showMsg("Battery No daalo.", true);
    showMsg("Added: " + clean(els.battery.value));
    els.battery.value = ""; els.bt.value = "";
    els.battery.focus();
    render();
  });

  // ---------- bulk paste ----------
  els.bulkAdd.addEventListener("click", () => {
    const rows = els.bulk.value.split(/\r?\n/).filter((r) => r.trim());
    let ok = 0, dup = 0;
    rows.forEach((row) => {
      const c = row.split("\t");
      if (/battery/i.test(c[0])) return;          // header skip
      const r = addLabel(c[0], c[1], c[2]);
      if (r === "ok") ok++; else if (r === "dup") dup++;
    });
    render();
    showMsg(`${ok} labels add hue` + (dup ? `, ${dup} duplicate skip` : ""), ok === 0);
    if (ok) els.bulk.value = "";
  });

  // ---------- settings re-render ----------
  els.size.addEventListener("change", () => {
    $("customSize").hidden = els.size.value !== "custom";
    if (els.size.value === "custom") inW.focus();
    saveSize(); render();
  });
  [inW, inH].forEach((inp) => inp.addEventListener("input", () => { saveSize(); render(); }));
  els.btBar.addEventListener("change", render);
  els.code.addEventListener("change", render);
  [rngW, rngH].forEach((r) => r.addEventListener("input", () => {
    showBarVals();
    try { localStorage.setItem("litpaxBarSize", JSON.stringify({ w: rngW.value, h: rngH.value })); } catch (e) {}
    render();
  }));

  // ---------- print ----------
  $("btnPrint").addEventListener("click", () => {
    if (!labels.length) return showMsg("Print ke liye pehle label add karo.", true);
    if (els.size.value === "custom" && getSize().id !== "custom")
      return showMsg("Custom size sahi daalo: width kam se kam 20 mm, height 10 mm.", true);
    const size = getSize();
    const mode = els.mode.value;
    $("page-size").textContent = mode === "label"
      ? `@page { size: ${size.w}mm ${size.h}mm; margin: 0; }`
      : `@page { size: A4; margin: 8mm; }`;
    els.printArea.className = "print-only mode-" + mode;
    els.printArea.innerHTML = "";
    labels.forEach((l) => els.printArea.appendChild(buildLabel(l)));
    window.print();
  });

  // ---------- clear ----------
  let clearArmed = false;
  $("btnClear").addEventListener("click", (e) => {
    if (!labels.length) return;
    if (!clearArmed) {
      clearArmed = true;
      e.target.textContent = "Sure? Click again";
      setTimeout(() => { clearArmed = false; e.target.textContent = "Clear All"; }, 3000);
      return;
    }
    labels = []; clearArmed = false; e.target.textContent = "Clear All";
    render(); showMsg("List clear ho gayi.");
  });

  // sample label so page khaali na dikhe
  addLabel("LiTZJ1Lf51100L000001", "A4:C1:37:19:AF:1B", "51V100Ah");
  render();
})();
