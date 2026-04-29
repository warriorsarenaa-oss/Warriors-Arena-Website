/* global React, Icon, GAMES, BUNDLES, TIME_SLOTS, fmt, genCode, useI18n, useState, useEffect, useMemo */

// ==========================================================================
// RESERVATION WIZARD — 5 steps + success
// ==========================================================================

function Wizard({ onClose, seedItem }) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(1);
  const [pick, setPick] = useState(seedItem?.duration ? { kind: seedItem.players ? "bundle" : "game", item: seedItem } : null);
  const [players, setPlayers] = useState(seedItem?.players || 4);
  const [duration, setDuration] = useState(seedItem?.duration || 30);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [info, setInfo] = useState({ name:"", phone:"", email:"" });
  const [confirmed, setConfirmed] = useState(null);

  const maxPlayers = 6;

  const livePrice = useMemo(() => {
    if (!pick) return 0;
    if (pick.kind === "bundle") {
      return pick.item.mode === "per_player"
        ? pick.item.price * Math.max(players, pick.item.players)
        : pick.item.price;
    }
    // game
    const basePerPlayer = duration === 60 ? pick.item.price * 1.6 : pick.item.price;
    return Math.round(basePerPlayer * players);
  }, [pick, players, duration]);

  const next = () => setStep(s => Math.min(5, s+1));
  const back = () => setStep(s => Math.max(1, s-1));

  function submit() {
    setConfirmed({ code: genCode(), price: livePrice, pick, players, duration, date, time, info });
  }

  // pre-seed: if we came from a bundle, lock players/duration
  useEffect(()=> {
    if (seedItem) {
      if (seedItem.players) {
        setPick({ kind:"bundle", item: seedItem });
        setPlayers(seedItem.players);
        setDuration(seedItem.duration);
      } else {
        setPick({ kind:"game", item: seedItem });
        setDuration(seedItem.duration);
      }
      setStep(2);
    }
  }, [seedItem]);

  if (confirmed) return <SuccessScreen data={confirmed} onClose={onClose}/>;

  return (
    <div style={{
      position:"fixed", inset: 0, zIndex: 100,
      background:"rgba(5,7,5,.92)", backdropFilter:"blur(8px)",
      overflow:"auto",
      animation:"wa-fadein-up 300ms ease",
    }}>
      <div style={{ maxWidth: 1080, margin:"0 auto", padding: "32px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 24 }}>
          <div>
            <div className="wa-mono" style={{ fontSize:11, color:"var(--wa-green)", letterSpacing:".25em" }}>// RESERVATION</div>
            <div className="wa-h-display" style={{ fontSize: 32, marginTop: 4 }}>BOOKING PROTOCOL</div>
          </div>
          <button onClick={onClose} className="wa-btn wa-btn--ghost wa-btn-sm" aria-label="close">
            <Icon.x size={16}/> CLOSE
          </button>
        </div>

        <StepIndicator step={step}/>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap: 20, marginTop: 24, alignItems:"start" }}>
          <div className="wa-panel wa-panel--clip" style={{ padding: 28, minHeight: 500 }}>
            {step === 1 && <StepGame value={pick} onChange={setPick}/>}
            {step === 2 && <StepConfigure pick={pick} players={players} setPlayers={setPlayers} duration={duration} setDuration={setDuration} maxPlayers={maxPlayers}/>}
            {step === 3 && <StepDate value={date} onChange={setDate}/>}
            {step === 4 && <StepTime value={time} onChange={setTime}/>}
            {step === 5 && <StepInfo info={info} setInfo={setInfo}/>}

            <div style={{ display:"flex", gap: 12, marginTop: 28, justifyContent:"space-between" }}>
              <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={back} disabled={step===1} style={{ opacity: step===1?.3:1 }}>
                <Icon.arrowL size={14}/> {t("back")}
              </button>
              {step < 5 ? (
                <button className="wa-btn" onClick={next}
                  disabled={(step===1 && !pick) || (step===3 && !date) || (step===4 && !time)}
                  style={{ opacity: ((step===1 && !pick) || (step===3 && !date) || (step===4 && !time))?.4:1 }}>
                  {t("next")} <Icon.arrow size={14}/>
                </button>
              ) : (
                <button className="wa-btn" onClick={submit} disabled={!info.name || !info.phone}>
                  <Icon.lock size={14}/> {t("confirm")}
                </button>
              )}
            </div>
          </div>

          <OrderSummary pick={pick} players={players} duration={duration} date={date} time={time} price={livePrice}/>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }) {
  const { t } = useI18n();
  const labels = [t("chooseGame"), t("configure"), t("selectDate"), t("selectTime"), t("yourInfo")];
  return (
    <div className="wa-panel" style={{ padding: "14px 20px", display:"flex", alignItems:"center", gap: 0 }}>
      {labels.map((label, i)=>{
        const n = i+1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={i}>
            <div style={{ display:"flex", alignItems:"center", gap: 10, opacity: active||done?1:.5, flex: 1 }}>
              <div style={{
                width: 32, height: 32,
                display:"grid", placeItems:"center",
                background: done ? "var(--wa-green)" : active ? "transparent" : "transparent",
                color: done ? "#0a0d0a" : active ? "var(--wa-green)" : "var(--wa-text-mute)",
                border: active ? "1px solid var(--wa-green)" : done ? "1px solid var(--wa-green)" : "1px solid var(--wa-line)",
                fontFamily:"var(--ff-display)", fontSize: 13,
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}>
                {done ? <Icon.check size={14}/> : String(n).padStart(2,"0")}
              </div>
              <div>
                <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".15em" }}>{t("step")} {n}</div>
                <div className="wa-ui" style={{ fontSize: 12, color: active?"var(--wa-green)":"var(--wa-text)" }}>{label}</div>
              </div>
            </div>
            {i < labels.length-1 && (
              <div style={{ width: 20, height: 1, background: done?"var(--wa-green)":"var(--wa-line)", flexShrink: 0, marginInline: 4 }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepGame({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div>
      <Heading kicker="01 / 05" title={t("chooseGame")} sub="Pick a game or jump straight into a pre-built bundle."/>

      <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", marginTop: 24, marginBottom: 10, letterSpacing:".15em" }}>// SINGLE GAMES</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 12 }}>
        {GAMES.map(g=>(
          <PickCard key={g.id}
            active={value?.kind==='game' && value.item.id===g.id}
            onClick={()=>onChange({ kind:"game", item: g })}
            icon={g.type==='laser'?<Icon.bolt size={18}/>:<Icon.target size={18}/>}
            title={g.name}
            price={`${fmt(g.price)} EGP`}
            meta={`${g.duration}M · ${t("perPlayer").toUpperCase()}`}
          />
        ))}
      </div>

      <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", marginTop: 28, marginBottom: 10, letterSpacing:".15em" }}>// BUNDLES</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 12 }}>
        {BUNDLES.map(b=>(
          <PickCard key={b.id}
            active={value?.kind==='bundle' && value.item.id===b.id}
            onClick={()=>onChange({ kind:"bundle", item: b })}
            icon={<Icon.spark size={18}/>}
            title={b.name}
            price={b.mode==='per_player' ? `${fmt(b.price)} EGP/PL` : `${fmt(b.price)} EGP`}
            meta={`${b.players} PL · ${b.duration}M`}
            orange
          />
        ))}
      </div>
    </div>
  );
}

function PickCard({ active, onClick, icon, title, price, meta, orange }) {
  return (
    <button onClick={onClick}
      className="wa-panel"
      style={{
        padding: 18, textAlign:"start", cursor:"pointer", color:"var(--wa-text)",
        borderColor: active ? (orange?"var(--wa-orange)":"var(--wa-green)") : "var(--wa-line)",
        boxShadow: active ? (orange?"0 0 0 1px var(--wa-orange), 0 0 24px rgba(255,122,26,.18)":"var(--wa-green-glow)") : "none",
        background: active ? "rgba(143,224,74,.05)" : "var(--wa-panel)",
        transition: "all 150ms",
      }}>
      <div style={{ color: orange?"var(--wa-orange)":"var(--wa-green)" }}>{icon}</div>
      <div className="wa-h-display" style={{ fontSize: 18, marginTop: 10 }}>{title}</div>
      <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", marginTop: 4, letterSpacing:".12em" }}>{meta}</div>
      <div className="wa-h-display" style={{ fontSize: 20, color: orange?"var(--wa-orange)":"var(--wa-green)", marginTop: 12 }}>{price}</div>
    </button>
  );
}

function StepConfigure({ pick, players, setPlayers, duration, setDuration, maxPlayers }) {
  const { t } = useI18n();
  const isBundle = pick?.kind === "bundle";
  const lockedPlayers = isBundle && pick.item.mode === "fixed_total";
  return (
    <div>
      <Heading kicker="02 / 05" title={t("configure")} sub={isBundle ? "Bundle config — some knobs are locked." : "Tune the squad size and run length."}/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 20, marginTop: 20 }}>
        <div className="wa-panel" style={{ padding: 20 }}>
          <div className="wa-label">{t("players")}</div>
          <div style={{ display:"flex", alignItems:"center", gap: 14, marginTop: 10 }}>
            <IconRoundBtn onClick={()=>!lockedPlayers && setPlayers(Math.max(2, players-1))} disabled={lockedPlayers}><Icon.minus size={18}/></IconRoundBtn>
            <div style={{ flex: 1, textAlign:"center" }}>
              <div className="wa-h-display" style={{ fontSize: 58, color:"var(--wa-green)", lineHeight:1 }}>{players}</div>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".2em", marginTop: 6 }}>MAX {maxPlayers} · MIN 2</div>
            </div>
            <IconRoundBtn onClick={()=>!lockedPlayers && setPlayers(Math.min(maxPlayers, players+1))} disabled={lockedPlayers}><Icon.plus size={18}/></IconRoundBtn>
          </div>
          {lockedPlayers && <div className="wa-tag wa-tag--orange" style={{marginTop:14}}><Icon.lock size={12}/> FIXED-TEAM BUNDLE · Locked to {pick.item.players}</div>}
        </div>

        <div className="wa-panel" style={{ padding: 20 }}>
          <div className="wa-label">{t("duration")}</div>
          <div style={{ display:"flex", gap: 10, marginTop: 10 }}>
            {[30, 60].map(d=>(
              <button key={d} onClick={()=>!isBundle && setDuration(d)} disabled={isBundle}
                className="wa-panel"
                style={{
                  flex:1, padding:"22px 14px", cursor: isBundle?"not-allowed":"pointer",
                  color: duration===d ? "#0a0d0a" : "var(--wa-text)",
                  background: duration===d ? "var(--wa-green)" : "var(--wa-panel)",
                  borderColor: duration===d ? "var(--wa-green)" : "var(--wa-line)",
                  opacity: isBundle && duration!==d ? .3 : 1,
                }}>
                <div className="wa-h-display" style={{ fontSize: 36, lineHeight: 1 }}>{d}</div>
                <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".18em", opacity:.7 }}>MINUTES</div>
              </button>
            ))}
          </div>
          {isBundle && <div className="wa-tag" style={{marginTop:14}}><Icon.lock size={12}/> BUNDLE SETS DURATION</div>}
        </div>
      </div>

      {pick?.kind==='bundle' && pick.item.mode==='per_player' && players < pick.item.players && (
        <div className="wa-panel" style={{ marginTop: 16, padding: 14, borderColor:"rgba(255,192,67,.4)", background:"rgba(255,192,67,.06)" }}>
          <div className="wa-mono" style={{ fontSize:11, color:"var(--wa-amber)", letterSpacing:".15em" }}>
            ⚠ BUNDLE MIN · Billing will use {pick.item.players} players minimum ({fmt(pick.item.price * pick.item.players)} EGP)
          </div>
        </div>
      )}
    </div>
  );
}

function IconRoundBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: 44, height: 44, border:"1px solid var(--wa-line-hot)",
        background: disabled ? "var(--wa-panel)" : "var(--wa-panel-2)",
        color: disabled?"var(--wa-text-mute)":"var(--wa-green)",
        cursor: disabled?"not-allowed":"pointer",
        display:"grid", placeItems:"center",
      }}>{children}</button>
  );
}

function StepDate({ value, onChange }) {
  const { t } = useI18n();
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const view = new Date(today.getFullYear(), today.getMonth()+monthOffset, 1);
  const monthName = view.toLocaleString("en-US", { month:"long", year:"numeric" });
  const firstDay = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  function isPast(d) {
    if (!d) return true;
    const cand = new Date(view.getFullYear(), view.getMonth(), d);
    const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cand < today0;
  }
  function isClosed(d) {
    // pretend Mondays are closed-day overrides
    if (!d) return false;
    return new Date(view.getFullYear(), view.getMonth(), d).getDay() === 1;
  }

  return (
    <div>
      <Heading kicker="03 / 05" title={t("selectDate")} sub="Pick a day. Mondays closed for maintenance."/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop: 20, marginBottom: 14 }}>
        <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={()=>setMonthOffset(monthOffset-1)} disabled={monthOffset<=0} style={{opacity:monthOffset<=0?.3:1}}>
          <Icon.arrowL size={14}/>
        </button>
        <div className="wa-h-display" style={{ fontSize: 24 }}>{monthName}</div>
        <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={()=>setMonthOffset(monthOffset+1)}>
          <Icon.arrow size={14}/>
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap: 4 }}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".2em", textAlign:"center", paddingBlock: 8 }}>{d}</div>
        ))}
        {cells.map((d,i)=>{
          if (d===null) return <div key={i}/>;
          const closed = isClosed(d);
          const past = isPast(d);
          const disabled = past || closed;
          const selected = value && value.d===d && value.m===view.getMonth() && value.y===view.getFullYear();
          return (
            <button key={i} disabled={disabled}
              onClick={()=>onChange({ d, m: view.getMonth(), y: view.getFullYear() })}
              className="wa-panel"
              style={{
                aspectRatio: "1", padding: 0, position:"relative",
                cursor: disabled?"not-allowed":"pointer",
                opacity: past?.35:1,
                background: selected ? "var(--wa-green)" : closed ? "#0e110f" : "var(--wa-panel)",
                color: selected ? "#0a0d0a" : closed ? "#3a3e3a" : "var(--wa-text)",
                borderColor: selected ? "var(--wa-green)" : "var(--wa-line)",
                fontFamily: "var(--ff-mono)", fontSize: 14,
              }}>
              {d}
              {closed && !past && <div style={{ position:"absolute", bottom: 4, left: 0, right: 0, fontSize: 8, letterSpacing:".15em" }}>CLOSED</div>}
            </button>
          );
        })}
      </div>

      <Legend/>
    </div>
  );
}

function Legend() {
  const items = [
    ["var(--wa-green)","Selected"],
    ["var(--wa-panel)","Available"],
    ["#0e110f","Closed day"],
  ];
  return (
    <div style={{ display:"flex", gap: 18, marginTop: 18 }}>
      {items.map(([c,l])=>(
        <div key={l} style={{ display:"flex", alignItems:"center", gap: 8 }}>
          <div style={{ width: 14, height: 14, background: c, border:"1px solid var(--wa-line)" }}/>
          <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-dim)", letterSpacing:".1em" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function StepTime({ value, onChange }) {
  const { t } = useI18n();
  // fake statuses
  const statuses = { "6:00 PM":"available", "6:30 PM":"booked", "7:00 PM":"available", "7:30 PM":"available", "8:00 PM":"booked", "8:30 PM":"available", "9:00 PM":"closing" };
  return (
    <div>
      <Heading kicker="04 / 05" title={t("selectTime")} sub="Each slot is venue-wide exclusive — only one team on the field."/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
        {TIME_SLOTS.map(slot=>{
          const status = statuses[slot];
          const selected = value === slot;
          const cls = selected ? "wa-slot wa-slot--selected" : `wa-slot wa-slot--${status}`;
          return (
            <button key={slot} className={cls} onClick={()=>status==='available' && onChange(slot)} style={{ padding: "18px 8px" }}>
              <div className="wa-h-display" style={{ fontSize: 22 }}>{slot}</div>
              <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".15em", marginTop: 6, opacity:.7 }}>
                {status === 'available' && (selected ? "LOCKED" : "AVAILABLE")}
                {status === 'booked' && "BOOKED"}
                {status === 'closing' && "CLOSING"}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap: 14, marginTop: 22, flexWrap:"wrap" }}>
        {[
          ["available","Available","var(--wa-green)"],
          ["booked","Booked","var(--wa-red)"],
          ["closing","Closing soon","var(--wa-amber)"],
          ["closed","Closed day","var(--wa-text-mute)"],
        ].map(([k,l,c])=>(
          <div key={k} style={{ display:"flex", alignItems:"center", gap: 8 }}>
            <div className={`wa-slot wa-slot--${k}`} style={{ width: 22, height: 22, padding: 0 }}/>
            <div className="wa-mono" style={{ fontSize: 11, color:c, letterSpacing:".1em" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepInfo({ info, setInfo }) {
  const { t } = useI18n();
  return (
    <div>
      <Heading kicker="05 / 05" title={t("yourInfo")} sub="Just enough to hold your slot."/>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginTop: 20, maxWidth: 520 }}>
        <div>
          <label className="wa-label">{t("fullName")} *</label>
          <input className="wa-input" value={info.name} onChange={e=>setInfo({...info, name:e.target.value})} placeholder="Cpt. Warrior"/>
        </div>
        <div>
          <label className="wa-label">{t("phone")} *</label>
          <input className="wa-input" value={info.phone} onChange={e=>setInfo({...info, phone:e.target.value})} placeholder="+20 122 xxx xxxx"/>
        </div>
        <div>
          <label className="wa-label">{t("email")}</label>
          <input className="wa-input" value={info.email} onChange={e=>setInfo({...info, email:e.target.value})} placeholder="you@warriors.egy"/>
        </div>
        <div className="wa-panel" style={{ padding: 14, marginTop: 8, borderColor:"rgba(255,122,26,.3)" }}>
          <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-orange)", letterSpacing:".18em", marginBottom: 6 }}>⚠ DEPOSIT REQUIRED</div>
          <div style={{ fontSize: 13, color:"var(--wa-text-dim)", lineHeight: 1.5 }}>
            50% deposit confirms your slot. We'll send InstaPay / WhatsApp instructions after you confirm.
          </div>
        </div>
      </div>
    </div>
  );
}

function Heading({ kicker, title, sub }) {
  return (
    <div>
      <div className="wa-mono" style={{ fontSize:11, color:"var(--wa-green)", letterSpacing:".25em" }}>{kicker}</div>
      <div className="wa-h-display" style={{ fontSize: 36, marginTop: 4 }}>{title}</div>
      {sub && <p style={{ color:"var(--wa-text-dim)", fontSize: 15, marginTop: 8, maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function OrderSummary({ pick, players, duration, date, time, price }) {
  const { t } = useI18n();
  return (
    <div className="wa-panel wa-panel--clip wa-brackets" style={{ padding: 22, position:"sticky", top: 20 }}>
      <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".25em" }}>// ORDER RECEIPT</div>
      <div className="wa-h-display" style={{ fontSize: 22, marginTop: 6 }}>YOUR BOOKING</div>

      <div style={{ marginTop: 18, display:"flex", flexDirection:"column", gap: 10 }}>
        <SummaryRow k="GAME" v={pick?.item?.name || "—"}/>
        <SummaryRow k="PLAYERS" v={players}/>
        <SummaryRow k="DURATION" v={`${duration}M`}/>
        <SummaryRow k="DATE" v={date ? `${String(date.m+1).padStart(2,'0')}/${String(date.d).padStart(2,'0')}/${date.y}` : "—"}/>
        <SummaryRow k="TIME" v={time || "—"}/>
      </div>

      <div style={{ borderTop:"1px dashed var(--wa-line-hot)", margin:"18px 0 14px" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"end" }}>
        <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>{t("totalPrice").toUpperCase()}</div>
        <div className="wa-h-display" style={{ fontSize: 32, color:"var(--wa-green)" }}>
          {price ? fmt(price) : "—"} <span style={{ fontSize: 12, color:"var(--wa-text-dim)" }}>EGP</span>
        </div>
      </div>
      <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", textAlign:"end", marginTop: 2 }}>
        50% DEPOSIT · {price ? fmt(Math.round(price/2)) : "—"} EGP DUE NOW
      </div>
    </div>
  );
}

function SummaryRow({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap: 10 }}>
      <span className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".15em" }}>{k}</span>
      <span style={{ fontSize: 14, color:"var(--wa-text)", textAlign:"end" }}>{v}</span>
    </div>
  );
}

// ------- SUCCESS SCREEN -------------------------------------------------
function SuccessScreen({ data, onClose }) {
  const { t } = useI18n();
  return (
    <div style={{
      position:"fixed", inset: 0, zIndex: 200,
      background:"#0a0d0a",
      overflow:"auto",
    }}>
      {/* animated background */}
      <div className="wa-anim-grid" style={{ position:"absolute", inset:0, opacity:.6 }}/>
      <div className="wa-scanline"/>
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(50% 40% at 50% 40%, rgba(143,224,74,.12), transparent 70%)" }}/>

      <div style={{ position:"relative", zIndex: 2, maxWidth: 760, margin:"0 auto", padding:"60px 24px" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{
            width: 96, height: 96, margin:"0 auto",
            display:"grid", placeItems:"center",
            background:"var(--wa-green)", color:"#0a0d0a",
            clipPath:"polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)",
            animation:"wa-count 700ms ease both",
          }}>
            <Icon.check size={48}/>
          </div>
          <div className="wa-mono" style={{ fontSize: 12, color:"var(--wa-green)", letterSpacing:".3em", marginTop: 22, animation:"wa-fadein-up 700ms ease .2s both" }}>
            // TRANSMISSION RECEIVED
          </div>
          <h1 className="wa-h-display" style={{ fontSize:"clamp(56px, 10vw, 110px)", marginTop: 8, lineHeight:.9,
            animation:"wa-fadein-up 700ms cubic-bezier(.2,1.1,.2,1) .3s both" }}>
            YOU'RE<br/><span style={{ color:"var(--wa-green)" }}>{t("locked")}</span>
          </h1>
        </div>

        <div className="wa-panel wa-panel--clip wa-brackets" style={{ padding: 30, marginTop: 44,
          animation:"wa-fadein-up 800ms ease .5s both" }}>
          <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".25em" }}>{t("reservationCode").toUpperCase()}</div>
          <div className="wa-h-display" style={{
            fontSize: "clamp(42px, 8vw, 64px)", color:"var(--wa-green)",
            letterSpacing:".08em", marginTop: 6, wordBreak:"break-all",
            textShadow:"0 0 24px rgba(143,224,74,.4)",
          }}>
            {data.code}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 16, marginTop: 28, paddingBlock: 18, borderTop:"1px dashed var(--wa-line-hot)", borderBottom:"1px dashed var(--wa-line-hot)" }}>
            <SuccessStat k="GAME" v={data.pick?.item?.name || "—"}/>
            <SuccessStat k="PLAYERS" v={data.players}/>
            <SuccessStat k="DATE" v={data.date ? `${data.date.m+1}/${data.date.d}` : "—"}/>
            <SuccessStat k="TIME" v={data.time || "—"}/>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 14, marginTop: 20, flexWrap:"wrap" }}>
            <div>
              <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>TOTAL · 50% DEPOSIT DUE</div>
              <div className="wa-h-display" style={{ fontSize: 28, color:"var(--wa-green)", marginTop: 2 }}>
                {fmt(Math.round(data.price/2))} / {fmt(data.price)} EGP
              </div>
            </div>
            <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
              <button className="wa-btn"><Icon.whatsapp size={16}/> {t("sendWhatsapp")}</button>
              <button className="wa-btn wa-btn--ghost"><Icon.download size={16}/> {t("downloadReceipt")}</button>
            </div>
          </div>
        </div>

        <div className="wa-panel" style={{ padding: 20, marginTop: 18, display:"flex", alignItems:"center", gap: 14,
          borderColor:"rgba(255,122,26,.3)", animation:"wa-fadein-up 800ms ease .7s both" }}>
          <Icon.shield size={22} style={{ color:"var(--wa-orange)" }}/>
          <div style={{ fontSize: 14, color:"var(--wa-text-dim)" }}>
            {t("parkFee")}
          </div>
        </div>

        <button onClick={onClose} className="wa-btn wa-btn--ghost" style={{ marginTop: 24 }}>
          <Icon.arrowL size={14}/> BACK TO SITE
        </button>
      </div>
    </div>
  );
}

function SuccessStat({ k, v }) {
  return (
    <div>
      <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>{k}</div>
      <div className="wa-h-display" style={{ fontSize: 20, marginTop: 4 }}>{v}</div>
    </div>
  );
}

Object.assign(window, {
  Wizard, SuccessScreen, StepIndicator,
});
