import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Home,
  Receipt,
  ShoppingBag,
  ShieldCheck,
  Plus,
  Trash2,
  Wallet,
  Loader2,
  RotateCcw,
  Store,
  MapPin,
  Clock,
  X,
  Barcode,
  Camera,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import { localStore } from "./storage";

const c = {
  bg: "#F4F2ED",
  card: "#FFFFFF",
  cardSoft: "#EFEDE6",
  line: "#E4E0D6",
  ink: "#3B4038",
  inkSoft: "#8A8A7E",
  sage: "#7C9A80",
  sageDeep: "#5E7C63",
  sand: "#D9A15C",
  sandSoft: "#F3E2C7",
  rose: "#C1755F",
  roseSoft: "#F3E0DA",
};

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
.page-fade { animation: fadeIn .28s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.pm-scroll::-webkit-scrollbar { display: none; }
.pm-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.pm-tap { transition: transform .12s ease, background-color .18s ease, border-color .18s ease, color .18s ease; }
.pm-tap:active { transform: scale(0.96); }
`;

const STORAGE_KEY = "budget-state";
const DEFAULT_STATE = {
  salary: 1500,
  emergencyPct: 10,
  bills: [
    { id: "b1", name: "إيجار", amount: 400 },
    { id: "b2", name: "كهرباء وماء", amount: 80 },
    { id: "b3", name: "إنترنت", amount: 25 },
  ],
  stores: ["كارفور", "سوبر ماركت الحي"],
  productMap: {},
  purchases: [
    { id: "p1", name: "بقالة", amount: 60, store: "كارفور", ts: Date.now() - 86400000 },
  ],
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function fmt(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
}
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const date = d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export default function BudgetApp() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [page, setPage] = useState("home");

  useEffect(() => {
    (async () => {
      try {
        const res = await localStore.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setState({ stores: [], productMap: {}, ...DEFAULT_STATE, ...parsed });
        } else {
          setState(DEFAULT_STATE);
        }
      } catch (e) {
        setState(DEFAULT_STATE);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    try {
      const result = await localStore.set(STORAGE_KEY, JSON.stringify(next));
      setSaveError(!result);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  const update = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const totals = useMemo(() => {
    if (!state) return null;
    const totalBills = state.bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const salaryN = Number(state.salary) || 0;
    const emergencyAmount = (salaryN * (Number(state.emergencyPct) || 0)) / 100;
    const spendablePool = salaryN - totalBills - emergencyAmount;
    const totalPurchases = state.purchases.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const remaining = spendablePool - totalPurchases;
    const billsPct = salaryN > 0 ? Math.min(100, (totalBills / salaryN) * 100) : 0;
    const emgPct = salaryN > 0 ? Math.min(100, (emergencyAmount / salaryN) * 100) : 0;
    const spendPct = salaryN > 0 ? Math.max(0, 100 - billsPct - emgPct) : 0;
    return { totalBills, emergencyAmount, spendablePool, totalPurchases, remaining, billsPct, emgPct, spendPct, salaryN };
  }, [state]);

  async function resetAll() {
    setState(DEFAULT_STATE);
    await persist(DEFAULT_STATE);
  }

  if (loading || !state || !totals) {
    return (
      <div style={{ background: c.bg }} className="min-h-screen flex items-center justify-center">
        <style>{fontImport}</style>
        <Loader2 className="animate-spin" color={c.sageDeep} size={28} />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: "#DDDCD3", fontFamily: "'Tajawal', sans-serif" }} className="min-h-screen flex items-center justify-center sm:py-6 sm:px-3">
      <style>{fontImport}</style>

      <div
        style={{ background: c.bg, color: c.ink, boxShadow: "0 30px 60px -20px rgba(40,45,35,0.35)" }}
        className="w-full h-[100dvh] sm:max-w-[420px] sm:h-[820px] sm:max-h-[92vh] rounded-none sm:rounded-[2.2rem] overflow-hidden flex flex-col relative"
      >
        <div style={{ background: c.bg }} className="pt-4 px-6 pb-2 flex items-center justify-between shrink-0">
          <div style={{ fontFamily: "'Cairo', sans-serif" }} className="font-extrabold text-lg">
            ميزانيتي
          </div>
          <button onClick={resetAll} style={{ color: c.inkSoft }} className="flex items-center gap-1 text-xs" aria-label="إعادة تعيين">
            <RotateCcw size={13} />
            تصفير
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {page === "home" && <HomePage state={state} totals={totals} update={update} goTo={setPage} />}
          {page === "bills" && (
            <BillsPage
              items={state.bills}
              onAdd={(name, amount) => update((p) => ({ ...p, bills: [...p.bills, { id: uid(), name, amount }] }))}
              onRemove={(id) => update((p) => ({ ...p, bills: p.bills.filter((b) => b.id !== id) }))}
            />
          )}
          {page === "purchases" && (
            <PurchasesPage
              items={state.purchases}
              stores={state.stores}
              productMap={state.productMap}
              onAdd={(name, amount, store, barcode, quantity) =>
                update((p) => {
                  const nextMap = barcode ? { ...p.productMap, [barcode]: name } : p.productMap;
                  return {
                    ...p,
                    productMap: nextMap,
                    purchases: [
                      { id: uid(), name, amount, store, barcode: barcode || null, quantity: quantity || 1, ts: Date.now() },
                      ...p.purchases,
                    ],
                  };
                })
              }
              onRemove={(id) => update((p) => ({ ...p, purchases: p.purchases.filter((x) => x.id !== id) }))}
              onAddStore={(storeName) =>
                update((p) => (p.stores.includes(storeName) ? p : { ...p, stores: [...p.stores, storeName] }))
              }
              onRemoveStore={(storeName) => update((p) => ({ ...p, stores: p.stores.filter((s) => s !== storeName) }))}
            />
          )}
          {page === "emergency" && <EmergencyPage state={state} totals={totals} update={update} />}
        </div>

        {saveError && (
          <div style={{ background: c.roseSoft, color: c.rose }} className="text-xs text-center py-1.5 shrink-0">
            تعذّر الحفظ، بس تقدر تكمل استخدام التطبيق
          </div>
        )}

        <div style={{ background: c.card, borderTop: `1px solid ${c.line}` }} className="flex items-center justify-around px-2 py-2.5 shrink-0">
          <NavBtn active={page === "home"} onClick={() => setPage("home")} icon={<Home size={20} />} label="الرئيسية" />
          <NavBtn active={page === "bills"} onClick={() => setPage("bills")} icon={<Receipt size={20} />} label="الفواتير" />
          <NavBtn active={page === "purchases"} onClick={() => setPage("purchases")} icon={<ShoppingBag size={20} />} label="مشترياتي" />
          <NavBtn active={page === "emergency"} onClick={() => setPage("emergency")} icon={<ShieldCheck size={20} />} label="الطوارئ" />
        </div>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{ color: active ? c.sageDeep : c.inkSoft }}
      className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
    >
      {icon}
      <span className="text-[11px]" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "طاب ليلك";
  if (h < 12) return "صباح الخير";
  if (h < 17) return "نهارك سعيد";
  return "مساء الخير";
}

function HomePage({ state, totals, update, goTo }) {
  const overspent = totals.remaining < 0;
  const spendOfPool =
    totals.spendablePool > 0 ? Math.min(100, Math.max(0, (totals.totalPurchases / totals.spendablePool) * 100)) : 0;

  return (
    <div className="pt-1 page-fade">
      <div style={{ color: c.inkSoft }} className="text-sm mb-4">{greeting()}، هذا وضع راتبك هلق.</div>

      {/* remaining — hero card */}
      <div
        style={{ background: overspent ? c.roseSoft : c.sageDeep, color: overspent ? c.rose : "#F5F7EF" }}
        className="rounded-3xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm opacity-90">{overspent ? "تجاوزت المتاح للصرف" : "المتبقي فعليًا هالشهر"}</span>
          <span
            style={{ background: overspent ? "rgba(193,117,95,0.15)" : "rgba(255,255,255,0.18)" }}
            className="rounded-full p-1.5"
          >
            <Wallet size={14} />
          </span>
        </div>
        <div dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-4xl font-bold text-left mb-3">
          {fmt(totals.remaining)}
        </div>
        {!overspent && (
          <div style={{ background: "rgba(255,255,255,0.22)" }} className="h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${spendOfPool}%`, background: "#F5F7EF" }}
              className="h-full rounded-full transition-all duration-700 ease-out"
            />
          </div>
        )}
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => goTo("bills")}
          style={{ background: c.card, border: `1px solid ${c.line}`, color: c.ink }}
          className="pm-tap rounded-2xl py-3.5 flex flex-col items-center gap-1.5"
        >
          <span style={{ background: c.roseSoft }} className="rounded-full p-2">
            <Receipt size={16} color={c.rose} />
          </span>
          <span className="text-xs font-semibold">فاتورة جديدة</span>
        </button>
        <button
          onClick={() => goTo("purchases")}
          style={{ background: c.card, border: `1px solid ${c.line}`, color: c.ink }}
          className="pm-tap rounded-2xl py-3.5 flex flex-col items-center gap-1.5"
        >
          <span style={{ background: c.cardSoft }} className="rounded-full p-2">
            <ShoppingBag size={16} color={c.sageDeep} />
          </span>
          <span className="text-xs font-semibold">تسجيل مشترى</span>
        </button>
      </div>

      {/* salary card */}
      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-5 mb-4">
        <label className="flex items-center gap-2 text-sm mb-2" style={{ color: c.inkSoft }}>
          <Wallet size={15} color={c.sageDeep} />
          الراتب الشهري
        </label>
        <input
          type="number"
          value={state.salary}
          onChange={(e) => update((p) => ({ ...p, salary: e.target.value }))}
          dir="ltr"
          style={{
            background: c.cardSoft,
            border: `1px solid ${c.line}`,
            color: c.ink,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
          className="w-full rounded-2xl px-4 py-3 text-2xl font-semibold outline-none text-center"
        />

        <div className="mt-5">
          <div style={{ background: c.cardSoft }} className="flex h-3.5 rounded-full overflow-hidden">
            <div style={{ width: `${totals.billsPct}%`, background: c.rose }} className="transition-all duration-700 ease-out" />
            <div style={{ width: `${totals.emgPct}%`, background: c.sand }} className="transition-all duration-700 ease-out" />
            <div style={{ width: `${totals.spendPct}%`, background: c.sage }} className="transition-all duration-700 ease-out" />
          </div>
          <div className="flex justify-between mt-2.5 text-[11px]" style={{ color: c.inkSoft }}>
            <Legend color={c.rose} label="فواتير" />
            <Legend color={c.sand} label="طوارئ" />
            <Legend color={c.sage} label="يومي" />
          </div>
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-5 space-y-3">
        <SummaryRow icon={<Receipt size={13} />} label="مجموع الفواتير" value={totals.totalBills} color={c.rose} />
        <SummaryRow icon={<ShieldCheck size={13} />} label="مخصص الطوارئ" value={totals.emergencyAmount} color={c.sand} />
        <SummaryRow icon={<Wallet size={13} />} label="متاح للصرف اليومي" value={totals.spendablePool} color={c.sageDeep} />
        <SummaryRow icon={<ShoppingBag size={13} />} label="مصروف فعلاً" value={totals.totalPurchases} color={c.inkSoft} />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

function SummaryRow({ icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2" style={{ color: c.inkSoft }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <span dir="ltr" style={{ color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{fmt(value)}</span>
    </div>
  );
}

function EmergencyPage({ state, totals, update }) {
  return (
    <div className="pt-1">
      <div style={{ color: c.inkSoft }} className="text-sm mb-4">شوية من كل راتب، لليوم اللي ما بتتوقعه.</div>

      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-6 mb-4 text-center">
        <div style={{ color: c.inkSoft }} className="text-sm mb-3">مخصص هالشهر</div>
        <div dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.sand }} className="text-4xl font-bold mb-1">
          {fmt(totals.emergencyAmount)}
        </div>
        <div style={{ color: c.inkSoft }} className="text-xs">{state.emergencyPct}% من الراتب</div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={40}
            value={state.emergencyPct}
            onChange={(e) => update((p) => ({ ...p, emergencyPct: e.target.value }))}
            className="w-full"
            style={{ accentColor: c.sand }}
          />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.sand }} className="w-10 text-left shrink-0 text-sm">
            {state.emergencyPct}%
          </span>
        </div>
        <div style={{ color: c.inkSoft }} className="text-xs mt-4 leading-relaxed">
          هالمبلغ بينحجز أول شي من راتبك، قبل الفواتير والمصروف اليومي — عشان يضل جنب لأي طارئ.
        </div>
      </div>
    </div>
  );
}

function BillsPage({ items, onAdd, onRemove }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function submit() {
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), Number(amount));
    setName("");
    setAmount("");
  }

  return (
    <div className="pt-1">
      <div style={{ color: c.inkSoft }} className="text-sm mb-4">أضف كل فاتورة ثابتة بتدفعها كل شهر</div>

      <div style={{ background: c.roseSoft }} className="rounded-3xl p-5 mb-4">
        <div style={{ color: c.inkSoft }} className="text-xs mb-1">إجمالي الفواتير</div>
        <div dir="ltr" style={{ color: c.rose, fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-bold">
          {fmt(total)}
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-4 mb-4">
        {items.length === 0 && <div style={{ color: c.inkSoft }} className="text-sm italic py-2 text-center">لسا ما في شي مضاف</div>}
        {items.map((it) => (
          <div key={it.id} style={{ borderBottom: `1px solid ${c.line}` }} className="flex items-center justify-between py-2.5 last:border-b-0">
            <span className="text-sm">{it.name}</span>
            <div className="flex items-center gap-3">
              <span dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.ink }} className="text-sm font-medium">
                {fmt(it.amount)}
              </span>
              <button onClick={() => onRemove(it.id)} style={{ color: c.rose }} aria-label="حذف">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الفاتورة"
          style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="المبلغ"
          type="number"
          dir="ltr"
          style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink, width: "88px" }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
        />
        <button onClick={submit} style={{ background: c.rose, color: "#fff" }} className="rounded-xl p-2.5 shrink-0" aria-label="إضافة">
          <Plus size={17} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function dateLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

function monthLabel(d = new Date()) {
  return d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

function isSameMonth(ts, ref) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/* ---------- barcode capture (camera + manual + Open Food Facts API) ---------- */
function BarcodeField({ value, onChange, productMap, onProductInfo }) {
  const [mode, setMode] = useState("idle"); // idle | camera | manual
  const [error, setError] = useState("");
  // idle | local-found | checking | api-found | not-found | offline-error
  const [lookup, setLookup] = useState("idle");
  const [product, setProduct] = useState(null); // { name, brand, quantity, category, image }
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const code = (value || "").trim();
    setProduct(null);
    if (code.length < 4) {
      setLookup("idle");
      return;
    }

    const known = productMap && productMap[code];
    if (known) {
      setLookup("local-found");
      onProductInfo && onProductInfo({ name: known });
      return;
    }

    let cancelled = false;
    setLookup("checking");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_ar,brands,quantity,categories,image_front_small_url,status`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("bad-response");
        const data = await res.json();
        if (cancelled) return;
        const p = data && data.product;
        const foundName = p && (p.product_name_ar || p.product_name);
        if (data.status === 1 && foundName) {
          const info = {
            name: foundName,
            brand: p.brands || "",
            quantity: p.quantity || "",
            category: (p.categories || "").split(",")[0] || "",
            image: p.image_front_small_url || "",
          };
          setProduct(info);
          setLookup("api-found");
          onProductInfo && onProductInfo(info);
        } else {
          setLookup("not-found");
        }
      } catch (e) {
        if (!cancelled) setLookup("offline-error");
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [value]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setError("");
    if (!("BarcodeDetector" in window)) {
      setError("الكاميرا لمسح الباركود مو مدعومة بهالمتصفح — اكتب الرقم يدويًا");
      setMode("manual");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setMode("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes[0]) {
            onChange(codes[0].rawValue);
            stopCamera();
            setMode("idle");
            return;
          }
        } catch (e) {
          /* keep trying */
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      setError("ما قدرنا نوصل للكاميرا — تأكد من إذن الوصول، أو اكتب الرقم يدويًا");
      setMode("manual");
    }
  }

  function cancelCamera() {
    stopCamera();
    setMode("idle");
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: c.inkSoft }}>
        <Barcode size={13} color={c.sageDeep} />
        الباركود (اختياري)
      </div>

      {mode === "idle" && (
        <div className="flex items-center gap-2">
          {value ? (
            <div style={{ background: c.cardSoft, border: `1px solid ${c.line}` }} className="flex-1 rounded-xl px-3 py-2 text-sm flex items-center justify-between">
              <span dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
              <button onClick={() => onChange("")} style={{ color: c.rose }} aria-label="مسح">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startCamera}
                style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
                className="pm-tap flex-1 rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Camera size={14} color={c.sageDeep} />
                مسح بالكاميرا
              </button>
              <button
                onClick={() => setMode("manual")}
                style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
                className="pm-tap flex-1 rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Keyboard size={14} color={c.sageDeep} />
                كتابة يدوية
              </button>
            </>
          )}
        </div>
      )}

      {mode === "camera" && (
        <div style={{ background: "#000", position: "relative" }} className="rounded-xl overflow-hidden">
          <video ref={videoRef} muted playsInline className="w-full h-40 object-cover" />
          <div style={{ border: `2px solid ${c.sand}`, borderRadius: 8 }} className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-14 pointer-events-none" />
          <button
            onClick={cancelCamera}
            style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
            className="absolute top-2 left-2 rounded-full p-1.5"
            aria-label="إلغاء"
          >
            <X size={14} />
          </button>
          <div style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }} className="absolute bottom-2 inset-x-2 text-[11px] text-center rounded-lg py-1">
            وجّه الكاميرا على الباركود
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب رقم الباركود"
            dir="ltr"
            style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <button onClick={() => setMode("idle")} style={{ color: c.inkSoft }} className="p-2 shrink-0" aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
      )}

      {error && <div style={{ color: c.rose }} className="text-[11px] mt-1.5">{error}</div>}

      {lookup === "checking" && (
        <div style={{ color: c.inkSoft }} className="text-[11px] mt-1.5 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" />
          يدوّر على المنتج بقاعدة Open Food Facts...
        </div>
      )}

      {lookup === "local-found" && (
        <div style={{ color: c.sageDeep }} className="text-[11px] mt-1.5">✓ عرفنا هالمنتج من مشترياتك السابقة (بدون نت)</div>
      )}

      {lookup === "api-found" && product && (
        <div style={{ background: c.sandSoft, border: `1px solid ${c.line}` }} className="rounded-xl p-2.5 mt-1.5 flex items-center gap-2.5">
          {product.image ? (
            <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div style={{ background: c.cardSoft }} className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <ShoppingBag size={16} color={c.sand} />
            </div>
          )}
          <div className="text-[11px] leading-relaxed">
            <div className="font-semibold">{product.name}</div>
            <div style={{ color: c.inkSoft }}>
              {[product.brand, product.quantity, product.category].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {lookup === "not-found" && (
        <div style={{ color: c.inkSoft }} className="text-[11px] mt-1.5">
          المنتج مو موجود بقاعدة Open Food Facts — اكتب الاسم يدويًا وبنحفظه إلك للمرة الجايه
        </div>
      )}

      {lookup === "offline-error" && (
        <div style={{ color: c.inkSoft }} className="text-[11px] mt-1.5">
          ما قدرنا نوصل للإنترنت للبحث عن المنتج — اكتب الاسم يدويًا، وبيتعرف عليه تلقائيًا أوفلاين بالمرة الجايه
        </div>
      )}
    </div>
  );
}

/* ---------- store monthly detail overlay ---------- */
function StoreDetailOverlay({ store, purchases, onClose }) {
  const now = new Date();
  const monthly = purchases.filter((p) => p.store === store && isSameMonth(p.ts, now));
  const total = monthly.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div style={{ background: c.bg }} className="absolute inset-0 z-20 flex flex-col page-fade">
      <div style={{ borderBottom: `1px solid ${c.line}` }} className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
        <button onClick={onClose} style={{ color: c.ink }} className="pm-tap p-1" aria-label="رجوع">
          <ChevronRight size={20} />
        </button>
        <div>
          <div style={{ fontFamily: "'Cairo', sans-serif" }} className="font-bold text-base">{store}</div>
          <div style={{ color: c.inkSoft }} className="text-xs">{monthLabel(now)}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div style={{ background: c.sageDeep, color: "#F5F7EF" }} className="rounded-3xl p-5 mb-4">
          <div className="text-sm opacity-90 mb-1">مجموع المشتريات هالشهر</div>
          <div dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-3xl font-bold text-left">
            {fmt(total)}
          </div>
          <div className="text-xs opacity-80 mt-1">{monthly.length} عملية شراء</div>
        </div>

        {monthly.length === 0 && (
          <div style={{ background: c.card, border: `1px solid ${c.line}`, color: c.inkSoft }} className="rounded-3xl p-6 text-sm italic text-center">
            ما في مشتريات من هالمحل هالشهر
          </div>
        )}

        {monthly.length > 0 && (
          <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-4">
            {monthly.map((it) => (
              <div key={it.id} style={{ borderBottom: `1px solid ${c.line}` }} className="flex items-start justify-between py-3 last:border-b-0">
                <div>
                  <div className="text-sm font-medium">
                    {it.name}
                    {it.quantity > 1 && <span style={{ color: c.inkSoft }}> × {it.quantity}</span>}
                  </div>
                  <div style={{ color: c.inkSoft }} className="flex items-center gap-1 text-[11px] mt-1">
                    <Clock size={11} />
                    {fmtDate(it.ts)}
                  </div>
                </div>
                <span dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.ink }} className="text-sm font-medium shrink-0">
                  {fmt(it.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(items) {
  const groups = [];
  const index = new Map();
  for (const it of items) {
    const label = dateLabel(it.ts);
    if (!index.has(label)) {
      index.set(label, { label, items: [] });
      groups.push(index.get(label));
    }
    index.get(label).items.push(it);
  }
  return groups;
}

function PurchasesPage({ items, stores, productMap, onAdd, onRemove, onAddStore, onRemoveStore }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [barcode, setBarcode] = useState("");
  const [selectedStore, setSelectedStore] = useState(stores[0] || "");
  const [addingStore, setAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [manageStores, setManageStores] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [viewStore, setViewStore] = useState(null);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const groups = useMemo(() => groupByDate(items), [items]);
  const now = new Date();

  function submit() {
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), Number(amount), selectedStore || null, barcode.trim(), Number(quantity) || 1);
    setName("");
    setAmount("");
    setQuantity("1");
    setBarcode("");
    setFormOpen(false);
  }

  function saveNewStore() {
    if (!newStoreName.trim()) return;
    onAddStore(newStoreName.trim());
    setSelectedStore(newStoreName.trim());
    setNewStoreName("");
    setAddingStore(false);
  }

  return (
    <div className="pt-1 page-fade relative h-full">
      {viewStore && <StoreDetailOverlay store={viewStore} purchases={items} onClose={() => setViewStore(null)} />}

      <div style={{ color: c.inkSoft }} className="text-sm mb-4">سجّل كل مصروف بمكانه ووقته</div>

      {/* total + add toggle */}
      <div style={{ background: c.cardSoft }} className="rounded-3xl p-5 mb-4 flex items-center justify-between">
        <div>
          <div style={{ color: c.inkSoft }} className="text-xs mb-1">إجمالي المشتريات</div>
          <div dir="ltr" style={{ color: c.sageDeep, fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-bold">
            {fmt(total)}
          </div>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          style={{ background: formOpen ? c.card : c.sageDeep, color: formOpen ? c.ink : "#fff", border: `1px solid ${formOpen ? c.line : c.sageDeep}` }}
          className="pm-tap rounded-full w-11 h-11 flex items-center justify-center shrink-0"
          aria-label={formOpen ? "إغلاق" : "إضافة مشترى"}
        >
          <Plus size={20} strokeWidth={3} style={{ transform: formOpen ? "rotate(45deg)" : "none", transition: "transform .25s ease" }} />
        </button>
      </div>

      {/* collapsible add form */}
      <div style={{ display: "grid", gridTemplateRows: formOpen ? "1fr" : "0fr", transition: "grid-template-rows .3s ease" }} className="mb-4">
        <div style={{ overflow: "hidden" }}>
          <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                autoFocus={formOpen}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="وش اشتريت؟"
                style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
              />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="السعر"
                type="number"
                dir="ltr"
                style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink, width: "76px" }}
                className="rounded-xl px-3 py-2.5 text-sm outline-none"
              />
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="الكمية"
                type="number"
                min="1"
                dir="ltr"
                style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink, width: "60px" }}
                className="rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <BarcodeField
              value={barcode}
              onChange={setBarcode}
              productMap={productMap}
              onProductInfo={(info) => setName((prev) => (prev.trim() ? prev : info.name))}
            />

            {/* store picker inline */}
            <div className="flex items-center gap-2 mb-3">
              <div className="pm-scroll flex items-center gap-2 overflow-x-auto flex-1" style={{ whiteSpace: "nowrap" }}>
                {stores.map((s) => (
                  <button
                    key={s}
                    onClick={() => (manageStores ? onRemoveStore(s) : setSelectedStore(s))}
                    style={{
                      background: manageStores ? c.roseSoft : selectedStore === s ? c.sageDeep : c.cardSoft,
                      color: manageStores ? c.rose : selectedStore === s ? "#fff" : c.ink,
                      border: `1px solid ${manageStores ? c.roseSoft : selectedStore === s ? c.sageDeep : c.line}`,
                    }}
                    className="pm-tap rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    {manageStores && <X size={11} />}
                    {s}
                  </button>
                ))}
                {!addingStore && (
                  <button
                    onClick={() => setAddingStore(true)}
                    style={{ border: `1px dashed ${c.sageDeep}`, color: c.sageDeep }}
                    className="pm-tap rounded-full px-3 py-1.5 text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus size={11} strokeWidth={3} />
                    محل
                  </button>
                )}
              </div>
              <button
                onClick={() => setManageStores((v) => !v)}
                style={{ color: manageStores ? c.sageDeep : c.inkSoft }}
                className="p-1.5 shrink-0"
                aria-label="تعديل المحلات"
              >
                <Store size={16} />
              </button>
            </div>

            {addingStore && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  autoFocus
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveNewStore()}
                  placeholder="اسم السوبر ماركت"
                  style={{ background: c.cardSoft, border: `1px solid ${c.line}`, color: c.ink }}
                  className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                />
                <button onClick={saveNewStore} style={{ background: c.sageDeep, color: "#fff" }} className="pm-tap rounded-xl p-2 shrink-0">
                  <Plus size={15} strokeWidth={3} />
                </button>
                <button onClick={() => { setAddingStore(false); setNewStoreName(""); }} style={{ color: c.inkSoft }} className="p-2 shrink-0">
                  <X size={15} />
                </button>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!name.trim() || !amount}
              style={{
                background: !name.trim() || !amount ? c.cardSoft : c.sageDeep,
                color: !name.trim() || !amount ? c.inkSoft : "#fff",
              }}
              className="pm-tap w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus size={15} strokeWidth={3} />
              إضافة المشترى
            </button>
          </div>
        </div>
      </div>

      {/* my stores — tap for monthly detail */}
      {stores.length > 0 && (
        <div className="mb-4">
          <div style={{ color: c.inkSoft }} className="text-xs font-semibold mb-2 px-1">محلاتي — دوس لتشوف مشترياتك الشهر هذا</div>
          <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-2">
            {stores.map((s) => {
              const monthTotal = items
                .filter((p) => p.store === s && isSameMonth(p.ts, now))
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
              return (
                <button
                  key={s}
                  onClick={() => setViewStore(s)}
                  style={{ borderBottom: `1px solid ${c.line}` }}
                  className="pm-tap w-full flex items-center justify-between px-3 py-3 last:border-b-0"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Store size={14} color={c.sageDeep} />
                    {s}
                  </span>
                  <span className="flex items-center gap-2">
                    <span dir="ltr" style={{ color: c.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
                      {fmt(monthTotal)}
                    </span>
                    <ChevronLeft size={15} color={c.inkSoft} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* purchases list grouped by date */}
      {groups.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, color: c.inkSoft }} className="rounded-3xl p-6 text-sm italic text-center">
          لسا ما في مشتريات مسجلة
        </div>
      )}

      {groups.map((g) => (
        <div key={g.label} className="mb-4">
          <div style={{ color: c.inkSoft }} className="text-xs font-semibold mb-2 px-1">{g.label}</div>
          <div style={{ background: c.card, border: `1px solid ${c.line}` }} className="rounded-3xl p-4">
            {g.items.map((it) => (
              <div key={it.id} style={{ borderBottom: `1px solid ${c.line}` }} className="flex items-start justify-between py-3 last:border-b-0">
                <div>
                  <div className="text-sm font-medium">
                    {it.name}
                    {it.quantity > 1 && <span style={{ color: c.inkSoft }}> × {it.quantity}</span>}
                  </div>
                  <div style={{ color: c.inkSoft }} className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] mt-1">
                    {it.store && (
                      <button onClick={() => setViewStore(it.store)} className="flex items-center gap-1 pm-tap" style={{ color: c.sageDeep }}>
                        <MapPin size={11} />
                        {it.store}
                      </button>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(it.ts).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {it.barcode && (
                      <span className="flex items-center gap-1">
                        <Barcode size={11} />
                        <span dir="ltr">{it.barcode}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.ink }} className="text-sm font-medium">
                    {fmt(it.amount)}
                  </span>
                  <button onClick={() => onRemove(it.id)} style={{ color: c.rose }} aria-label="حذف">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
