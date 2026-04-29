/* global React, Icon, GAMES, BUNDLES, TIME_SLOTS, fmt, useState, useMemo */

// ==========================================================================
// ADMIN DASHBOARD
// ==========================================================================

const ADMIN_NAV = [
  { id:"home", label:"Dashboard", icon:"crosshair" },
  { id:"ops",  label:"Control Center", icon:"target" },
  { id:"rev",  label:"Revenue", icon:"bolt" },
  { id:"slots",label:"Slot Management", icon:"clock" },
  { id:"price",label:"Pricing", icon:"shield" },
  { id:"bund", label:"Bundles", icon:"spark" },
];

function Admin({ onExit }) {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState("home");

  if (!authed) return <AdminLogin onAuth={()=>setAuthed(true)} onExit={onExit}/>;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--wa-bg)" }}>
      <AdminSidebar route={route} setRoute={setRoute} onExit={onExit}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <AdminTopbar/>
        <main style={{ padding: 28, maxWidth: 1400, margin:"0 auto" }}>
          {route === "home"  && <AdminHome setRoute={setRoute}/>}
          {route === "ops"   && <ControlCenter/>}
          {route === "rev"   && <RevenuePage/>}
          {route === "slots" && <SlotMgmt/>}
          {route === "price" && <PricingPage/>}
          {route === "bund"  && <BundlesMgmt/>}
        </main>
      </div>
    </div>
  );
}

function AdminLogin({ onAuth, onExit }) {
  return (
    <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding: 24, position:"relative" }}>
      <div className="wa-anim-grid" style={{ position:"absolute", inset:0, opacity:.5 }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(40% 40% at 50% 40%, rgba(143,224,74,.08), transparent 70%)" }}/>

      <div className="wa-panel wa-panel--clip wa-brackets" style={{ position:"relative", width: 420, padding: 34, zIndex: 2 }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <div style={{ width:36, height:36, background:"var(--wa-green)", display:"grid", placeItems:"center",
            clipPath:"polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)", color:"#0a0d0a" }}>
            <Icon.crosshair size={20}/>
          </div>
          <div>
            <div className="wa-h-display" style={{ fontSize: 18 }}>WARRIORS ARENA</div>
            <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-green)", letterSpacing:".3em" }}>// COMMAND CONSOLE</div>
          </div>
        </div>

        <div style={{ marginTop: 28, display:"flex", flexDirection:"column", gap: 14 }}>
          <div>
            <label className="wa-label">OPERATOR EMAIL</label>
            <input className="wa-input" defaultValue="ops@warriors.arena" />
          </div>
          <div>
            <label className="wa-label">PASSCODE</label>
            <input className="wa-input" type="password" defaultValue="**********"/>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap: 10, color:"var(--wa-text-dim)", fontSize: 13, marginTop: 4 }}>
            <input type="checkbox" defaultChecked/> Remember this terminal
          </label>
          <button className="wa-btn" onClick={onAuth} style={{ marginTop: 6 }}>
            <Icon.lock size={14}/> ENGAGE
          </button>
          <button onClick={onExit} className="wa-mono" style={{ background:"none", border:0, color:"var(--wa-text-mute)", fontSize: 11, letterSpacing:".2em", cursor:"pointer" }}>
            ← BACK TO PUBLIC SITE
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ route, setRoute, onExit }) {
  return (
    <aside style={{
      width: 230, background:"#0d110e", borderRight:"1px solid var(--wa-line)",
      padding: "22px 14px", display:"flex", flexDirection:"column", gap: 4,
      position:"sticky", top: 0, height:"100vh",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap: 10, padding:"2px 6px 22px", borderBottom:"1px solid var(--wa-line)" }}>
        <div style={{ width:32, height:32, background:"var(--wa-green)", display:"grid", placeItems:"center",
          clipPath:"polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)", color:"#0a0d0a" }}>
          <Icon.crosshair size={18}/>
        </div>
        <div style={{ lineHeight: 1 }}>
          <div className="wa-h-display" style={{ fontSize: 14 }}>WARRIORS</div>
          <div className="wa-mono" style={{ fontSize: 9, color:"var(--wa-green)", letterSpacing:".25em", marginTop: 2 }}>OPS · v2.1</div>
        </div>
      </div>

      <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 3 }}>
        {ADMIN_NAV.map(n=>{
          const active = route===n.id;
          const Ico = Icon[n.icon];
          return (
            <button key={n.id} onClick={()=>setRoute(n.id)}
              style={{
                display:"flex", alignItems:"center", gap: 10, padding:"10px 12px",
                background: active ? "rgba(143,224,74,.08)" : "transparent",
                border: 0, borderLeft: active ? "2px solid var(--wa-green)" : "2px solid transparent",
                color: active ? "var(--wa-green)" : "var(--wa-text-dim)",
                fontFamily:"var(--ff-ui)", fontSize: 13, letterSpacing:".05em", textTransform:"uppercase",
                cursor:"pointer", textAlign:"start",
              }}>
              <Ico size={16}/> {n.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop:"auto", paddingTop: 14, borderTop:"1px solid var(--wa-line)" }}>
        <button onClick={onExit} style={{ display:"flex", alignItems:"center", gap: 8, background:"none", border:0, color:"var(--wa-text-mute)", fontSize: 11, letterSpacing:".2em", cursor:"pointer", fontFamily:"var(--ff-mono)" }}>
          ← EXIT TO SITE
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar() {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap: 14, padding:"14px 28px",
      borderBottom:"1px solid var(--wa-line)", background:"#0b0e0c",
    }}>
      <div style={{ position:"relative", flex: 1, maxWidth: 360 }}>
        <div style={{ position:"absolute", left: 12, top:"50%", transform:"translateY(-50%)", color:"var(--wa-text-mute)" }}>
          <Icon.search size={16}/>
        </div>
        <input className="wa-input" style={{ paddingInlineStart: 36, fontSize: 14 }} placeholder="Search bookings, codes, customers…"/>
      </div>
      <div style={{ flex: 1 }}/>
      <div className="wa-tag"><span style={{width:6,height:6,background:"var(--wa-green)",borderRadius:"50%",animation:"wa-blink 1.4s infinite"}}/>SYSTEM · LIVE</div>
      <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-dim)" }}>CAIRO · {new Date().toLocaleDateString()}</div>
      <div style={{ width: 34, height: 34, background:"var(--wa-panel-2)", border:"1px solid var(--wa-line-hot)", display:"grid", placeItems:"center", fontFamily:"var(--ff-display)", fontSize: 12, color:"var(--wa-green)" }}>
        OM
      </div>
    </div>
  );
}

function PageHeader({ kicker, title, actions }) {
  return (
    <div style={{ display:"flex", alignItems:"end", justifyContent:"space-between", marginBottom: 22, gap: 18, flexWrap:"wrap" }}>
      <div>
        <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".25em" }}>{kicker}</div>
        <div className="wa-h-display" style={{ fontSize: 34, marginTop: 4 }}>{title}</div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>{actions}</div>
    </div>
  );
}

function AdminHome({ setRoute }) {
  return (
    <div>
      <PageHeader kicker="// TODAY · APR 20" title="Command Dashboard"
        actions={<>
          <button className="wa-btn wa-btn-sm"><Icon.plus size={14}/> NEW BOOKING</button>
          <button className="wa-btn wa-btn--ghost wa-btn-sm"><Icon.download size={14}/> EXPORT DAY</button>
        </>}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14 }}>
        <Metric label="TODAY'S BOOKINGS" value="9" sub="+3 vs yesterday" tone="green"/>
        <Metric label="CONFIRMED REVENUE" value="6,840" unit="EGP" sub="7 confirmed · 2 pending" tone="green"/>
        <Metric label="UTILIZATION" value="78%" sub="7 of 9 slots filled" tone="neutral"/>
        <Metric label="NEXT SLOT" value="7:00 PM" sub="in 42 min · Khaled A." tone="orange" pulse/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="wa-panel" style={{ padding: 22 }}>
          <SectionTitle kicker="// AGENDA" title="Today's reservations"/>
          <div style={{ marginTop: 16, display:"flex", flexDirection:"column", gap: 6 }}>
            {[
              { t:"6:00 PM", name:"Omar & Co.", game:"Laser · 30", players: 5, status:"confirmed", total: 600 },
              { t:"6:30 PM", name:"Birthday · Dina", game:"Bundle · FIRE TEAM", players: 6, status:"confirmed", total: 1500, bundle:true },
              { t:"7:00 PM", name:"Khaled A.", game:"Gel · 30", players: 4, status:"pending", total: 600 },
              { t:"7:30 PM", name:"Nour M.", game:"Laser · 60", players: 4, status:"confirmed", total: 1280 },
              { t:"8:00 PM", name:"—", game:"—", players: 0, status:"empty", total: 0 },
              { t:"8:30 PM", name:"Yousef T.", game:"Laser · 30", players: 3, status:"confirmed", total: 360 },
            ].map((b,i)=>(
              <BookingRow key={i} b={b}/>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 16 }}>
          <div className="wa-panel" style={{ padding: 22 }}>
            <SectionTitle kicker="// QUICK JUMP" title="Actions"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginTop: 14 }}>
              <QuickBtn icon={<Icon.target size={16}/>} label="Control Center" onClick={()=>setRoute('ops')}/>
              <QuickBtn icon={<Icon.plus size={16}/>} label="New booking"/>
              <QuickBtn icon={<Icon.bolt size={16}/>} label="Revenue" onClick={()=>setRoute('rev')}/>
              <QuickBtn icon={<Icon.clock size={16}/>} label="Edit slots" onClick={()=>setRoute('slots')}/>
            </div>
          </div>

          <div className="wa-panel" style={{ padding: 22, borderColor:"rgba(255,122,26,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Icon.shield size={18} style={{color:"var(--wa-orange)"}}/>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-orange)", letterSpacing:".2em" }}>// UPCOMING · 42 MIN</div>
            </div>
            <div className="wa-h-display" style={{ fontSize: 22, marginTop: 10 }}>7:00 PM · Khaled A.</div>
            <div style={{ color:"var(--wa-text-dim)", fontSize: 13, marginTop: 4 }}>Gel Blasters · 30M · 4 players · pending deposit</div>
            <div style={{ display:"flex", gap: 8, marginTop: 14 }}>
              <button className="wa-btn wa-btn-sm"><Icon.whatsapp size={14}/> NUDGE</button>
              <button className="wa-btn wa-btn--ghost wa-btn-sm">MARK PAID</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, sub, tone = "neutral", pulse }) {
  const color = tone === "green" ? "var(--wa-green)" : tone === "orange" ? "var(--wa-orange)" : "var(--wa-text)";
  return (
    <div className="wa-panel" style={{ padding: 20, position:"relative", overflow:"hidden" }}>
      <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".25em" }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap: 8, marginTop: 8 }}>
        <div className="wa-h-display" style={{ fontSize: 40, color, animation: pulse ? "wa-pulse-glow 2s infinite" : undefined }}>
          {value}
        </div>
        {unit && <div className="wa-mono" style={{ color:"var(--wa-text-dim)", fontSize: 12 }}>{unit}</div>}
      </div>
      {sub && <div style={{ color:"var(--wa-text-dim)", fontSize: 12, marginTop: 6 }}>{sub}</div>}
      {/* corner glyph */}
      <div className="wa-h-display" style={{ position:"absolute", top: -4, right: 6, fontSize: 56, color:"rgba(255,255,255,.02)" }}>{label[0]}</div>
    </div>
  );
}

function SectionTitle({ kicker, title }) {
  return (
    <div>
      <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-green)", letterSpacing:".25em" }}>{kicker}</div>
      <div className="wa-h-display" style={{ fontSize: 22, marginTop: 4 }}>{title}</div>
    </div>
  );
}

function BookingRow({ b }) {
  const statusColor = b.status === "confirmed" ? "var(--wa-green)" : b.status === "pending" ? "var(--wa-amber)" : "var(--wa-text-mute)";
  if (b.status === "empty") {
    return (
      <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 80px 100px 40px", gap: 12, alignItems:"center",
        padding:"10px 12px", background:"#0e110f", border:"1px dashed var(--wa-line)" }}>
        <div className="wa-mono" style={{ fontSize: 13, color:"var(--wa-text-mute)" }}>{b.t}</div>
        <div style={{ color:"var(--wa-text-mute)", fontSize: 13 }}>— empty slot —</div>
        <div/><div/><div/>
        <button className="wa-btn wa-btn-sm wa-btn--ghost" style={{ padding:"6px 10px" }}><Icon.plus size={12}/></button>
      </div>
    );
  }
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"80px 1fr 1fr 80px 100px 40px", gap: 12, alignItems:"center",
      padding:"12px", background:"var(--wa-panel-2)", borderLeft: b.bundle ? "3px solid var(--wa-orange)" : "3px solid transparent",
      border:"1px solid var(--wa-line)",
    }}>
      <div className="wa-mono" style={{ fontSize: 13, color:"var(--wa-green)" }}>{b.t}</div>
      <div style={{ fontSize: 14 }}>{b.name}</div>
      <div className="wa-mono" style={{ fontSize: 12, color:"var(--wa-text-dim)" }}>{b.game}</div>
      <div style={{ fontSize: 13 }}><Icon.users size={13} style={{verticalAlign:"middle", color:"var(--wa-text-mute)"}}/> {b.players}</div>
      <div style={{ textAlign:"end" }}>
        <div className="wa-mono" style={{ fontSize: 13 }}>{fmt(b.total)} EGP</div>
        <div className="wa-mono" style={{ fontSize: 10, color: statusColor, letterSpacing:".15em", textTransform:"uppercase" }}>{b.status}</div>
      </div>
      <button style={{ background:"transparent", border:0, color:"var(--wa-text-dim)", cursor:"pointer" }}><Icon.dots size={16}/></button>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="wa-panel" style={{
      padding:"14px 12px", display:"flex", alignItems:"center", gap: 10,
      color:"var(--wa-text)", cursor:"pointer", textAlign:"start",
    }}>
      <div style={{ color:"var(--wa-green)" }}>{icon}</div>
      <div className="wa-ui" style={{ fontSize: 12 }}>{label}</div>
    </button>
  );
}

// -------- CONTROL CENTER --------------------------------------------------
function ControlCenter() {
  const [selected, setSelected] = useState(null);
  const [dayOffset, setDayOffset] = useState(0);
  const days = useMemo(()=> Array.from({length: 7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()+i);
    return d;
  }), []);

  // mock grid data: 7 days × 7 slots
  const grid = useMemo(()=> {
    const data = {};
    TIME_SLOTS.forEach((t, ti)=> days.forEach((d, di)=> {
      const hash = (ti * 13 + di * 7) % 100;
      let status, booking = null;
      if (di === 1) status = "closed"; // Mon
      else if (hash < 45) { status = "booked"; booking = mockBooking(ti, di); }
      else if (hash < 55 && ti >= 4) status = "closing";
      else status = "available";
      data[`${di}-${ti}`] = { status, booking };
    }));
    return data;
  }, [days]);

  function mockBooking(ti, di) {
    const names = ["Omar A.", "Dina M.", "Khaled F.", "Nour S.", "Yousef T.", "Mariam H.", "Tamer K.", "Laila O."];
    const games = [{name:"Laser · 30", type:"laser"}, {name:"Gel · 30", type:"gel"}, {name:"Laser · 60", type:"laser"}, {name:"FIRE TEAM", type:"bundle"}];
    const g = games[(ti+di) % games.length];
    return {
      name: names[(ti*3+di) % names.length],
      game: g.name, type: g.type,
      bundle: g.type === "bundle",
      players: 2 + ((ti+di) % 5),
      total: 120 + ((ti*di) % 12) * 100,
      status: (ti+di) % 4 === 0 ? "pending" : "confirmed",
      phone: "+20 12" + String(20000000 + (ti*di*7919)%79999999),
      code: `WA-${(ti*31+di*7+100).toString(36).toUpperCase()}-${(ti*13+di).toString(36).toUpperCase()}`,
    };
  }

  return (
    <div>
      <PageHeader kicker="// OPERATIONS" title="Reservation Control Center"
        actions={<>
          <div className="wa-panel" style={{ display:"flex", alignItems:"center", padding: 4, gap: 2 }}>
            <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={()=>setDayOffset(Math.max(0, dayOffset-1))} style={{padding:"6px 10px", border: 0}}><Icon.arrowL size={14}/></button>
            <span className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-dim)", paddingInline: 10, letterSpacing:".15em" }}>APR 20 — 26</span>
            <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={()=>setDayOffset(dayOffset+1)} style={{padding:"6px 10px", border: 0}}><Icon.arrow size={14}/></button>
          </div>
          <button className="wa-btn wa-btn-sm"><Icon.plus size={14}/> MANUAL BOOKING</button>
        </>}/>

      <div className="wa-panel wa-panel--clip" style={{ padding: 18 }}>
        {/* legend */}
        <div style={{ display:"flex", gap: 18, marginBottom: 14, flexWrap:"wrap" }}>
          {[
            ["available","AVAILABLE","var(--wa-green)"],
            ["booked","BOOKED","var(--wa-red)"],
            ["closing","CLOSING","var(--wa-amber)"],
            ["closed","CLOSED","var(--wa-text-mute)"],
            ["bundle","BUNDLE","var(--wa-orange)"],
          ].map(([k,l,c])=>(
            <div key={k} style={{ display:"flex", alignItems:"center", gap: 8 }}>
              <div className={k === "bundle" ? "" : `wa-slot wa-slot--${k}`}
                style={k === "bundle" ? { width: 16, height: 16, border:"2px solid var(--wa-orange)", background:"transparent" } : { width: 16, height: 16, padding: 0 }}/>
              <span className="wa-mono" style={{ fontSize: 10, color:c, letterSpacing:".18em" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* grid */}
        <div style={{ display:"grid", gridTemplateColumns:`80px repeat(7, 1fr)`, gap: 4 }}>
          <div/>
          {days.map((d,i)=>(
            <div key={i} style={{ textAlign:"center", padding: "10px 4px", borderBottom:"1px solid var(--wa-line)" }}>
              <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>
                {d.toLocaleString("en-US", { weekday: "short" }).toUpperCase()}
              </div>
              <div className="wa-h-display" style={{ fontSize: 18, marginTop: 2, color: i===0 ? "var(--wa-green)" : "var(--wa-text)" }}>
                {d.getDate()}
              </div>
            </div>
          ))}

          {TIME_SLOTS.map((slot, ti)=>(
            <React.Fragment key={ti}>
              <div style={{ padding: 10, borderRight:"1px solid var(--wa-line)" }}>
                <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)" }}>{slot}</div>
              </div>
              {days.map((d, di)=>{
                const cell = grid[`${di}-${ti}`];
                return <GridCell key={di} cell={cell} onClick={()=>setSelected({ ti, di, slot, day: d, cell })}/>;
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selected && <SlideOver sel={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

function GridCell({ cell, onClick }) {
  if (cell.status === "available") {
    return (
      <button onClick={onClick} className="wa-slot wa-slot--available"
        style={{ minHeight: 70, display:"flex", flexDirection:"column", alignItems:"stretch", justifyContent:"center", padding: 8, cursor:"pointer" }}>
        <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".18em", opacity: .7 }}>OPEN</div>
        <div className="wa-mono" style={{ fontSize: 11, marginTop: 4, color:"var(--wa-green)" }}>+ ADD</div>
      </button>
    );
  }
  if (cell.status === "closed") {
    return (
      <div className="wa-slot wa-slot--closed" style={{ minHeight: 70, display:"grid", placeItems:"center" }}>
        <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".2em" }}>CLOSED</div>
      </div>
    );
  }
  if (cell.status === "closing") {
    return (
      <div className="wa-slot wa-slot--closing" style={{ minHeight: 70, display:"grid", placeItems:"center" }}>
        <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".2em" }}>CLOSING</div>
      </div>
    );
  }
  // booked
  const b = cell.booking;
  return (
    <button onClick={onClick} className="wa-slot wa-slot--booked"
      style={{
        minHeight: 70, padding: 8, textAlign:"start",
        borderLeft: b.bundle ? "3px solid var(--wa-orange)" : undefined,
        background: b.bundle ? "repeating-linear-gradient(-45deg, #2a1808 0 6px, #1a100e 6px 10px)" : undefined,
      }}>
      <div className="wa-mono" style={{ fontSize: 10, color:"#fff", letterSpacing:".1em" }}>{b.game}</div>
      <div className="wa-ui" style={{ fontSize: 11, color:"#fff", marginTop: 2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.name}</div>
      <div className="wa-mono" style={{ fontSize: 10, color: b.status === "pending" ? "var(--wa-amber)" : "var(--wa-green)", marginTop: 4 }}>
        <Icon.users size={10} style={{verticalAlign:"middle"}}/> {b.players} · {b.status.toUpperCase()}
      </div>
    </button>
  );
}

function SlideOver({ sel, onClose }) {
  const isEmpty = sel.cell.status === "available" || sel.cell.status === "closing";
  const b = sel.cell.booking;
  const [cancelling, setCancelling] = useState(false);
  return (
    <div style={{ position:"fixed", inset: 0, zIndex: 80, display:"flex", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset: 0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)", animation:"wa-fadein-up 200ms" }}/>
      <div style={{
        position:"relative", width: 480, background:"#0c100d",
        borderLeft:"1px solid var(--wa-line-hot)", padding: 28, overflow:"auto",
        animation:"wa-fadein-up 260ms ease",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".25em" }}>// SLOT DETAIL</div>
          <button onClick={onClose} style={{ background:"transparent", border:0, color:"var(--wa-text-dim)", cursor:"pointer" }}><Icon.x size={20}/></button>
        </div>
        <div className="wa-h-display" style={{ fontSize: 28, marginTop: 8 }}>
          {sel.slot} · {sel.day.toLocaleString("en-US", { month:"short", day:"numeric" }).toUpperCase()}
        </div>

        {!isEmpty && !cancelling && (
          <div style={{ marginTop: 24, display:"flex", flexDirection:"column", gap: 14 }}>
            <div className="wa-panel" style={{ padding: 18, borderLeft: b.bundle ? "3px solid var(--wa-orange)" : undefined }}>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>{b.bundle ? "BUNDLE · " : ""}{b.game.toUpperCase()}</div>
              <div className="wa-h-display" style={{ fontSize: 22, marginTop: 4 }}>{b.name}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 10, marginTop: 14, paddingTop: 12, borderTop:"1px dashed var(--wa-line-hot)" }}>
                <Stat k="PLAYERS" v={b.players}/>
                <Stat k="TOTAL" v={`${fmt(b.total)} EGP`}/>
                <Stat k="STATUS" v={b.status.toUpperCase()} color={b.status==="confirmed"?"var(--wa-green)":"var(--wa-amber)"}/>
              </div>
              <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 6 }}>
                <InfoRow k="PHONE" v={b.phone}/>
                <InfoRow k="CODE" v={b.code}/>
                <InfoRow k="DEPOSIT" v={b.status==="confirmed" ? `${fmt(b.total/2)} RECEIVED` : "PENDING"}/>
              </div>
            </div>

            <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
              <button className="wa-btn wa-btn-sm"><Icon.whatsapp size={14}/> MESSAGE</button>
              <button className="wa-btn wa-btn-sm wa-btn--ghost"><Icon.check size={14}/> MARK PAID</button>
              <button className="wa-btn wa-btn-sm wa-btn--ghost"><Icon.edit size={14}/> EDIT</button>
              <button onClick={()=>setCancelling(true)} className="wa-btn wa-btn-sm wa-btn--ghost" style={{ borderColor:"rgba(255,61,61,.4)", color:"var(--wa-red)" }}>
                <Icon.trash size={14}/> CANCEL
              </button>
            </div>

            <div className="wa-panel" style={{ padding: 14, marginTop: 8 }}>
              <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>// AUDIT TRAIL</div>
              <div style={{ marginTop: 10, display:"flex", flexDirection:"column", gap: 8 }}>
                {[
                  { t: "16:02", e:"Booking created via public site", u:"system" },
                  { t: "16:04", e:"WhatsApp confirmation sent", u:"system" },
                  { t: "17:18", e:"Deposit 50% marked received", u:"ops@warriors" },
                ].map((a,i)=>(
                  <div key={i} style={{ display:"flex", gap: 10, fontSize: 12 }}>
                    <span className="wa-mono" style={{ color:"var(--wa-green)", width: 44 }}>{a.t}</span>
                    <span style={{ color:"var(--wa-text-dim)", flex: 1 }}>{a.e}</span>
                    <span className="wa-mono" style={{ color:"var(--wa-text-mute)", fontSize: 10 }}>{a.u}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {cancelling && (
          <div style={{ marginTop: 24 }}>
            <div className="wa-panel" style={{ padding: 22, borderColor:"rgba(255,61,61,.4)" }}>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-red)", letterSpacing:".25em" }}>// CANCEL RESERVATION</div>
              <div className="wa-h-display" style={{ fontSize: 22, marginTop: 6 }}>Choose reason</div>
              <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 8 }}>
                {["Customer request","No-show","Venue closure","Duplicate booking","Payment failure"].map((r,i)=>(
                  <label key={i} className="wa-panel" style={{ padding: "12px 14px", display:"flex", alignItems:"center", gap: 10, cursor:"pointer" }}>
                    <input type="radio" name="reason"/> <span style={{ fontSize: 14 }}>{r}</span>
                  </label>
                ))}
              </div>
              <textarea className="wa-input" style={{ marginTop: 10, minHeight: 70, fontFamily:"var(--ff-ui)" }} placeholder="Optional note for audit log…"/>
              <div style={{ display:"flex", gap: 10, marginTop: 14 }}>
                <button className="wa-btn wa-btn-sm" style={{ background:"var(--wa-red)", color:"#fff" }}><Icon.trash size={14}/> CONFIRM CANCEL</button>
                <button onClick={()=>setCancelling(false)} className="wa-btn wa-btn--ghost wa-btn-sm">BACK</button>
              </div>
            </div>
          </div>
        )}

        {isEmpty && (
          <div style={{ marginTop: 24 }}>
            <div className="wa-panel" style={{ padding: 22 }}>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".25em" }}>// MANUAL BOOKING</div>
              <div className="wa-h-display" style={{ fontSize: 22, marginTop: 6 }}>Create reservation</div>
              <div style={{ display:"grid", gap: 10, marginTop: 16 }}>
                <div>
                  <label className="wa-label">CUSTOMER NAME</label>
                  <input className="wa-input" placeholder="Full name"/>
                </div>
                <div>
                  <label className="wa-label">PHONE</label>
                  <input className="wa-input" placeholder="+20 ..."/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
                  <div>
                    <label className="wa-label">GAME</label>
                    <select className="wa-input">
                      <option>Laser · 30</option><option>Laser · 60</option><option>Gel · 30</option>
                    </select>
                  </div>
                  <div>
                    <label className="wa-label">PLAYERS</label>
                    <input className="wa-input" type="number" defaultValue={4} min={2} max={6}/>
                  </div>
                </div>
              </div>
              <button className="wa-btn wa-btn-sm" style={{ width:"100%", marginTop: 16 }}>
                <Icon.lock size={14}/> LOCK SLOT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ k, v, color }) {
  return (
    <div>
      <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>{k}</div>
      <div className="wa-h-display" style={{ fontSize: 18, color: color || "var(--wa-text)", marginTop: 4 }}>{v}</div>
    </div>
  );
}
function InfoRow({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap: 10, fontSize: 12 }}>
      <span className="wa-mono" style={{ color:"var(--wa-text-mute)", letterSpacing:".15em" }}>{k}</span>
      <span className="wa-mono" style={{ color:"var(--wa-text)" }}>{v}</span>
    </div>
  );
}

// -------- REVENUE PAGE ---------------------------------------------------
function RevenuePage() {
  const hourly = [
    { t:"6:00", v: 700 }, { t:"6:30", v: 1500 }, { t:"7:00", v: 600 },
    { t:"7:30", v: 1280 }, { t:"8:00", v: 0 }, { t:"8:30", v: 360 }, { t:"9:00", v: 0 },
  ];
  const max = Math.max(...hourly.map(h=>h.v), 1);
  const week = [ 3200, 4100, 3600, 5200, 7800, 9400, 6100 ];
  return (
    <div>
      <PageHeader kicker="// FINANCIAL" title="Revenue"
        actions={<>
          <button className="wa-btn wa-btn--ghost wa-btn-sm"><Icon.download size={14}/> PDF</button>
          <button className="wa-btn wa-btn-sm"><Icon.download size={14}/> XLSX</button>
        </>}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14 }}>
        <Metric label="CONFIRMED REVENUE" value="6,840" unit="EGP" sub="Today" tone="green"/>
        <Metric label="REALIZED (MTD)" value="128,450" unit="EGP" sub="+18% vs last month" tone="green"/>
        <Metric label="CANCELLATION RATE" value="4.2%" sub="9 of 214 bookings" tone="orange"/>
        <Metric label="AVG BOOKING VALUE" value="780" unit="EGP" sub="+40 vs last week" tone="neutral"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="wa-panel" style={{ padding: 22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <SectionTitle kicker="// TODAY" title="Revenue by slot"/>
            <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-dim)" }}>EGP</div>
          </div>
          <div style={{ display:"flex", alignItems:"end", gap: 10, marginTop: 26, height: 220 }}>
            {hourly.map((h,i)=>{
              const height = h.v ? (h.v / max) * 200 : 6;
              return (
                <div key={i} style={{ flex: 1, display:"flex", flexDirection:"column", alignItems:"center", gap: 8 }}>
                  <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-green)" }}>{h.v ? fmt(h.v) : ""}</div>
                  <div style={{ width:"100%", height: `${height}px`,
                    background: h.v ? "linear-gradient(180deg, var(--wa-green), var(--wa-green-dim))" : "var(--wa-line)",
                    borderTop: h.v ? "2px solid var(--wa-green-2)" : "none",
                    boxShadow: h.v ? "0 0 12px rgba(143,224,74,.2)" : "none",
                  }}/>
                  <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)" }}>{h.t}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="wa-panel" style={{ padding: 22 }}>
          <SectionTitle kicker="// WEEK" title="Trend"/>
          <svg viewBox="0 0 340 200" style={{ width:"100%", height: 220, marginTop: 14 }}>
            {[0,50,100,150,200].map(y=>(
              <line key={y} x1="20" x2="340" y1={y} y2={y} stroke="var(--wa-line)" strokeWidth="0.5"/>
            ))}
            {(() => {
              const maxW = Math.max(...week);
              const pts = week.map((v,i)=>[20 + i*(320/(week.length-1)), 200 - (v/maxW)*180]);
              const d = pts.map((p,i)=> `${i===0?'M':'L'} ${p[0]} ${p[1]}`).join(" ");
              return (
                <>
                  <path d={`${d} L 340 200 L 20 200 Z`} fill="rgba(143,224,74,.12)"/>
                  <path d={d} stroke="var(--wa-green)" strokeWidth="2" fill="none"/>
                  {pts.map((p,i)=>(
                    <g key={i}>
                      <circle cx={p[0]} cy={p[1]} r="4" fill="var(--wa-green)"/>
                      <circle cx={p[0]} cy={p[1]} r="8" fill="var(--wa-green)" opacity=".25"/>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop: 4 }}>
            {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
              <span key={d} className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)" }}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="wa-panel" style={{ padding: 22, marginTop: 16 }}>
        <SectionTitle kicker="// MONTHLY BREAKDOWN" title="By product"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14, marginTop: 16 }}>
          {[
            { k:"Laser · 30", v: 32200, p: 42 },
            { k:"Laser · 60", v: 48900, p: 63 },
            { k:"Gel · 30", v: 24100, p: 31 },
            { k:"Bundles", v: 23250, p: 18 },
          ].map((x,i)=>(
            <div key={i}>
              <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-dim)", letterSpacing:".15em" }}>{x.k}</div>
              <div className="wa-h-display" style={{ fontSize: 24, color:"var(--wa-green)", marginTop: 4 }}>{fmt(x.v)}</div>
              <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)" }}>{x.p} bookings</div>
              <div style={{ height: 6, background:"var(--wa-line)", marginTop: 8, position:"relative" }}>
                <div style={{ position:"absolute", inset: 0, width: `${(x.v/48900)*100}%`, background:"var(--wa-green)" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------- SLOT MANAGEMENT -----------------------------------------------
function SlotMgmt() {
  return (
    <div>
      <PageHeader kicker="// SCHEDULE" title="Slot Management" actions={<button className="wa-btn wa-btn-sm"><Icon.plus size={14}/> ADD OVERRIDE</button>}/>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap: 16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap: 16 }}>
          <div className="wa-panel" style={{ padding: 22 }}>
            <SectionTitle kicker="// LEVEL 1" title="Default hours"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 80px", gap: 10, marginTop: 14, alignItems:"center" }}>
              <div>
                <label className="wa-label">OPENS</label>
                <input className="wa-input" defaultValue="6:00 PM"/>
              </div>
              <div>
                <label className="wa-label">CLOSES</label>
                <input className="wa-input" defaultValue="9:00 PM"/>
              </div>
              <div>
                <label className="wa-label">SLOT</label>
                <input className="wa-input" defaultValue="30"/>
              </div>
              <div>
                <label className="wa-label">MAX PL</label>
                <input className="wa-input" defaultValue="6"/>
              </div>
            </div>
          </div>

          <div className="wa-panel" style={{ padding: 22 }}>
            <SectionTitle kicker="// LEVEL 2" title="Day-of-week overrides"/>
            <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 4 }}>
              {[
                { d:"Monday", open:"CLOSED", close:"—" },
                { d:"Tuesday", open:"6:00 PM", close:"9:00 PM" },
                { d:"Wednesday", open:"6:00 PM", close:"9:00 PM" },
                { d:"Thursday", open:"5:30 PM", close:"10:00 PM" },
                { d:"Friday", open:"4:00 PM", close:"11:00 PM" },
                { d:"Saturday", open:"4:00 PM", close:"11:00 PM" },
                { d:"Sunday", open:"6:00 PM", close:"9:00 PM" },
              ].map((d,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 32px", gap: 10, alignItems:"center", padding: 10, background:"var(--wa-panel-2)", border:"1px solid var(--wa-line)" }}>
                  <div style={{ fontFamily:"var(--ff-display)", fontSize: 13 }}>{d.d.toUpperCase()}</div>
                  <div className="wa-mono" style={{ fontSize: 13, color: d.open==="CLOSED" ? "var(--wa-red)" : "var(--wa-green)" }}>{d.open}</div>
                  <div className="wa-mono" style={{ fontSize: 13, color:"var(--wa-text-dim)" }}>{d.close}</div>
                  <button style={{ background:"transparent", border:0, color:"var(--wa-text-dim)", cursor:"pointer" }}><Icon.edit size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="wa-panel" style={{ padding: 22 }}>
            <SectionTitle kicker="// LEVEL 3" title="Exact date overrides"/>
            <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 6 }}>
              {[
                { d:"Apr 25", reason:"Private event — corporate buyout", hours:"CLOSED TO PUBLIC" },
                { d:"May 01", reason:"Labour Day — extended hours", hours:"12:00 PM — 11:00 PM" },
                { d:"Jun 16", reason:"Eid al-Adha · day 1", hours:"CLOSED" },
              ].map((o,i)=>(
                <div key={i} className="wa-panel" style={{ padding: 14, borderLeft:"3px solid var(--wa-orange)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div className="wa-h-display" style={{ fontSize: 16 }}>{o.d.toUpperCase()}</div>
                    <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-orange)" }}>{o.hours}</div>
                  </div>
                  <div style={{ color:"var(--wa-text-dim)", fontSize: 13, marginTop: 4 }}>{o.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="wa-panel wa-panel--clip wa-brackets" style={{ padding: 22, position:"sticky", top: 20, alignSelf:"start" }}>
          <SectionTitle kicker="// PREVIEW" title="Resolved for today"/>
          <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", marginTop: 8, letterSpacing:".18em" }}>SUN · APR 20 · 2026</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 4, marginTop: 14 }}>
            {TIME_SLOTS.map((s,i)=>(
              <div key={i} className="wa-slot wa-slot--available" style={{ padding: "10px 4px" }}>
                <div className="wa-mono" style={{ fontSize: 11 }}>{s}</div>
              </div>
            ))}
          </div>
          <div className="wa-panel" style={{ marginTop: 14, padding: 12, background:"var(--wa-bg)" }}>
            <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em" }}>// APPLIED RULES</div>
            <ol style={{ margin: "10px 0 0", paddingInlineStart: 18, color:"var(--wa-text-dim)", fontSize: 12, lineHeight: 1.7 }}>
              <li>Default hours (6:00 PM — 9:00 PM)</li>
              <li>Sunday weekly override (no change)</li>
              <li>No date override for this date</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------- PRICING --------------------------------------------------------
function PricingPage() {
  const [changes, setChanges] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const rows = [
    { g:"Laser Tag", d: 30, p: 120 },
    { g:"Laser Tag", d: 60, p: 200 },
    { g:"Gel Blasters", d: 30, p: 150 },
  ];
  return (
    <div>
      <PageHeader kicker="// CATALOG" title="Pricing"
        actions={<>
          <span className="wa-tag wa-tag--orange">{changes} UNSAVED</span>
          <button className="wa-btn wa-btn-sm" disabled={!changes} style={{opacity:changes?1:.3}} onClick={()=>setConfirm(true)}>APPLY CHANGES</button>
        </>}/>

      <div className="wa-panel" style={{ padding: 22 }}>
        <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".2em", marginBottom: 14 }}>// HISTORICAL PRICING IS IMMUTABLE — EXISTING BOOKINGS KEEP THEIR ORIGINAL PRICE.</div>

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 120px", gap: 2, background:"var(--wa-line)" }}>
          {["GAME","DURATION","PRICE (EGP)",""].map((h,i)=>(
            <div key={i} className="wa-mono" style={{ padding: "10px 14px", background:"#0c100d", fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".22em" }}>{h}</div>
          ))}
          {rows.map((r,i)=>(
            <React.Fragment key={i}>
              <div style={{ padding: "14px", background:"var(--wa-panel-2)", fontFamily:"var(--ff-display)", fontSize: 15 }}>{r.g}</div>
              <div style={{ padding: "14px", background:"var(--wa-panel-2)", color:"var(--wa-text-dim)", fontFamily:"var(--ff-mono)", fontSize: 13 }}>{r.d} minutes</div>
              <div style={{ padding: "10px", background:"var(--wa-panel-2)" }}>
                <input className="wa-input" defaultValue={r.p} style={{ padding: "8px 12px", fontFamily:"var(--ff-mono)" }} onChange={()=>setChanges(c=>c+1)}/>
              </div>
              <div style={{ padding: "14px", background:"var(--wa-panel-2)", display:"flex", gap: 8, justifyContent:"end" }}>
                <button style={{ background:"transparent", border:0, color:"var(--wa-text-dim)", cursor:"pointer" }}><Icon.edit size={14}/></button>
                <button style={{ background:"transparent", border:0, color:"var(--wa-text-dim)", cursor:"pointer" }}><Icon.dots size={14}/></button>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {confirm && (
        <div style={{ position:"fixed", inset:0, zIndex: 100, background:"rgba(0,0,0,.7)", display:"grid", placeItems:"center" }}>
          <div className="wa-panel wa-panel--clip wa-brackets" style={{ width: 440, padding: 28, background:"var(--wa-panel)" }}>
            <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-orange)", letterSpacing:".25em" }}>⚠ CONFIRM CHANGE</div>
            <div className="wa-h-display" style={{ fontSize: 22, marginTop: 6 }}>APPLY NEW PRICES?</div>
            <p style={{ color:"var(--wa-text-dim)", fontSize: 14, marginTop: 10 }}>
              New prices take effect for future bookings only. Existing bookings keep their original pricing.
            </p>
            <div style={{ display:"flex", gap: 10, marginTop: 16 }}>
              <button className="wa-btn wa-btn-sm" onClick={()=>{ setConfirm(false); setChanges(0); }}>APPLY</button>
              <button className="wa-btn wa-btn--ghost wa-btn-sm" onClick={()=>setConfirm(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------- BUNDLES MGMT ---------------------------------------------------
function BundlesMgmt() {
  const [mode, setMode] = useState("per_player");
  const [price, setPrice] = useState(150);
  const [players, setPlayers] = useState(4);
  const [duration, setDuration] = useState(60);
  const [name, setName] = useState("SQUAD RUN");

  const total = mode === "per_player" ? price * players : price;

  return (
    <div>
      <PageHeader kicker="// OFFERS" title="Bundles"
        actions={<button className="wa-btn wa-btn-sm"><Icon.plus size={14}/> NEW BUNDLE</button>}/>

      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap: 16 }}>
        <div className="wa-panel" style={{ padding: 24 }}>
          <SectionTitle kicker="// CREATE" title="Bundle builder"/>
          <div style={{ display:"grid", gap: 14, marginTop: 18 }}>
            <div>
              <label className="wa-label">NAME</label>
              <input className="wa-input" value={name} onChange={e=>setName(e.target.value)}/>
            </div>

            <div>
              <label className="wa-label">PRICING MODE</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginTop: 6 }}>
                {[
                  { k:"per_player", l:"PER-PLAYER", d:"Price × headcount" },
                  { k:"fixed_total", l:"FIXED TOTAL", d:"Flat team price" },
                ].map(m=>(
                  <button key={m.k} onClick={()=>setMode(m.k)} className="wa-panel" style={{
                    padding: 14, textAlign:"start", cursor:"pointer",
                    borderColor: mode===m.k ? "var(--wa-green)" : "var(--wa-line)",
                    background: mode===m.k ? "rgba(143,224,74,.06)" : "var(--wa-panel)",
                    color:"var(--wa-text)",
                  }}>
                    <div className="wa-h-display" style={{ fontSize: 14, color: mode===m.k ? "var(--wa-green)" : "var(--wa-text)" }}>{m.l}</div>
                    <div style={{ fontSize: 12, color:"var(--wa-text-dim)", marginTop: 4 }}>{m.d}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* the dynamic price input — label + helper changes */}
            <div>
              <label className="wa-label">
                {mode === "per_player" ? "PRICE PER PLAYER (EGP)" : "TOTAL BUNDLE PRICE (EGP)"}
              </label>
              <input className="wa-input" type="number" value={price} onChange={e=>setPrice(Number(e.target.value)||0)}/>
              <div className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)", letterSpacing:".15em", marginTop: 6 }}>
                {mode === "per_player"
                  ? `× ${players} PLAYERS = ${fmt(total)} EGP TOTAL`
                  : `FLAT · ${fmt(total)} EGP FOR GROUP`}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
              <div>
                <label className="wa-label">PLAYERS</label>
                <input className="wa-input" type="number" value={players} onChange={e=>setPlayers(Number(e.target.value)||2)} min={2} max={6}/>
              </div>
              <div>
                <label className="wa-label">DURATION (M)</label>
                <select className="wa-input" value={duration} onChange={e=>setDuration(Number(e.target.value))}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
            </div>

            <div style={{ display:"flex", gap: 10, marginTop: 4 }}>
              <button className="wa-btn wa-btn-sm"><Icon.check size={14}/> PUBLISH</button>
              <button className="wa-btn wa-btn--ghost wa-btn-sm">SAVE DRAFT</button>
            </div>
          </div>
        </div>

        <div>
          <div className="wa-panel wa-panel--clip wa-brackets" style={{ padding: 22, position:"sticky", top: 20 }}>
            <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".25em" }}>// LIVE PREVIEW</div>
            <div className="wa-h-display" style={{ fontSize: 14, marginTop: 4, color:"var(--wa-text-mute)" }}>AS CUSTOMERS WILL SEE IT</div>

            {/* replicate BundleCard preview */}
            <div className="wa-panel wa-panel--clip" style={{ padding: 22, marginTop: 16, background:"var(--wa-panel-2)" }}>
              <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                <span className="wa-tag wa-tag--orange"><Icon.spark size={12}/> BUNDLE</span>
                <span className="wa-tag wa-tag--neutral">{mode==="per_player"?"PER PLAYER":"FIXED TOTAL"}</span>
              </div>
              <div className="wa-h-display" style={{ fontSize: 28, marginTop: 14 }}>{name || "UNTITLED"}</div>

              <div style={{ marginTop: 14, paddingBlock: 14, borderTop:"1px dashed var(--wa-line-hot)", borderBottom:"1px dashed var(--wa-line-hot)" }}>
                {mode==="per_player" ? (
                  <>
                    <div className="wa-h-display" style={{ fontSize: 32, color:"var(--wa-green)" }}>
                      {fmt(price)} <span style={{ fontSize: 12, color:"var(--wa-text-dim)" }}>EGP / PLAYER</span>
                    </div>
                    <div className="wa-mono" style={{ fontSize: 12, color:"var(--wa-text-dim)", marginTop: 4 }}>
                      × {players} players = <span style={{ color:"var(--wa-text)" }}>{fmt(total)} EGP total</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="wa-h-display" style={{ fontSize: 32, color:"var(--wa-orange)" }}>
                      {fmt(price)} <span style={{ fontSize: 12, color:"var(--wa-text-dim)" }}>EGP TOTAL</span>
                    </div>
                    <div className="wa-mono" style={{ fontSize: 12, color:"var(--wa-text-dim)", marginTop: 4 }}>
                      for the group · up to {players} players
                    </div>
                  </>
                )}
              </div>

              <div style={{ display:"flex", gap: 12, marginTop: 14, color:"var(--wa-text-dim)" }} className="wa-mono">
                <span style={{ fontSize: 11 }}><Icon.users size={12} style={{verticalAlign:"middle"}}/> {players}</span>
                <span style={{ fontSize: 11 }}><Icon.clock size={12} style={{verticalAlign:"middle"}}/> {duration}M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Admin, AdminLogin, AdminHome, ControlCenter, RevenuePage,
  SlotMgmt, PricingPage, BundlesMgmt,
});
