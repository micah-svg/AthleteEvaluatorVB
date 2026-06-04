import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, Search, Undo2, Check } from "lucide-react";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

const C = {
  blue: "#1A3CA0",
  navy: "#14213E",
  gold: "#FCB712",
  cream: "#FAF6EB",
  card: "#FFFFFF",
  body: "#3A3A3A",
  muted: "#7A7A7A",
  line: "#E7E2D2",
  good: "#1F9D55",
  bad: "#D64545",
};
const DISPLAY = "'Barlow Condensed', sans-serif";
const BODY = "'DM Sans', sans-serif";
const AXIS = { physical: "#6B7A99", performance: "#1A3CA0", culture: "#E0A100" };
const AXIS_LABEL = { physical: "Physical", performance: "Performance", culture: "Culture" };


const POS_FULL = { S: "Setter", OH: "Outside", OPP: "Opposite", MB: "Middle", L: "Libero", DS: "Def. Spec." };

function initialsOf(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

// ----------------------------------------------------------------------------

export default function EvaluationCapture() {
  const { user, coachKey, coachName } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [sessSnap, athSnap, metSnap] = await Promise.all([
          getDocs(collection(db, "sessions")),
          getDocs(collection(db, "athletes")),
          getDocs(collection(db, "metrics")),
        ]);
        setSessions(sessSnap.docs.map((d) => ({ sessionId: d.id, ...d.data() })));
        setAthletes(
          athSnap.docs
            .map((d) => ({ athleteId: d.id, ...d.data() }))
            .filter((a) => a.status !== "withdrawn" && a.eligibilityStatus !== "ineligible_grades")
            .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
        );
        setMetrics(metSnap.docs.map((d) => ({ metricKey: d.id, ...d.data() })));
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [step, setStep] = useState("session");
  const [session, setSession] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [metric, setMetric] = useState(null);

  const [reps, setReps] = useState([]);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  async function saveEvaluation(record) {
    setSaving(true);
    try {
      await addDoc(collection(db, "evaluations"), {
        ...record,
        uid: user.uid,
        evaluatorId: coachKey,
        evaluatorName: coachName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
      });
      setLastSaved(record);
      setSavedCount((n) => n + 1);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetCapture() { setReps([]); setValue(""); setNote(""); }
  function goTo(s) { setStep(s); }

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) =>
      (a.fullName || "").toLowerCase().includes(q) || String(a.tryoutNumber || "").includes(q)
    );
  }, [searchQuery, athletes]);

  const metricsForSession = useMemo(() => {
    if (!session || !session.focusMetrics || session.focusMetrics.length === 0) return metrics;
    return metrics.filter((m) => session.focusMetrics.includes(m.metricKey));
  }, [session, metrics]);

  const applicableMetrics = useMemo(() => {
    const base = showAllMetrics ? metrics : metricsForSession;
    if (!athlete) return base;
    return base.filter((m) => (m.appliesTo || []).includes(athlete.primaryPosition));
  }, [metricsForSession, metrics, athlete, showAllMetrics]);

  async function handleSave() {
    const base = {
      athleteId: athlete.athleteId,
      sessionId: session.sessionId,
      metricKey: metric.metricKey,
      note: note.trim(),
    };
    const record = metric.repBased ? { ...base, reps, repCount: reps.length } : { ...base, value: Number(value) };
    await saveEvaluation(record);
    resetCapture();
    setStep("saved");
  }

  const canSave = metric ? (metric.repBased ? reps.length > 0 : value !== "") : false;

  function backOneStep() {
    if (step === "athlete") goTo("session");
    else if (step === "metric") goTo("athlete");
    else if (step === "capture") { resetCapture(); goTo("metric"); }
  }

  const fonts = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes pop { 0%{transform:scale(.85);opacity:.4} 100%{transform:scale(1);opacity:1} }
      @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
    `}</style>
  );

  const header = (
    <div style={{ background: C.blue, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {step !== "session" && step !== "saved" && (
          <button onClick={backOneStep} style={iconBtn}><ChevronLeft size={22} color="#fff" /></button>
        )}
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: 0.5 }}>
          BARLOW <span style={{ color: C.gold }}>EVAL</span>
        </span>
      </div>
      <span style={{ fontFamily: BODY, fontSize: 12, color: "rgba(255,255,255,.85)" }}>{savedCount} saved</span>
    </div>
  );

  const breadcrumb = (
    <div style={{ padding: "10px 18px 0", fontFamily: BODY, fontSize: 12, color: C.muted, display: "flex", gap: 6, flexWrap: "wrap" }}>
      {session && <span><strong style={{ color: C.blue }}>{session.name.split(" — ")[0]}</strong></span>}
      {athlete && <span>· {athlete.fullName}</span>}
      {metric && step === "capture" && <span>· {metric.label}</span>}
    </div>
  );

  if (loading) return (
    <div style={previewFrame}>
      <div style={{ ...screen, alignItems: 'center', justifyContent: 'center' }}>
        {fonts}
        <p style={{ fontFamily: BODY, color: C.muted }}>Loading…</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div style={previewFrame}>
      <div style={{ ...screen, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {fonts}
        <p style={{ fontFamily: BODY, color: C.bad, textAlign: 'center' }}>Failed to load data: {loadError}</p>
      </div>
    </div>
  );

  return (
    <div style={previewFrame}>
      <div style={screen}>
        {fonts}
        {header}
        {step !== "session" && step !== "saved" && breadcrumb}

        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {step === "session" && (
            <Section title="Select Session" sub="Where are you scoring right now?">
              {sessions.map((s) =>
                s.scoring ? (
                  <RowCard key={s.sessionId} onClick={() => { setSession(s); goTo("athlete"); }}
                    title={s.name} sub={`Day ${s.dayNumber} · ${s.focusMetrics.length} focus metrics`} />
                ) : (
                  <div key={s.sessionId} style={disabledCard}>
                    <span style={{ width: 4, alignSelf: "stretch", background: C.line, borderRadius: 2, marginRight: 12 }} />
                    <span style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: C.muted }}>{s.name}</span>
                      <span style={{ fontFamily: BODY, fontSize: 12, color: C.muted }}>Not scored — familiarity only</span>
                    </span>
                  </div>
                )
              )}
            </Section>
          )}

          {step === "athlete" && (
            <Section title="Select Athlete">
              <div style={searchWrap}>
                <Search size={18} color={C.muted} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name" style={searchInput} />
              </div>
              {filteredAthletes.map((a) => (
                <button key={a.athleteId} onClick={() => { setAthlete(a); setShowAllMetrics(false); goTo("metric"); }} style={athleteRow}>
                  <span style={avatar}>{initialsOf(a.fullName)}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: C.navy }}>{a.fullName}</span>
                    <span style={{ fontFamily: BODY, fontSize: 12, color: C.muted }}>{POS_FULL[a.primaryPosition]} · {a.gradeLevel}</span>
                  </span>
                  <span style={numTag}>#{a.tryoutNumber}</span>
                </button>
              ))}
            </Section>
          )}

          {step === "metric" && (
            <Section title="Performance Area" sub={`${athlete.fullName} · ${POS_FULL[athlete.primaryPosition]}`}>
              {applicableMetrics.map((m) => (
                <button key={m.metricKey} onClick={() => { setMetric(m); resetCapture(); goTo("capture"); }} style={metricCard}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: AXIS[m.axis] }} />
                    <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: AXIS[m.axis] }}>{m.category}</span>
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, color: C.navy }}>{m.label}</span>
                </button>
              ))}
              <button onClick={() => setShowAllMetrics((v) => !v)} style={ghostBtn}>
                {showAllMetrics ? "Show session focus only" : "Show all metrics for this position"}
              </button>
            </Section>
          )}

          {step === "capture" && (
            <CapturePanel metric={metric} reps={reps} setReps={setReps} value={value} setValue={setValue}
              note={note} setNote={setNote} canSave={canSave} onSave={handleSave} saving={saving} />
          )}

          {step === "saved" && (
            <SavedPanel last={lastSaved} athlete={athlete}
              onAnotherMetric={() => goTo("metric")}
              onNextAthlete={() => { setAthlete(null); setMetric(null); setSearchQuery(""); goTo("athlete"); }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- capture panel ---------------------------------------------------------

function CapturePanel({ metric, reps, setReps, value, setValue, note, setNote, canSave, onSave, saving }) {
  const isScale = metric.inputType.startsWith("scale_") && metric.repBased;
  const isTally = metric.inputType === "tally_KEIP";
  const isSingleNum = metric.inputType === "inches" || metric.inputType === "seconds";
  const isRating15 = metric.inputType === "scale_1_5";

  const tap = (v) => setReps((r) => [...r, v]);
  const undo = () => setReps((r) => r.slice(0, -1));

  const stats = useMemo(() => {
    if (isScale) {
      const avg = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
      return { count: reps.length, avg, errs: reps.filter((n) => n === 0).length };
    }
    if (isTally) {
      const K = reps.filter((r) => r === "K").length;
      const E = reps.filter((r) => r === "E").length;
      const IP = reps.filter((r) => r === "IP").length;
      const total = reps.length;
      return { K, E, IP, total, eff: total ? (K - E) / total : 0 };
    }
    return {};
  }, [reps, isScale, isTally]);

  const scaleKeys = isScale ? Object.keys(metric.scaleLegend).map(Number).sort((a, b) => a - b) : [];
  const axisColor = AXIS[metric.axis];

  return (
    <div style={{ animation: "slideUp .2s ease" }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: axisColor }} />
          <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: axisColor }}>{AXIS_LABEL[metric.axis]} · {metric.category}</span>
        </span>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, color: C.navy, lineHeight: 1 }}>{metric.label}</div>
      </div>

      {(isScale || isTally) && (
        <div style={readout}>
          {isScale && (<>
            <Stat label="Reps" v={stats.count} />
            <Stat label="Avg" v={stats.avg.toFixed(2)} accent />
            <Stat label="Errors" v={stats.errs} />
          </>)}
          {isTally && (<>
            <Stat label="K" v={stats.K} color={C.good} />
            <Stat label="E" v={stats.E} color={C.bad} />
            <Stat label="IP" v={stats.IP} />
            <Stat label="Eff" v={stats.eff.toFixed(3)} accent />
          </>)}
        </div>
      )}

      {(isScale || isTally) && reps.length > 0 && (
        <div style={repStrip}>
          {reps.slice(-14).map((r, i) => (<span key={i} style={{ ...repChip, animation: "pop .15s ease" }}>{r}</span>))}
        </div>
      )}

      {isScale && (
        <div style={{ display: "grid", gap: 10 }}>
          {scaleKeys.map((k) => (
            <button key={k} onClick={() => tap(k)} style={bigTap}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, color: C.blue, width: 34 }}>{k}</span>
              <span style={{ fontFamily: BODY, fontSize: 15, color: C.body }}>{metric.scaleLegend[k]}</span>
            </button>
          ))}
        </div>
      )}

      {isTally && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <button onClick={() => tap("K")} style={{ ...keipTap, borderColor: C.good }}><b style={{ color: C.good }}>K</b><span style={keipLabel}>Kill</span></button>
          <button onClick={() => tap("E")} style={{ ...keipTap, borderColor: C.bad }}><b style={{ color: C.bad }}>E</b><span style={keipLabel}>Error</span></button>
          <button onClick={() => tap("IP")} style={{ ...keipTap, borderColor: C.line }}><b style={{ color: C.navy }}>IP</b><span style={keipLabel}>In Play</span></button>
        </div>
      )}

      {isSingleNum && (
        <div>
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal"
            placeholder={metric.inputType === "inches" ? "Reach in inches (e.g. 114)" : "Seconds (e.g. 4.62)"} style={numInput} />
          <div style={{ fontFamily: BODY, fontSize: 12, color: C.muted, marginTop: 6 }}>
            {metric.inputType === "inches" ? "Higher is better" : "Lower is faster"}
          </div>
        </div>
      )}

      {isRating15 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setValue(String(n))}
              style={{ ...ratingTap, ...(value === String(n) ? { background: C.blue, color: "#fff", borderColor: C.blue } : {}) }}>{n}</button>
          ))}
        </div>
      )}

      {(isScale || isTally) && (
        <button onClick={undo} disabled={reps.length === 0} style={{ ...ghostBtn, opacity: reps.length ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
          <Undo2 size={16} /> Undo last
        </button>
      )}

      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Coach note (optional)" style={noteBox} />

      <button onClick={onSave} disabled={!canSave || saving} style={{ ...saveBtn, opacity: canSave && !saving ? 1 : 0.45 }}>
        <Check size={20} /> {saving ? "Saving…" : "Save Evaluation"}
      </button>
    </div>
  );
}

function SavedPanel({ last, athlete, onAnotherMetric, onNextAthlete }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 30, animation: "slideUp .2s ease" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.good, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Check size={34} color="#fff" />
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: C.navy }}>Saved</div>
      <div style={{ fontFamily: BODY, fontSize: 14, color: C.muted, marginBottom: 24 }}>
        {last && `${last.metricKey} for ${athlete?.fullName}`}
      </div>
      <button onClick={onAnotherMetric} style={saveBtn}>Score another metric (same athlete)</button>
      <button onClick={onNextAthlete} style={{ ...ghostBtn, marginTop: 12 }}>Next athlete</button>
    </div>
  );
}

// ---- presentational helpers ------------------------------------------------

function Section({ title, sub, children }) {
  return (
    <div>
      <div style={{ width: 46, height: 4, background: C.gold, borderRadius: 2, marginBottom: 8 }} />
      <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, color: C.navy, margin: 0, textTransform: "uppercase" }}>{title}</h2>
      {sub && <p style={{ fontFamily: BODY, fontSize: 13, color: C.muted, margin: "2px 0 16px" }}>{sub}</p>}
      <div style={{ display: "grid", gap: 10, marginTop: sub ? 0 : 14 }}>{children}</div>
    </div>
  );
}
function RowCard({ title, sub, onClick }) {
  return (
    <button onClick={onClick} style={rowCard}>
      <span style={{ width: 4, alignSelf: "stretch", background: C.gold, borderRadius: 2, marginRight: 12 }} />
      <span style={{ textAlign: "left" }}>
        <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: C.navy }}>{title}</span>
        <span style={{ fontFamily: BODY, fontSize: 12, color: C.muted }}>{sub}</span>
      </span>
    </button>
  );
}
function Stat({ label, v, accent, color }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: color || (accent ? C.blue : C.navy) }}>{v}</div>
      <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>{label}</div>
    </div>
  );
}

// ---- styles ----------------------------------------------------------------

const previewFrame = { display: "flex", justifyContent: "center", background: "#E9E6DC", padding: 20, minHeight: "100vh" };
const screen = { width: "100%", maxWidth: 412, background: C.cream, borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", minHeight: 720 };
const iconBtn = { background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, padding: 4, display: "flex", cursor: "pointer" };
const rowCard = { display: "flex", alignItems: "center", background: C.card, border: "none", borderRadius: 14, padding: "14px 16px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const disabledCard = { display: "flex", alignItems: "center", background: "#F1EEE3", border: "none", borderRadius: 14, padding: "14px 16px", opacity: 0.85 };
const searchWrap = { display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12 };
const searchInput = { border: "none", outline: "none", fontFamily: BODY, fontSize: 16, flex: 1, background: "transparent", color: C.navy };
const athleteRow = { display: "flex", alignItems: "center", gap: 14, background: C.card, border: "none", borderRadius: 14, padding: "12px 14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const avatar = { display: "flex", alignItems: "center", justifyContent: "center", minWidth: 42, height: 42, borderRadius: "50%", background: "#EEF1FA", color: C.blue, fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: 0.5 };
const numTag = { fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: C.muted, background: "#F1EEE3", borderRadius: 7, padding: "2px 8px" };
const metricCard = { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", background: C.card, borderLeft: `4px solid ${C.gold}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const ghostBtn = { background: "transparent", border: `1.5px solid ${C.blue}`, color: C.blue, fontFamily: BODY, fontWeight: 600, fontSize: 14, borderRadius: 12, padding: "12px 16px", cursor: "pointer", width: "100%" };
const readout = { display: "flex", background: C.card, borderRadius: 14, padding: "14px 8px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const repStrip = { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 };
const repChip = { minWidth: 26, textAlign: "center", padding: "4px 6px", borderRadius: 7, background: "#EEF1FA", color: C.blue, fontFamily: DISPLAY, fontWeight: 700, fontSize: 14 };
const bigTap = { display: "flex", alignItems: "center", gap: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", textAlign: "left" };
const keipTap = { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: C.card, border: "2px solid", borderRadius: 14, padding: "18px 0", cursor: "pointer", fontFamily: DISPLAY, fontSize: 26, fontWeight: 800 };
const keipLabel = { fontFamily: BODY, fontSize: 11, fontWeight: 600, color: C.muted };
const numInput = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px", fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: C.navy, outline: "none" };
const ratingTap = { background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "16px 0", fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: C.navy, cursor: "pointer" };
const noteBox = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, fontFamily: BODY, fontSize: 14, marginTop: 14, minHeight: 56, resize: "vertical", outline: "none", color: C.navy };
const saveBtn = { width: "100%", background: C.blue, color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 };
