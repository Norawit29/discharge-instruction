// AI Discharge Assistant — form-based input
// Doctor selects sex + age range + diagnosis (with autosuggest),
// AI drafts the patient-facing discharge instructions.
// Screens: home (form) → generating → result → patient

const { useState, useEffect, useMemo, useRef } = React;

// ─── Palette ────────────────────────────────────────────────
const ACCENTS = {
  teal:   { name: 'เขียวมิ้นต์คลินิก', hex: 'oklch(0.55 0.085 195)', soft: 'oklch(0.93 0.025 195)' },
  ink:    { name: 'เทาน้ำเงิน',        hex: 'oklch(0.42 0.025 240)', soft: 'oklch(0.93 0.012 240)' },
  forest: { name: 'เขียวยา',           hex: 'oklch(0.48 0.07 155)',  soft: 'oklch(0.93 0.022 155)' },
  rust:   { name: 'อิฐ',               hex: 'oklch(0.55 0.11 35)',   soft: 'oklch(0.95 0.025 50)' },
};

// ─── Age ranges (5 broad buckets) ────────────────────────────
const AGE_RANGES = [
  { key: 'child',  label: '0–14 ปี',   mid: 8 },
  { key: 'young',  label: '15–39 ปี',  mid: 27 },
  { key: 'middle', label: '40–64 ปี',  mid: 52 },
  { key: 'elder',  label: '≥65 ปี',    mid: 72 },
];

// ─── Most common ED diagnoses ────────────────────────────────
const COMMON_DX = [
  { en: 'Chest pain' },
  { en: 'Shortness of breath' },
  { en: 'Abdominal pain' },
  { en: 'Fever' },
  { en: 'Headache' },
  { en: 'Dizziness / vertigo' },
  { en: 'Syncope' },
  { en: 'Palpitations' },
  { en: 'General weakness' },
  { en: 'Fatigue' },
  { en: 'Nausea' },
  { en: 'Vomiting' },
  { en: 'Diarrhea' },
  { en: 'Constipation' },
  { en: 'GI bleeding' },
  { en: 'Hematemesis' },
  { en: 'Melena' },
  { en: 'Hematochezia' },
  { en: 'Dysuria' },
  { en: 'Hematuria' },
  { en: 'Urinary retention' },
  { en: 'Flank pain' },
  { en: 'Back pain' },
  { en: 'Neck pain' },
  { en: 'Trauma' },
  { en: 'Head injury' },
  { en: 'Fall' },
  { en: 'Motor vehicle accident' },
  { en: 'Laceration' },
  { en: 'Burn injury' },
  { en: 'Fracture' },
  { en: 'Joint pain' },
  { en: 'Limb swelling' },
  { en: 'Cellulitis' },
  { en: 'Rash' },
  { en: 'Allergic reaction' },
  { en: 'Anaphylaxis' },
  { en: 'Seizure' },
  { en: 'Altered mental status' },
  { en: 'Confusion' },
  { en: 'Stroke symptoms' },
  { en: 'Facial droop' },
  { en: 'Slurred speech' },
  { en: 'Unilateral weakness' },
  { en: 'Numbness' },
  { en: 'Tremor' },
  { en: 'Anxiety / panic attack' },
  { en: 'Depression / suicidal ideation' },
  { en: 'Agitation' },
  { en: 'Insomnia' },
  { en: 'Cough' },
  { en: 'Sore throat' },
  { en: 'Nasal congestion' },
  { en: 'Hemoptysis' },
  { en: 'Wheezing' },
  { en: 'Asthma exacerbation' },
  { en: 'COPD exacerbation' },
  { en: 'Pneumonia' },
  { en: 'Upper respiratory infection' },
  { en: 'COVID-19 symptoms' },
  { en: 'Sepsis' },
  { en: 'Dehydration' },
  { en: 'Hyperglycemia' },
  { en: 'Hypoglycemia' },
  { en: 'Hypertensive urgency' },
  { en: 'Hypotension' },
  { en: 'Shock' },
  { en: 'Cardiac arrest' },
  { en: 'Acute coronary syndrome' },
  { en: 'Heart failure' },
  { en: 'Arrhythmia' },
  { en: 'Pulmonary embolism' },
  { en: 'Deep vein thrombosis' },
  { en: 'Acute gastroenteritis' },
  { en: 'Appendicitis' },
  { en: 'Cholecystitis' },
  { en: 'Pancreatitis' },
  { en: 'Hepatitis' },
  { en: 'Bowel obstruction' },
  { en: 'Kidney stone' },
  { en: 'Pyelonephritis' },
  { en: 'Urinary tract infection' },
  { en: 'Sexually transmitted infection' },
  { en: 'Vaginal bleeding' },
  { en: 'Pregnancy-related complaint' },
  { en: 'Ectopic pregnancy' },
  { en: 'Pelvic pain' },
  { en: 'Testicular pain' },
  { en: 'Eye pain' },
  { en: 'Blurred vision' },
  { en: 'Ear pain' },
  { en: 'Foreign body ingestion' },
  { en: 'Poisoning / overdose' },
  { en: 'Alcohol intoxication' },
  { en: 'Drug intoxication' },
  { en: 'Heat stroke / heat exhaustion' },
  { en: 'Animal bite' },
  { en: 'Insect bite / sting' },
  { en: 'Wound check / dressing change' },
  { en: 'Medication refill / adverse drug reaction' },
  { en: 'Diabetic ketoacidosis (DKA)' },
  { en: 'Hyperosmolar hyperglycemic state (HHS)' },
  { en: 'Hyponatremia' },
  { en: 'Hypernatremia' },
  { en: 'Hypokalemia' },
  { en: 'Hyperkalemia' },
  { en: 'Hypocalcemia' },
  { en: 'Hypercalcemia' },
  { en: 'Metabolic acidosis' },
  { en: 'Metabolic alkalosis' },
  { en: 'Respiratory acidosis' },
  { en: 'Respiratory alkalosis' },
  { en: 'Acute kidney injury' },
  { en: 'Uremia' },
  { en: 'Rhabdomyolysis' },
  { en: 'Lactic acidosis' },
  { en: 'Electrolyte imbalance' },
  { en: 'Hypothermia' },
  { en: 'Snake bite' },
  { en: 'Dog bite' },
  { en: 'Cat bite' },
  { en: 'Mammal bite' },
  { en: 'Human bite' },
  { en: 'Bee sting' },
  { en: 'Scorpion sting' },
  { en: 'Jellyfish sting' },
  { en: 'Marine envenomation' },
  { en: 'Food poisoning' },
  { en: 'Toxic ingestion' },
  { en: 'Acetaminophen overdose' },
  { en: 'Organophosphate poisoning' },
  { en: 'Carbon monoxide poisoning' },
  { en: 'Alcohol withdrawal' },
  { en: 'Drug withdrawal' },
  { en: 'Opioid overdose' },
  { en: 'Cannabis intoxication' },
  { en: 'Smoke inhalation injury' },
  { en: 'Near drowning' },
  { en: 'Electrocution' },
  { en: 'Foreign body aspiration' },
  { en: 'Choking' },
  { en: 'Epistaxis' },
  { en: 'Acute urinary retention' },
  { en: 'Testicular torsion' },
  { en: 'Acute glaucoma' },
  { en: 'UTI' },
];
const DX_INITIAL_COUNT = 10;

// ─── Mock AI output (kept; overlaid with form data) ─────────
const MOCK_RESULT_BASE = {
  severity: 'ไม่รุนแรง',
  summary: 'อาการของคุณสามารถดูแลต่อที่บ้านได้ด้วยยาที่จัดให้ ปฏิบัติตามคำแนะนำด้านล่างอย่างเคร่งครัด และสังเกตอาการเตือนที่ระบุไว้',
  medications: [
    { name: 'Amoxicillin / clavulanate', dose: '625 มก.', instructions: 'รับประทาน 1 เม็ด วันละ 3 ครั้ง พร้อมอาหาร', duration: '7 วัน' },
    { name: 'Paracetamol',               dose: '500 มก.', instructions: 'รับประทาน 1–2 เม็ด ทุก 4–6 ชม. เมื่อปวดหรือมีไข้' },
  ],
  care: [
    'รักษาบริเวณแผลให้สะอาดและแห้ง ล้างเบาๆ ด้วยสบู่และน้ำ',
    'ยกแขนสูงขณะนั่งหรือนอน เพื่อช่วยลดอาการบวม',
    'ใช้ปากกากาวงขอบรอยแดงไว้ — ไม่ควรขยายเพิ่มภายในคืนนี้',
    'รับประทานยาปฏิชีวนะให้ครบตามที่แพทย์สั่ง แม้อาการดีขึ้น',
  ],
  returnIf: [
    'รอยแดงขยายเกินเส้นที่วงไว้ หรือมีเส้นแดงลามขึ้น',
    'ไข้สูงเกิน 38.5 °C หนาวสั่น หรืออาการแย่ลงมาก',
    'มีหนอง ปวดมากขึ้น หรือชาบริเวณแผล',
    'อาเจียนจนทานยาปฏิชีวนะไม่ได้',
  ],
  followUp: { when: 'อีก 2 วัน', where: 'คลินิก ER walk-in หรือคลินิกใกล้บ้าน' },
  issuedAt: '14:32 น. · 26 พ.ค. 2569',
};

function buildResult(form) {
  const range = AGE_RANGES.find(r => r.key === form.ageRange);
  const dxLabel = form.diagnosis
    ? (form.diagnosis.th ? `${form.diagnosis.th} (${form.diagnosis.en})` : form.diagnosis.en || form.diagnosis.custom)
    : 'เนื้อเยื่ออักเสบเล็กน้อย แขนซ้ายท่อนปลาย';
  return {
    ...MOCK_RESULT_BASE,
    patient: { ageRange: range?.label || '40–64 ปี', age: range?.mid || 52, sex: form.sex || 'ชาย' },
    diagnosisTitle: dxLabel,
  };
}

function nowThai() {
  const d = new Date();
  const thYear = d.getFullYear() + 543;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${hh}:${min} น. · ${dd} ${months[d.getMonth()]} ${thYear}`;
}

// ─── OpenAI GPT-4.1-mini call ────────────────────────────────
const SYSTEM_PROMPT = `คุณคือผู้ช่วยแพทย์เวชศาสตร์ฉุกเฉิน (Emergency Department Discharge Assistant)

หน้าที่ของคุณคือสร้าง "คำแนะนำก่อนกลับบ้าน (ER Discharge Instruction)" แบบกระชับ อ่านง่าย ปลอดภัย และเหมาะกับผู้ป่วยตามข้อมูลที่ได้รับ

ข้อกำหนด:
- ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON
- ใช้ภาษาไทยที่เข้าใจง่าย เหมาะกับผู้ป่วยทั่วไป ไม่ใช้ศัพท์แพทย์
- care: 3–5 ข้อ คำแนะนำดูแลตัวเองที่บ้านที่ปฏิบัติได้จริง
- returnIf: 3–5 ข้อ อาการเตือนที่ต้องกลับมาห้องฉุกเฉินทันที เขียนให้ชัดเจนและเน้นความปลอดภัย
- followUp.when: ระยะเวลานัด เช่น "ภายใน 2–3 วัน" หรือ "ภายใน 1 สัปดาห์" หรือ "ตามอาการ"
- followUp.where: สถานที่นัด เช่น "คลินิกหรือแผนกผู้ป่วยนอก" หรือ "แพทย์ประจำตัว"

JSON schema (ตอบแค่นี้เท่านั้น):
{
  "diagnosisTitle": "ชื่อภาษาไทย (English)",
  "summary": "สรุป 1–2 ประโยค อาการและแผนการดูแล",
  "care": ["คำแนะนำ 1", "คำแนะนำ 2"],
  "returnIf": ["อาการ 1", "อาการ 2"],
  "followUp": { "when": "...", "where": "..." }
}`;

async function callOpenAI(apiKey, form) {
  if (!apiKey) throw new Error('ไม่พบ OPENAI_API_KEY — กรุณาเพิ่ม key ใน .env แล้วรีสตาร์ท serve.py');
  const range = AGE_RANGES.find(r => r.key === form.ageRange);
  const dxText = form.diagnosis?.en || form.diagnosis?.custom || 'unknown';

  const userMsg = `เพศ: ${form.sex}
ช่วงอายุ: ${range?.label || form.ageRange}
การวินิจฉัย / อาการ: ${dxText}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const ai = JSON.parse(data.choices[0].message.content);
  const rangeObj = AGE_RANGES.find(r => r.key === form.ageRange);
  return {
    diagnosisTitle: ai.diagnosisTitle || dxText,
    summary: ai.summary || '',
    care: Array.isArray(ai.care) ? ai.care : [],
    returnIf: Array.isArray(ai.returnIf) ? ai.returnIf : [],
    followUp: ai.followUp || { when: '', where: '' },
    medications: [],
    patient: { ageRange: rangeObj?.label || '', age: rangeObj?.mid || 0, sex: form.sex },
    issuedAt: nowThai(),
  };
}

// ─── Small layout helpers ────────────────────────────────────
const Stack = ({ gap = 12, ...p }) => (
  <div {...p} style={{ display: 'flex', flexDirection: 'column', gap, ...(p.style || {}) }} />
);
const Row = ({ gap = 8, ...p }) => (
  <div {...p} style={{ display: 'flex', alignItems: 'center', gap, ...(p.style || {}) }} />
);

// ─── Reusable chip button (selected / unselected) ───────────
function Chip({ selected, onClick, children, accent, size = 'md' }) {
  const pad = size === 'sm' ? '6px 12px' : '9px 14px';
  const fs = size === 'sm' ? 12.5 : 13.5;
  return (
    <button
      onClick={onClick}
      style={{
        padding: pad,
        borderRadius: 999,
        background: selected ? accent.soft : '#fff',
        border: selected
          ? `1.5px solid ${accent.hex}`
          : '1px solid var(--line-strong)',
        color: selected ? accent.hex : 'var(--ink-2)',
        fontSize: fs,
        fontWeight: selected ? 600 : 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        letterSpacing: 0.1,
        transition: 'background 120ms, border-color 120ms, color 120ms',
        boxShadow: selected ? 'none' : '0 1px 0 rgba(15,20,25,0.02)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Form section with numbered eyebrow ────────────────────
function FormSection({ n, title, hint, children }) {
  return (
    <section style={{ padding: '0 22px', marginBottom: 18 }}>
      <Row gap={8} style={{ marginBottom: 10 }}>
        <span className="mono" style={{
          fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: 0.5,
        }}>{n}</span>
        <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 700 }}>
          {title}
        </span>
        {hint && (
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 400 }}>
            {hint}
          </span>
        )}
      </Row>
      {children}
    </section>
  );
}



// ─── HOME (form) ─────────────────────────────────────────────
function HomeScreen({ accent, onGenerate }) {
  const [sex, setSex] = useState(null);
  const [ageRange, setAgeRange] = useState(null);
  const [query, setQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState(null); // { en, th } | { custom }
  const [showAll, setShowAll] = useState(false);

  const valid = !!(sex && ageRange && diagnosis);

  // filter + ordering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMON_DX;
    return COMMON_DX.filter(d =>
      d.en.toLowerCase().includes(q) || (d.th || '').toLowerCase().includes(q)
    );
  }, [query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q && COMMON_DX.some(d => d.en.toLowerCase() === q || (d.th || '').toLowerCase() === q);
  }, [query]);

  const visible = (query.trim() || showAll) ? filtered : filtered.slice(0, DX_INITIAL_COUNT);
  const hasMore = !query.trim() && !showAll && filtered.length > DX_INITIAL_COUNT;

  const sameDx = (a, b) => a && b && a.en && b.en && a.en === b.en;

  return (
    <div className="device-scroll" style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 8,
      background: 'var(--surface)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 22px 4px', display: 'flex', justifyContent: 'center' }}>
        <img
          src="assets/chula-logo.png"
          alt="โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย"
          style={{ height: 56, width: 'auto', display: 'block' }}
        />
      </div>

      {/* Title + subtitle */}
      <div style={{ padding: '16px 22px 18px' }}>
        <h1 style={{
          margin: 0, fontSize: 23, fontWeight: 700,
          letterSpacing: -0.2, color: 'var(--ink)', lineHeight: 1.25,
        }}>
          คำแนะนำผู้ป่วยกลับบ้าน
        </h1>
        <p style={{
          margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}>
          เลือกข้อมูลผู้ป่วยที่ discharge จากห้องฉุกเฉิน — ระบบจะร่างคำแนะนำให้
        </p>
      </div>

      {/* 1. เพศ */}
      <FormSection n="01" title="เพศ">
        <Row gap={8}>
          {['ชาย', 'หญิง'].map(s => (
            <Chip key={s} selected={sex === s} onClick={() => setSex(s)} accent={accent}>
              {s}
            </Chip>
          ))}
        </Row>
      </FormSection>

      {/* 2. อายุ */}
      <FormSection n="02" title="ช่วงอายุ">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AGE_RANGES.map(r => {
            const selected = ageRange === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setAgeRange(r.key)}
                style={{
                  flex: '1 1 0', minWidth: 80,
                  padding: '11px 10px',
                  borderRadius: 12,
                  background: selected ? accent.soft : '#fff',
                  border: selected
                    ? `1.5px solid ${accent.hex}`
                    : '1px solid var(--line-strong)',
                  color: selected ? accent.hex : 'var(--ink-2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600,
                  textAlign: 'center',
                  transition: 'background 120ms, border-color 120ms, color 120ms',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </FormSection>

      {/* 3. Diagnosis */}
      <FormSection n="03" title="การวินิจฉัย / อาการ">
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}>
            <circle cx="6" cy="6" r="4.2" stroke="var(--ink-3)" strokeWidth="1.4" fill="none"/>
            <path d="M9.2 9.2L12 12" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหา หรือพิมพ์เอง…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px 10px 32px',
              background: '#fff',
              border: '1px solid var(--line-strong)',
              borderRadius: 12,
              fontSize: 14, color: 'var(--ink)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = accent.hex}
            onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="ล้าง"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none',
                color: 'var(--ink-3)', cursor: 'pointer',
                width: 26, height: 26, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {visible.map(d => (
            <DxChip
              key={d.en}
              dx={d}
              selected={sameDx(diagnosis, d)}
              accent={accent}
              query={query}
              onClick={() => setDiagnosis(d)}
            />
          ))}
          {query.trim() && !exactMatch && (
            <button
              onClick={() => setDiagnosis({ en: query.trim(), th: '', custom: true })}
              style={{
                padding: '9px 14px',
                borderRadius: 999,
                background: diagnosis?.custom && diagnosis?.en === query.trim()
                  ? accent.soft : '#fff',
                border: diagnosis?.custom && diagnosis?.en === query.trim()
                  ? `1.5px solid ${accent.hex}`
                  : `1px dashed var(--line-strong)`,
                color: diagnosis?.custom && diagnosis?.en === query.trim() ? accent.hex : 'var(--ink-2)',
                fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              + ใช้ “{query.trim()}”
            </button>
          )}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: 'transparent', border: 'none',
              color: accent.hex, fontSize: 12.5, fontWeight: 600,
              padding: '10px 0 0', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ดูเพิ่ม (+{filtered.length - DX_INITIAL_COUNT})
          </button>
        )}

        {filtered.length === 0 && !query.trim() === false && (
          <div style={{
            padding: '12px 14px', marginTop: 4,
            fontSize: 12.5, color: 'var(--ink-3)',
            background: 'var(--bg)', borderRadius: 10,
          }}>
            ไม่พบในรายการ — กด <b>+ ใช้</b> เพื่อเพิ่มเอง
          </div>
        )}
      </FormSection>

      {/* Generate */}
      <div style={{ padding: '8px 22px 18px' }}>
        <button
          disabled={!valid}
          onClick={() => onGenerate({ sex, ageRange, diagnosis })}
          style={{
            width: '100%', height: 52,
            background: valid ? accent.hex : '#E8E6DF',
            color: valid ? '#fff' : 'var(--ink-3)',
            border: 'none',
            borderRadius: 14,
            fontSize: 15, fontWeight: 600, letterSpacing: 0.1,
            cursor: valid ? 'pointer' : 'not-allowed',
            boxShadow: valid ? `0 8px 20px ${accent.hex}33` : 'none',
            transition: 'background 150ms, box-shadow 150ms',
            fontFamily: 'inherit',
          }}
        >
          {valid ? 'สร้างคำแนะนำสำหรับผู้ป่วย' : 'เลือกข้อมูลให้ครบทั้ง 3 ส่วน'}
        </button>

        {/* Privacy reminder */}
        <Row gap={8} style={{ marginTop: 14, justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1l4.5 2v3.5c0 2.8-1.9 5.2-4.5 5.8C3.9 11.7 2 9.3 2 6.5V3l4.5-2z"
              stroke="var(--ink-3)" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            ไม่ต้องระบุชื่อผู้ป่วย, HN หรือข้อมูลที่ระบุตัวตน
          </span>
        </Row>
      </div>
    </div>
  );
}

// ─── Diagnosis chip with bilingual label + query highlight ─
function DxChip({ dx, selected, accent, query, onClick }) {
  const hi = (text) => {
    if (!query?.trim()) return text;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: accent.soft, color: accent.hex, borderRadius: 3, padding: '0 1px' }}>
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 14px',
        borderRadius: 999,
        background: selected ? accent.soft : '#fff',
        border: selected ? `1.5px solid ${accent.hex}` : '1px solid var(--line-strong)',
        color: selected ? accent.hex : 'var(--ink)',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
    >
      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.1 }}>
        {hi(dx.en)}
      </span>
    </button>
  );
}

// ─── GENERATING ──────────────────────────────────────────────
function GeneratingScreen({ accent, formData, apiKey, onDone, onError }) {
  const [step, setStep] = useState(0);
  const [errMsg, setErrMsg] = useState(null);
  const steps = [
    'ตรวจสอบข้อมูลที่ป้อน',
    'ส่งข้อมูลไปยัง AI',
    'ปรับให้เหมาะกับอายุ/เพศ',
    'เตรียมหน้าคำแนะนำ',
  ];

  useEffect(() => {
    let cancelled = false;

    // Advance step 0→1 immediately, then call the API
    const t0 = setTimeout(() => { if (!cancelled) setStep(1); }, 400);

    callOpenAI(apiKey, formData)
      .then(result => {
        if (cancelled) return;
        setStep(2);
        setTimeout(() => {
          if (cancelled) return;
          setStep(3);
          setTimeout(() => { if (!cancelled) onDone(result); }, 500);
        }, 500);
      })
      .catch(err => {
        if (cancelled) return;
        setErrMsg(err.message || 'เกิดข้อผิดพลาด');
      });

    return () => { cancelled = true; clearTimeout(t0); };
  }, []);

  if (errMsg) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--surface)', paddingTop: 'env(safe-area-inset-top, 0px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 22px 4px', display: 'flex', justifyContent: 'center' }}>
          <img src="assets/chula-logo.png" alt="" style={{ height: 48, width: 'auto' }} />
        </div>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '0 24px 40px', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--warn-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l9.5 16.5H2.5L12 2z" stroke="var(--warn)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
              <rect x="11.1" y="9" width="1.8" height="5.5" rx="0.6" fill="var(--warn)"/>
              <rect x="11.1" y="15.5" width="1.8" height="1.8" rx="0.6" fill="var(--warn)"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>สร้างคำแนะนำไม่สำเร็จ</div>
            <div style={{
              fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5,
              background: '#fff', border: '1px solid var(--line)',
              borderRadius: 10, padding: '10px 14px', maxWidth: 280,
              fontFamily: 'monospace', wordBreak: 'break-all',
            }}>{errMsg}</div>
          </div>
          <Stack gap={8} style={{ width: '100%', maxWidth: 280 }}>
            <button onClick={onError} style={{
              width: '100%', height: 46,
              background: accent.hex, color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← ย้อนกลับ</button>
          </Stack>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--surface)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 22px 4px', display: 'flex', justifyContent: 'center' }}>
        <img
          src="assets/chula-logo.png"
          alt="โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย"
          style={{ height: 48, width: 'auto', display: 'block' }}
        />
      </div>
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px 40px',
      }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: '#fff', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
        boxShadow: '0 8px 30px rgba(15,20,25,0.06)',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2.5px solid ${accent.hex}`,
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 18 }}>
        กำลังสร้างหน้าคำสั่งกลับบ้าน
      </div>
      <Stack gap={8} style={{ width: '100%', maxWidth: 280 }}>
        {steps.map((s, i) => (
          <Row key={i} gap={10}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: i <= step ? `none` : '1.5px solid var(--line-strong)',
              background: i < step ? accent.hex : (i === step ? accent.hex : 'transparent'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {i < step && (
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M1.5 4l1.7 1.7L7 2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 13.5,
              color: i <= step ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i === step ? 600 : 400,
            }}>{s}</span>
          </Row>
        ))}
      </Stack>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── QR (สำหรับผู้ป่วยสแกน) ─────────────────────────────────
function QrScreen({ accent, result, onBack, onNew }) {
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(() => {
    const payload = {
      diagnosisTitle: result.diagnosisTitle,
      summary: result.summary,
      care: result.care,
      returnIf: result.returnIf,
      followUp: result.followUp,
      issuedAt: result.issuedAt,
    };
    fetch('/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(({ url }) => setQrUrl(url))
      .catch(() => {
        // fallback: build URL without server
        const ip = window.LOCAL_IP || 'localhost';
        const port = window.LOCAL_PORT || 8765;
        setQrUrl(`http://${ip}:${port}/`);
      });
  }, []);

  const shortUrl = qrUrl
    ? qrUrl.replace(/^https?:\/\//, '')
    : '…';

  return (
    <div className="device-scroll" style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      background: 'var(--surface)',
    }}>
      <div style={{ padding: '20px 22px 4px', display: 'flex', justifyContent: 'center' }}>
        <img
          src="assets/chula-logo.png"
          alt="โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย"
          style={{ height: 48, width: 'auto', display: 'block' }}
        />
      </div>
      <div style={{ padding: '12px 22px 0' }}>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <span style={{
            background: accent.soft, color: accent.hex,
            fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4,
            padding: '4px 8px', borderRadius: 999,
          }}>ยืนยันแล้ว · พร้อมส่งให้ผู้ป่วย</span>
        </Row>
        <h2 style={{
          margin: 0, fontSize: 20, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: -0.1, lineHeight: 1.3,
        }}>
          ให้ผู้ป่วยหรือญาติสแกน QR
        </h2>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
          ผู้ป่วย{result.patient.sex} {result.patient.ageRange} · {result.diagnosisTitle}
        </div>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        <div style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: '24px 18px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: '0 1px 0 rgba(15,20,25,0.02)',
        }}>
          <div style={{ position: 'relative', padding: 8, background: '#fff' }}>
            <FakeQR value={qrUrl || ''} size={196} fg="#0F1419" bg="#ffffff" />
            {qrUrl && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32, height: 32, borderRadius: 7,
                background: accent.hex,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid #fff',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7.5l2.8 2.5 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 14, fontWeight: 500 }}>
            ผู้ป่วย / ญาติสแกนเพื่อเปิดหน้าคำแนะนำ
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4, textAlign: 'center', wordBreak: 'break-all' }}>
            {shortUrl}
          </div>
        </div>
      </div>

      <Stack gap={10} style={{ padding: '22px 22px 28px' }}>
        <button onClick={onBack} style={{
          width: '100%', height: 44,
          background: 'transparent', color: 'var(--ink-2)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ← ย้อนกลับ ดู / แก้คำแนะนำ
        </button>
        <button onClick={onNew} style={{
          width: '100%', height: 48,
          background: accent.hex, color: '#fff',
          border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          boxShadow: `0 6px 16px ${accent.hex}33`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          เริ่มสรุปใหม่
        </button>
      </Stack>
    </div>
  );
}

// ─── PATIENT (คำแนะนำ — ตรวจทาน/แก้ไข + ยืนยัน) ──────────────
function PatientScreen({ accent, result, onResultChange, onConfirm, onNew }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <PatientView
        data={result}
        accent={accent.hex}
        editable
        onChange={onResultChange}
      />
      {/* Sticky bottom action bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 16px 22px',
        background: 'linear-gradient(to top, #F7F6F3 78%, rgba(247,246,243,0))',
        display: 'flex', gap: 8,
        zIndex: 10,
      }}>
        <button onClick={onNew} style={{
          flex: '0 0 auto',
          height: 50, padding: '0 16px',
          background: '#fff', color: 'var(--ink-2)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          เริ่มใหม่
        </button>
        <button onClick={onConfirm} style={{
          flex: 1,
          height: 50,
          background: accent.hex, color: '#fff',
          border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          boxShadow: `0 6px 16px ${accent.hex}33`,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3.2 3 6.8-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ยืนยัน → สร้าง QR สำหรับผู้ป่วย
        </button>
      </div>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────
function App() {
  const accent = ACCENTS.forest;

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent.hex);
    document.documentElement.style.setProperty('--accent-soft', accent.soft);
  }, []);

  const [screen, setScreen] = useState('home');
  const [apiKey] = useState(() => window.OPENAI_API_KEY || '');

  const [formData, setFormData] = useState({
    sex: 'ชาย',
    ageRange: 'middle',
    diagnosis: COMMON_DX[2],
  });

  const [aiResult, setAiResult] = useState(null);
  const fallback = useMemo(() => buildResult(formData), [formData]);
  const [resultOverrides, setResultOverrides] = useState(null);
  const liveResult = resultOverrides || aiResult || fallback;
  useEffect(() => { setAiResult(null); setResultOverrides(null); }, [formData]);

  const go = (s) => setScreen(s);

  const handleGenerate = (form) => {
    setFormData(form);
    go('generating');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {screen === 'home' && (
        <HomeScreen accent={accent} onGenerate={handleGenerate} />
      )}
      {screen === 'generating' && (
        <GeneratingScreen
          accent={accent} formData={formData} apiKey={apiKey}
          onDone={(result) => { setAiResult(result); go('patient'); }}
          onError={() => go('home')}
        />
      )}
      {screen === 'patient' && (
        <PatientScreen
          accent={accent} result={liveResult}
          onResultChange={setResultOverrides}
          onConfirm={() => go('qr')}
          onNew={() => go('home')}
        />
      )}
      {screen === 'qr' && (
        <QrScreen accent={accent} result={liveResult} onBack={() => go('patient')} onNew={() => go('home')} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
