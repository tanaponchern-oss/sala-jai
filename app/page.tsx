"use client";

import { useEffect, useRef, useState } from "react";
import { looksAtRisk } from "@/lib/safety";
import { HOTLINES, MONK } from "@/lib/site";

type Tab = "home" | "chat" | "monk" | "breath";
type Msg = { role: "user" | "assistant"; content: string };

const GREETING = "สวัสดี ยินดีที่ได้พบนะ วันนี้มีเรื่องอะไรค้างอยู่ในใจ อยากเล่าให้ฟังไหม ค่อย ๆ เล่าได้ตามสบาย";
const STARTERS = [
  "ช่วงนี้นอนไม่หลับ คิดวนเรื่องงาน",
  "เพิ่งสูญเสียคนที่รัก ทำใจไม่ได้",
  "โกรธคนในครอบครัวบ่อย อยากใจเย็นลง",
];
const TABS: [Tab, string][] = [
  ["home", "หน้าแรก"],
  ["chat", "คุยกับเพื่อนธรรม"],
  ["monk", "ติดต่อพระอาจารย์"],
  ["breath", "ฝึกลมหายใจ"],
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [crisis, setCrisis] = useState(false);

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>ศาลาใจ</h1>
          <p className="sub">พื้นที่พักใจ คุยระบายและรับคำแนะนำด้วยหลักพุทธจิตวิทยา ไม่ต้องสมัครสมาชิก</p>
        </div>
        <button className="crisis-btn" type="button" onClick={() => setCrisis((c) => !c)}>
          ต้องการความช่วยเหลือด่วน
        </button>
      </header>

      {crisis && <CrisisBox />}

      <nav role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} type="button">
            {label}
          </button>
        ))}
      </nav>

      <section hidden={tab !== "home"}>
        <p className="verse">
          “จิตที่ฝึกดีแล้ว นำสุขมาให้”<small>จิตฺตํ ทนฺตํ สุขาวหํ · ขุททกนิกาย ธรรมบท</small>
        </p>
        <p>ไม่ว่าจะเป็นความทุกข์ใจ ความเครียดจากงาน ความสัมพันธ์ หรือความสูญเสีย ที่นี่พร้อมรับฟังโดยไม่ตัดสิน เลือกทางที่เหมาะกับคุณในตอนนี้</p>
        <div className="paths">
          <button className="path" type="button" onClick={() => setTab("chat")}>
            <h3>ระบายกับเพื่อนธรรม</h3>
            <p className="note">ผู้ช่วย AI ที่รับฟังและชวนพิจารณาด้วยหลักธรรม คุยได้ทันทีทุกเวลา ไม่ต้องสมัครสมาชิก</p>
            <span className="go">เริ่มคุย</span>
          </button>
          <button className="path" type="button" onClick={() => setTab("monk")}>
            <h3>คุยกับพระอาจารย์</h3>
            <p className="note">ปรึกษาตัวต่อตัวกับ{MONK.name} {MONK.temple}</p>
            <span className="go">ดูช่องทางติดต่อ</span>
          </button>
          <button className="path" type="button" onClick={() => setTab("breath")}>
            <h3>พักใจ 3 นาที</h3>
            <p className="note">ฝึกอานาปานสติ หายใจเข้า “พุท” หายใจออก “โธ” ให้ใจสงบลง</p>
            <span className="go">เริ่มฝึก</span>
          </button>
        </div>
        <p className="note">
          ความเป็นส่วนตัว: ไม่ต้องใช้ชื่อจริง และศาลาใจไม่บันทึกบทสนทนาของคุณไว้ที่เซิร์ฟเวอร์ เมื่อปิดหน้านี้บทสนทนาจะหายไป
          ศาลาใจไม่ใช่บริการทางการแพทย์ หากมีอาการซึมเศร้าหรือวิตกกังวลรุนแรง ควรพบจิตแพทย์หรือนักจิตวิทยาควบคู่กันไป
        </p>
      </section>

      <section hidden={tab !== "chat"}>
        <Chat onRisk={() => setCrisis(true)} goMonk={() => setTab("monk")} />
      </section>

      <section hidden={tab !== "monk"}>
        <MonkContact />
      </section>

      <section hidden={tab !== "breath"}>
        <Breathing />
      </section>

      <footer>ศาลาใจ · ดูแลโดย{MONK.name} {MONK.temple}</footer>
    </div>
  );
}

function CrisisBox() {
  return (
    <div className="crisis" role="alert">
      <strong>ถ้าคุณกำลังคิดทำร้ายตัวเอง หรือรู้สึกไม่ปลอดภัยในตอนนี้</strong>
      <p>คุณไม่ได้อยู่คนเดียว โปรดโทรคุยกับผู้เชี่ยวชาญได้ทันที ตลอด 24 ชั่วโมง</p>
      <div className="lines">
        {HOTLINES.map((h) => (
          <a key={h.number} href={`tel:${h.number.replace(/-/g, "")}`}>
            {h.label} <b>{h.number}</b>
          </a>
        ))}
      </div>
    </div>
  );
}

function Chat({ onRisk, goMonk }: { onRisk: () => void; goMonk: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  async function send(text: string) {
    text = text.trim();
    if (!text || busy) return;
    if (looksAtRisk(text)) onRisk();
    setError("");
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...history, { role: "assistant", content: "กำลังรับฟัง..." }]);
    setInput("");
    setBusy(true);
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-40) }),
      });
      if (res.headers.get("X-Risk") === "1") onRisk();
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: reply }]);
      }
      if (!res.ok) {
        // Drop the failed turn so the history keeps alternating user/assistant.
        setMsgs(msgs);
        setError(reply || "ส่งข้อความไม่สำเร็จ ลองอีกครั้งได้เลย");
        setInput(text);
      }
    } catch {
      setMsgs(msgs);
      setError("เชื่อมต่อไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองส่งอีกครั้งนะ");
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  // The greeting is shown only; the history sent to the server starts with the user.
  const shown: Msg[] = [{ role: "assistant", content: GREETING }, ...msgs];

  return (
    <>
      <div className="row-between">
        <div>
          <h2>เพื่อนธรรม</h2>
          <p className="note">ผู้ช่วย AI ที่รับฟังและแนะนำด้วยหลักพุทธจิตวิทยา ไม่ใช่พระภิกษุ หากอยากคุยเชิงลึก <a href="#" onClick={(e) => { e.preventDefault(); goMonk(); }}>ติดต่อพระอาจารย์</a></p>
        </div>
        {msgs.length > 0 && (
          <button className="btn ghost small" type="button" disabled={busy} onClick={() => { setMsgs([]); setError(""); }}>
            ล้างบทสนทนา
          </button>
        )}
      </div>
      <div className="chat">
        <div className="log" ref={logRef} aria-live="polite">
          {shown.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "me" : "ai"}`}>{m.content}</div>
          ))}
        </div>
        <div className="compose">
          <textarea
            id="msg"
            rows={2}
            maxLength={2000}
            placeholder="พิมพ์สิ่งที่อยู่ในใจ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button className="btn" type="button" disabled={busy || !input.trim()} onClick={() => send(input)}>ส่ง</button>
        </div>
      </div>
      {error && <p className="note" role="status">{error}</p>}
      {msgs.length === 0 && (
        <div className="chips">
          {STARTERS.map((s) => (
            <button key={s} className="chip" type="button" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
    </>
  );
}

function MonkContact() {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <h2>คุยกับพระอาจารย์</h2>
      <div className="profile">
        <div className="avatar">ธ</div>
        <div>
          <h3>{MONK.name}</h3>
          <p className="note">{MONK.temple} · ให้คำปรึกษาด้วยหลักพุทธจิตวิทยา</p>
          <div className="phone">
            <span className="note">โทรติดต่อ</span>
            <b>{MONK.phoneDisplay}</b>
            <a className="btn small" href={`tel:${MONK.phone}`}>โทรเลย</a>
            <button
              className="btn ghost small"
              type="button"
              onClick={async () => {
                try { await navigator.clipboard.writeText(MONK.phone); setCopied(true); } catch { /* number stays selectable */ }
              }}
            >
              {copied ? "คัดลอกแล้ว" : "คัดลอกเบอร์"}
            </button>
          </div>
        </div>
      </div>
      <p className="note">โทรมาเพื่อนัดเวลาสนทนา ไม่ต้องบอกชื่อจริงก็ได้ เรื่องที่เล่าจะเก็บเป็นความลับ</p>
    </>
  );
}

function Breathing() {
  const TOTAL = 18; // 18 rounds of 4s in + 6s out = 3 minutes
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"idle" | "in" | "out" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPhase("idle");
    setRound(0);
  }
  function start() {
    let r = 0;
    const inhale = () => {
      if (r >= TOTAL) { setPhase("done"); timer.current = null; return; }
      r += 1; setRound(r); setPhase("in");
      timer.current = setTimeout(exhale, 4000);
    };
    const exhale = () => { setPhase("out"); timer.current = setTimeout(inhale, 6000); };
    inhale();
  }

  const running = phase === "in" || phase === "out";
  const word = phase === "in" ? "พุท" : phase === "out" ? "โธ" : phase === "done" ? "สาธุ" : "พุทโธ";
  const count = phase === "in" ? `รอบที่ ${round} จาก ${TOTAL} · หายใจเข้า`
    : phase === "out" ? `รอบที่ ${round} จาก ${TOTAL} · หายใจออก`
    : phase === "done" ? "ครบ 3 นาทีแล้ว ลองสังเกตว่าใจตอนนี้เป็นอย่างไร"
    : "พร้อมเมื่อไหร่ กดเริ่มได้เลย";

  return (
    <>
      <div>
        <h2>อานาปานสติ 3 นาที</h2>
        <p className="note">นั่งในท่าที่สบาย หายใจเข้าช้า ๆ ภาวนา “พุท” หายใจออกยาว ๆ ภาวนา “โธ” ถ้าใจลอยไป ก็แค่รู้ แล้วกลับมาที่ลมหายใจ</p>
      </div>
      <div className="breath">
        <div className={`circle ${phase === "in" ? "in" : phase === "out" ? "out" : ""}`}><span>{word}</span></div>
        <p className="count">{count}</p>
        <button className="btn" type="button" onClick={running ? stop : start}>
          {running ? "หยุด" : phase === "done" ? "เริ่มอีกครั้ง" : "เริ่ม"}
        </button>
      </div>
    </>
  );
}
