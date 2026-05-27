// PatientView — the page the QR code opens.
// When `editable` is true, all text fields can be tap-to-edit; changes flow up
// via `onChange(newData)`. Used for the doctor's "ตรวจทาน/แก้ไข" pass.

const { useRef: _useRef, useEffect: _useEffect, useState: _useState } = React;

// Tap-to-edit text. Uses contentEditable so blocks like h1 / paragraphs keep
// their natural typographic styles. Set the DOM text imperatively so React
// doesn't re-render and steal focus mid-edit.
function EditableText({ value, onChange, multiline, asBlock, style, accent }) {
  const ref = _useRef(null);
  const [focused, setFocused] = _useState(false);

  _useEffect(() => {
    if (ref.current && ref.current.innerText !== (value || '')) {
      ref.current.innerText = value || '';
    }
  }, [value]);

  if (!onChange) {
    return asBlock ? <div style={style}>{value}</div> : <span style={style}>{value}</span>;
  }

  const Tag = asBlock ? 'div' : 'span';
  const accentColor = accent || 'oklch(0.55 0.085 195)';
  const accentSoft = 'oklch(0.97 0.014 195)';

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.style.background = accentSoft;
        e.currentTarget.style.boxShadow = `inset 0 0 0 1.5px ${accentColor}`;
      }}
      onBlur={(e) => {
        setFocused(false);
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
        const newVal = e.currentTarget.innerText.trim();
        if (newVal !== value) onChange(newVal);
      }}
      onMouseEnter={(e) => {
        if (focused) return;
        e.currentTarget.style.background = 'rgba(15,20,25,0.035)';
      }}
      onMouseLeave={(e) => {
        if (focused) return;
        e.currentTarget.style.background = 'transparent';
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.innerText = value || '';
          e.currentTarget.blur();
        }
      }}
      style={{
        outline: 'none',
        cursor: 'text',
        borderRadius: 6,
        padding: '2px 6px',
        margin: '-2px -6px',
        transition: 'background 120ms, box-shadow 120ms',
        minWidth: 12,
        ...style,
      }}
    />
  );
}

function PatientView({ data, accent, editable, onChange }) {
  const A = accent || 'oklch(0.55 0.085 195)';
  const D = data;
  const edit = editable ? onChange : null;

  const updateField = (k, v) => edit && edit({ ...D, [k]: v });
  const updateArr = (k, i, v) => {
    if (!edit) return;
    const arr = [...D[k]];
    arr[i] = v;
    edit({ ...D, [k]: arr });
  };
  const updateFollow = (k, v) => edit && edit({ ...D, followUp: { ...D.followUp, [k]: v } });

  const Section = ({ title, n, children }) => (
    <section style={{ padding: '0 22px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 11, color: A, letterSpacing: 1, fontWeight: 600 }}>
          0{n}
        </span>
        <h3 style={{
          margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: -0.1,
        }}>{title}</h3>
      </div>
      {children}
    </section>
  );

  return (
    <div className="device-scroll" style={{
      position: 'absolute', inset: 0,
      background: '#F7F6F3',
      overflowY: 'auto',
      fontFamily: "'IBM Plex Sans Thai', 'Plus Jakarta Sans', system-ui",
      paddingTop: 60,
      paddingBottom: editable ? 110 : 60,
    }}>
      {/* Top header: hospital logo */}
      <div style={{
        padding: '14px 22px 18px',
        borderBottom: '1px solid var(--line)',
        marginBottom: 18,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <img
          src="assets/chula-logo.png"
          alt="โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย"
          style={{ height: 52, width: 'auto', display: 'block' }}
        />
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.2 }}>
          {D.issuedAt}
        </span>
      </div>

      {/* Edit-mode hint */}
      {editable && (
        <div style={{
          margin: '0 22px 18px',
          padding: '10px 12px',
          background: '#fff',
          border: `1px dashed ${A}`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: A }}>
            <path d="M9 2l3 3-7 7H2v-3l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>
            ตรวจทานคำแนะนำที่ AI ร่างไว้ — แตะข้อความเพื่อแก้ไข แล้วกดยืนยันด้านล่าง
          </span>
        </div>
      )}

      {/* Hero */}
      <div style={{ padding: '0 22px 24px' }}>
        <h1 style={{
          margin: 0, fontSize: 28, lineHeight: 1.2, fontWeight: 700,
          letterSpacing: -0.4, color: 'var(--ink)', textWrap: 'pretty',
        }}>
          <EditableText
            value={D.diagnosisTitle}
            onChange={edit && ((v) => updateField('diagnosisTitle', v))}
            accent={A}
          />
        </h1>
        <p style={{
          margin: '12px 0 0', fontSize: 15.5, lineHeight: 1.55,
          color: 'var(--ink-2)', textWrap: 'pretty',
        }}>
          <EditableText
            value={D.summary}
            onChange={edit && ((v) => updateField('summary', v))}
            multiline
            accent={A}
          />
        </p>
      </div>

      {/* Care at home */}
      <Section title="การดูแลตัวที่บ้าน" n="1">
        <ul style={{
          margin: 0, padding: 0, listStyle: 'none',
          display: 'flex', flexDirection: 'column', gap: 9,
        }}>
          {D.care.map((c, i) => (
            <li key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '11px 14px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--line)',
              fontSize: 14.5, lineHeight: 1.45, color: 'var(--ink)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999,
                background: A, marginTop: 8, flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <EditableText
                  value={c}
                  onChange={edit && ((v) => updateArr('care', i, v))}
                  multiline asBlock
                  accent={A}
                />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Return precautions */}
      <Section title="กลับมาห้องฉุกเฉินถ้า" n="2">
        <div style={{
          background: 'var(--warn-soft)',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid oklch(0.88 0.05 50)',
        }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {D.returnIf.map((r, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 14.5, lineHeight: 1.45, color: 'oklch(0.35 0.1 30)',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: 4 }}>
                  <path d="M7 1l6 11H1L7 1z" fill="oklch(0.62 0.14 35)" />
                  <rect x="6.3" y="5" width="1.4" height="4" fill="#fff" rx="0.4"/>
                  <rect x="6.3" y="9.6" width="1.4" height="1.4" fill="#fff" rx="0.4"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EditableText
                    value={r}
                    onChange={edit && ((v) => updateArr('returnIf', i, v))}
                    multiline asBlock
                    accent={A}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Follow-up */}
      <Section title="นัดติดตามอาการ" n="3">
        <div style={{
          background: '#fff',
          border: `1.5px solid ${A}`,
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'oklch(0.93 0.025 195)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: A, flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M3 9h16M8 3v4M14 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              <EditableText
                value={D.followUp.when}
                onChange={edit && ((v) => updateFollow('when', v))}
                accent={A}
              />
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.5 }}>
              <EditableText
                value={D.followUp.where}
                onChange={edit && ((v) => updateFollow('where', v))}
                multiline asBlock
                accent={A}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Footer caretag */}
      <div style={{
        padding: '20px 22px 8px',
        borderTop: '1px solid var(--line)',
        marginTop: 8,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.3 }}>
          ออกเมื่อ {D.issuedAt} · ห้องฉุกเฉิน
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.3 }}>
          สร้างโดย AI · ตรวจสอบโดยแพทย์เจ้าของไข้
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
          ข้อมูลนี้เป็นเพียงคำแนะนำเบื้องต้น หากมีเหตุฉุกเฉินโทร 1669 หรือห้องฉุกเฉินทันที
        </div>
      </div>
    </div>
  );
}

window.PatientView = PatientView;
