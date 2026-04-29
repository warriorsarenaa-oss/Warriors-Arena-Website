/* global React, Icon, GamePlaceholder, GAMES, BUNDLES, TIME_SLOTS, fmt, genCode, useI18n */

// ==========================================================================
// PUBLIC LANDING PAGE
// ==========================================================================

function TopNav({ onBook, onAdmin, view, setView }) {
  const { lang, setLang, t } = useI18n();
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--wa-line)",
      background: "rgba(10,13,10,.85)", backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 1320, margin: "0 auto",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <Logo />
        <nav style={{ display: "flex", gap: 22, flex: 1, marginInlineStart: 32 }} className="wa-ui" data-hide-mobile>
          {[
            ["public", t("games")],
            ["bundles", t("bundles")],
            ["how", t("howItWorks")],
            ["location", t("location")],
          ].map(([id, label]) => (
            <a key={id} href="#" onClick={(e)=>{e.preventDefault(); setView('public'); setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth', block:'start'}),10);}}
              style={{ color: "var(--wa-text-dim)", textDecoration: "none", fontSize: 13, letterSpacing: ".1em" }}
              onMouseEnter={(e)=>e.currentTarget.style.color='var(--wa-green)'}
              onMouseLeave={(e)=>e.currentTarget.style.color='var(--wa-text-dim)'}>
              {label}
            </a>
          ))}
        </nav>
        <button onClick={()=>setLang(lang==='en'?'ar':'en')}
          className="wa-ui"
          style={{ background:"transparent", border:"1px solid var(--wa-line)", color:"var(--wa-text-dim)",
            padding:"8px 12px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, fontSize:12 }}>
          <Icon.globe size={14}/> {lang === 'en' ? 'AR' : 'EN'}
        </button>
        <button onClick={()=>setView(view === 'admin' ? 'public' : 'admin')} className="wa-ui"
          style={{ background:"transparent", border:"1px solid var(--wa-line)", color: view==='admin'?'var(--wa-orange)':'var(--wa-text-dim)',
            padding:"8px 12px", cursor:"pointer", fontSize:12 }}>
          {view==='admin' ? 'PUBLIC SITE' : 'ADMIN'}
        </button>
        <button onClick={onBook} className="wa-btn wa-btn-sm">
          <Icon.bolt size={14}/> {t("bookNow")}
        </button>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <a href="#" onClick={(e)=>e.preventDefault()} style={{ display:"flex", alignItems:"center", gap: 10, textDecoration:"none" }}>
      <div style={{
        width: 36, height: 36, background: "var(--wa-green)",
        clipPath: "polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)",
        display: "grid", placeItems: "center", color: "#0a0d0a",
      }}>
        <Icon.crosshair size={20}/>
      </div>
      <div style={{ lineHeight: 1, display:"flex", flexDirection:"column" }}>
        <span className="wa-h-display" style={{ fontSize: 18, color:"var(--wa-text)" }}>WARRIORS</span>
        <span className="wa-mono" style={{ fontSize: 10, color: "var(--wa-green)", letterSpacing: ".3em" }}>ARENA · EGY</span>
      </div>
    </a>
  );
}

// ------- HERO (animated, no video) ---------------------------------------
function Hero({ onBook }) {
  const { t, lang } = useI18n();
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 720, borderBottom: "1px solid var(--wa-line)" }}>
      {/* animated grid */}
      <div className="wa-anim-grid" style={{ position:"absolute", inset:0 }}/>
      <div className="wa-scanline"/>
      {/* radial vignette */}
      <div style={{
        position:"absolute", inset:0,
        background: "radial-gradient(60% 50% at 50% 40%, transparent, rgba(10,13,10,.9) 80%)",
      }}/>
      {/* reticle graphics, parallax */}
      <Reticle style={{ position:"absolute", top: 80, [lang==='ar'?'right':'left']: 80, opacity:.25 }} size={160}/>
      <Reticle style={{ position:"absolute", bottom: 120, [lang==='ar'?'left':'right']: 100, opacity:.18, animationDelay:"-2s" }} size={220}/>

      {/* corner HUD */}
      <HUDCorner corner="tl"/>
      <HUDCorner corner="tr"/>
      <HUDCorner corner="bl"/>
      <HUDCorner corner="br"/>

      {/* content */}
      <div style={{
        position: "relative", zIndex: 2,
        maxWidth: 1320, margin: "0 auto",
        padding: "96px 24px 120px",
        display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 48, alignItems:"center",
      }}>
        <div>
          <div style={{ animation:"wa-fadein-up 600ms ease .05s both", display:"flex", alignItems:"center", gap:12 }}>
            <span className="wa-tag"><Icon.pin size={12}/> {t("heroKicker")}</span>
            <span className="wa-tag wa-tag--neutral wa-mono" style={{fontSize:10}}>OPEN · 6PM—9PM</span>
          </div>

          <h1 className="wa-h-display" style={{ marginTop: 20, fontSize: "clamp(64px, 10vw, 150px)" }}>
            <span style={{ display:"block", animation:"wa-fadein-up 700ms cubic-bezier(.2,1.1,.2,1) .15s both" }}>
              {t("heroLine1")}
            </span>
            <span style={{
              display:"block",
              color: "var(--wa-green)",
              animation:"wa-fadein-up 700ms cubic-bezier(.2,1.1,.2,1) .3s both",
              textShadow: "0 0 32px rgba(143,224,74,.35)",
            }}>
              {t("heroLine2")}
            </span>
            <span style={{
              display:"block",
              animation:"wa-fadein-up 700ms cubic-bezier(.2,1.1,.2,1) .45s both",
              WebkitTextStroke: "2px var(--wa-green)",
              color: "transparent",
            }}>
              {t("heroLine3")}
            </span>
          </h1>

          <p style={{
            marginTop: 28, fontSize: 18, lineHeight: 1.5, color: "var(--wa-text-dim)", maxWidth: 520,
            animation:"wa-fadein-up 700ms ease .6s both",
          }}>
            {t("heroSub")}
          </p>

          <div style={{ display:"flex", gap: 14, marginTop: 36, flexWrap:"wrap",
            animation:"wa-fadein-up 700ms ease .75s both" }}>
            <span className="wa-cta">
              <button className="wa-btn" onClick={onBook}>
                <Icon.bolt size={16}/> {t("reserveSlot")}
              </button>
            </span>
            <button className="wa-btn wa-btn--ghost">
              <Icon.target size={16}/> {t("viewPricing")}
            </button>
          </div>

          {/* stat strip */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 24, marginTop: 52,
            animation:"wa-fadein-up 700ms ease .9s both", maxWidth: 560 }}>
            {[
              ["30 MIN", "Exclusive slot"],
              ["6 MAX", "Players per booking"],
              ["2 MODES", "Laser · Gel"],
            ].map(([k,v],i)=>(
              <div key={i} style={{ borderTop:"1px solid var(--wa-line-hot)", paddingTop: 10 }}>
                <div className="wa-h-display" style={{ fontSize: 22, color:"var(--wa-green)" }}>{k}</div>
                <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".15em", textTransform:"uppercase" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right: tactical composition */}
        <HeroRightPanel/>
      </div>

      {/* bottom marquee */}
      <div style={{
        position: "relative", zIndex: 2,
        background: "var(--wa-green)", color:"#0a0d0a",
        padding: "10px 0", overflow:"hidden",
        borderTop:"1px solid #000",
      }}>
        <div className="wa-marquee">
          {Array.from({length: 2}).map((_,i)=>(
            <div key={i} style={{ display:"flex", gap:48, paddingInlineEnd:48 }}>
              {["LASER TAG", "GEL BLASTERS", "LIVE ARENA", "HELIOPOLIS", "30-MIN SLOTS", "UP TO 6 PLAYERS", "OPEN NIGHTLY", "BIRTHDAY OPS"].map((s, j)=>(
                <span key={j} className="wa-h-display" style={{ fontSize: 14, letterSpacing:".2em", whiteSpace:"nowrap" }}>
                  <span style={{display:"inline-block", width:6, height:6, background:"#0a0d0a", marginInlineEnd:16, transform:"translateY(-3px) rotate(45deg)"}}/>
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reticle({ size=160, style={} }) {
  return (
    <div style={{ width: size, height: size, animation:"wa-drift 8s ease-in-out infinite", ...style }}>
      <svg viewBox="0 0 200 200" style={{ width:"100%", height:"100%", animation:"wa-target-spin 40s linear infinite" }}>
        <g stroke="var(--wa-green)" strokeWidth="0.6" fill="none">
          <circle cx="100" cy="100" r="95"/>
          <circle cx="100" cy="100" r="70"/>
          <circle cx="100" cy="100" r="45"/>
          <path d="M100 5 L100 40 M100 160 L100 195 M5 100 L40 100 M160 100 L195 100" strokeWidth="1"/>
          <path d="M70 10 L130 10 M10 70 L10 130 M70 190 L130 190 M190 70 L190 130" strokeWidth="0.4"/>
        </g>
        <g fill="var(--wa-green)">
          <circle cx="100" cy="100" r="2"/>
        </g>
      </svg>
    </div>
  );
}

function HUDCorner({ corner }) {
  const pos = {
    tl: { top: 18, left: 18, borders: { borderTop: "2px solid var(--wa-green)", borderLeft: "2px solid var(--wa-green)" } },
    tr: { top: 18, right: 18, borders: { borderTop: "2px solid var(--wa-green)", borderRight: "2px solid var(--wa-green)" } },
    bl: { bottom: 58, left: 18, borders: { borderBottom: "2px solid var(--wa-green)", borderLeft: "2px solid var(--wa-green)" } },
    br: { bottom: 58, right: 18, borders: { borderBottom: "2px solid var(--wa-green)", borderRight: "2px solid var(--wa-green)" } },
  }[corner];
  const { borders, ...p } = pos;
  return <div style={{ position:"absolute", width: 26, height: 26, ...borders, ...p, zIndex: 3 }}/>;
}

function HeroRightPanel() {
  return (
    <div style={{ position: "relative", height: 520 }}>
      {/* main tactical card */}
      <div className="wa-panel wa-panel--clip wa-brackets" style={{
        position:"absolute", inset: 0, padding: 24,
        animation:"wa-fadein-up 900ms ease .5s both",
      }}>
        <div style={{ position:"relative", width:"100%", height:"100%" }}>
          <GamePlaceholder variant="laser" label="[ ARENA LIVE FEED · DROP HERO PHOTO ]"/>
          {/* live ping */}
          <div style={{
            position:"absolute", top: 14, left: 14,
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(0,0,0,.6)", padding:"6px 10px", border:"1px solid var(--wa-line)",
          }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--wa-red)", animation:"wa-blink 1.2s infinite" }}/>
            <span className="wa-mono" style={{ fontSize: 11, letterSpacing:".15em", color:"#fff" }}>LIVE · ARENA 01</span>
          </div>
          {/* reticle overlay */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width: 120, height: 120,
            transform:"translate(-50%,-50%)",
            animation:"wa-reticle-bob 2.4s ease-in-out infinite",
          }}>
            <svg viewBox="0 0 120 120" fill="none" stroke="#fff" strokeWidth="1.2">
              <circle cx="60" cy="60" r="50" opacity=".9"/>
              <path d="M60 5 V30 M60 90 V115 M5 60 H30 M90 60 H115"/>
              <circle cx="60" cy="60" r="3" fill="#fff"/>
            </svg>
          </div>
        </div>
      </div>

      {/* stat badge */}
      <div className="wa-panel wa-panel--clip" style={{
        position:"absolute", top: -14, right: -14, padding:"10px 14px",
        background:"var(--wa-green)", color:"#0a0d0a",
        animation:"wa-count 800ms ease 1s both",
      }}>
        <div className="wa-mono" style={{ fontSize: 10, letterSpacing:".18em" }}>NEXT SLOT</div>
        <div className="wa-h-display" style={{ fontSize: 22 }}>7:00 PM</div>
      </div>

      {/* side tape */}
      <div style={{
        position:"absolute", bottom: 28, left: -24,
        animation:"wa-fadein-up 800ms ease 1.1s both",
      }}>
        <div className="wa-tape wa-tape--orange">GEL · BLASTERS · LASER · TAG</div>
      </div>
    </div>
  );
}

// ------- GAMES SECTION --------------------------------------------------
function GamesSection({ onBook }) {
  const { t } = useI18n();
  return (
    <section id="public" style={{ padding: "120px 24px 80px", position:"relative" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionHeader kicker="01 · LINEUP" title={t("games")} line="Choose your loadout. Every slot is yours — venue-wide exclusive."/>
        <div style={{
          marginTop: 48,
          display:"grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
        }}>
          {GAMES.map((g,i)=>(
            <GameCard key={g.id} game={g} index={i} onBook={onBook}/>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title, line }) {
  return (
    <div style={{ display:"flex", alignItems:"end", justifyContent:"space-between", gap: 40, flexWrap:"wrap" }}>
      <div>
        <div className="wa-mono" style={{ color:"var(--wa-green)", fontSize: 12, letterSpacing:".2em", marginBottom: 12 }}>{kicker}</div>
        <h2 className="wa-h-display" style={{ fontSize:"clamp(40px, 6vw, 72px)", margin: 0 }}>{title}</h2>
      </div>
      <p style={{ maxWidth: 440, color:"var(--wa-text-dim)", fontSize: 16, marginBottom: 6 }}>{line}</p>
    </div>
  );
}

function GameCard({ game, index, onBook }) {
  const [hover, setHover] = useState(false);
  const { t } = useI18n();
  return (
    <div
      className="wa-panel wa-panel--clip wa-brackets"
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        padding: 0, overflow: "hidden", position:"relative",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition:"transform 200ms ease, box-shadow 200ms ease",
        boxShadow: hover ? "0 20px 60px rgba(143,224,74,.12), var(--wa-green-glow)" : "none",
      }}
    >
      <div style={{ aspectRatio: "4 / 3", position:"relative", borderBottom:"1px solid var(--wa-line)" }}>
        <GamePlaceholder variant={game.variant} label={`[ ${game.name.toUpperCase()} ]`}/>
        <div style={{ position:"absolute", top:12, left: 12 }}>
          <span className={`wa-tag ${game.type==='gel'?'wa-tag--orange':''}`}>
            {game.type === 'laser' ? <Icon.bolt size={12}/> : <Icon.target size={12}/>}
            {game.type === 'laser' ? t('laserTag').toUpperCase() : t('gelBlasters').toUpperCase()}
          </span>
        </div>
        <div style={{ position:"absolute", top:12, right: 12 }} className="wa-mono">
          <span style={{ fontSize: 11, color:"var(--wa-text)", background:"rgba(0,0,0,.6)", padding:"4px 8px", border:"1px solid var(--wa-line)" }}>
            {String(index + 1).padStart(2, '0')} / 0{GAMES.length}
          </span>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <h3 className="wa-h-display" style={{ fontSize: 28, margin: 0 }}>{game.name}</h3>
        <p style={{ color:"var(--wa-text-dim)", fontSize:14, lineHeight:1.5, marginTop: 10 }}>{game.blurb}</p>

        <div style={{ display:"flex", alignItems:"end", justifyContent:"space-between", marginTop: 22 }}>
          <div>
            <div className="wa-mono" style={{ color:"var(--wa-text-mute)", fontSize: 10, letterSpacing:".15em", textTransform:"uppercase" }}>{t("startingAt")}</div>
            <div className="wa-h-display" style={{ fontSize: 32, color:"var(--wa-green)" }}>
              {fmt(game.price)} <span style={{ fontSize: 14, color:"var(--wa-text-dim)" }}>EGP {t("perPlayer")}</span>
            </div>
          </div>
          <div className="wa-mono" style={{ color:"var(--wa-text-dim)", fontSize: 12 }}>
            <Icon.clock size={14} style={{ verticalAlign:"middle", marginInlineEnd: 4 }}/>
            {game.duration}M
          </div>
        </div>

        <button className="wa-btn wa-btn-sm" style={{ width:"100%", marginTop: 18 }} onClick={()=>onBook(game)}>
          {t("bookNow")} <Icon.arrow size={14}/>
        </button>
      </div>
    </div>
  );
}

// ------- BUNDLES SECTION ------------------------------------------------
function BundlesSection({ onBook }) {
  const { t } = useI18n();
  return (
    <section id="bundles" style={{ padding: "80px 24px", background: "linear-gradient(180deg, transparent, #0d110e)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionHeader kicker="02 · FIRE TEAMS" title={t("bundles")} line="Bring the squad. Save the ammo budget. Two pricing modes — per-player or fixed-team."/>
        <div style={{ marginTop: 48, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 20 }}>
          {BUNDLES.map((b,i)=><BundleCard key={b.id} bundle={b} i={i} onBook={onBook}/>)}
        </div>
      </div>
    </section>
  );
}

function BundleCard({ bundle, i, onBook }) {
  const { t } = useI18n();
  const perPlayer = bundle.mode === "per_player";
  const total = perPlayer ? bundle.price * bundle.players : bundle.price;
  return (
    <div className="wa-panel wa-panel--clip" style={{ padding: 26, position:"relative", overflow:"hidden" }}>
      {/* watermark num */}
      <div className="wa-h-display" style={{
        position:"absolute", top:-10, right:-6, fontSize: 130, color:"rgba(143,224,74,.06)", pointerEvents:"none",
      }}>{String(i+1).padStart(2, '0')}</div>

      <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
        <span className="wa-tag wa-tag--orange"><Icon.spark size={12}/> BUNDLE</span>
        <span className="wa-tag wa-tag--neutral">{perPlayer ? "PER PLAYER" : "FIXED TOTAL"}</span>
      </div>

      <h3 className="wa-h-display" style={{ fontSize: 36, marginTop: 16 }}>{bundle.name}</h3>

      {/* pricing block — the two variants */}
      <div style={{ marginTop: 18, paddingBlock: 16, borderTop:"1px dashed var(--wa-line-hot)", borderBottom:"1px dashed var(--wa-line-hot)" }}>
        {perPlayer ? (
          <div>
            <div className="wa-h-display" style={{ fontSize: 42, color:"var(--wa-green)" }}>
              {fmt(bundle.price)} <span style={{ fontSize: 14, color:"var(--wa-text-dim)" }}>EGP / PLAYER</span>
            </div>
            <div className="wa-mono" style={{ color:"var(--wa-text-dim)", fontSize: 13, marginTop: 6 }}>
              × {bundle.players} players &nbsp;=&nbsp;
              <span style={{ color:"var(--wa-text)" }}>{fmt(total)} EGP total</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="wa-h-display" style={{ fontSize: 42, color:"var(--wa-orange)" }}>
              {fmt(bundle.price)} <span style={{ fontSize: 14, color:"var(--wa-text-dim)" }}>EGP TOTAL</span>
            </div>
            <div className="wa-mono" style={{ color:"var(--wa-text-dim)", fontSize: 13, marginTop: 6 }}>
              for the group &nbsp;·&nbsp; up to {bundle.players} players
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display:"flex", flexDirection:"column", gap: 6 }}>
        {bundle.includes.map((inc,j)=>(
          <div key={j} style={{ display:"flex", alignItems:"center", gap: 10, color:"var(--wa-text-dim)", fontSize: 14 }}>
            <Icon.check size={14} style={{ color:"var(--wa-green)" }}/> {inc}
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap: 14, marginTop: 22, color:"var(--wa-text-dim)" }} className="wa-mono">
        <span style={{ fontSize: 12 }}><Icon.users size={13} style={{verticalAlign:"middle"}}/> {bundle.players} PL</span>
        <span style={{ fontSize: 12 }}><Icon.clock size={13} style={{verticalAlign:"middle"}}/> {bundle.duration}M</span>
      </div>

      <button className="wa-btn wa-btn-sm" style={{ width:"100%", marginTop: 20 }} onClick={()=>onBook(bundle)}>
        {t("select")} <Icon.arrow size={14}/>
      </button>
    </div>
  );
}

// ------- HOW IT WORKS ---------------------------------------------------
function HowItWorks() {
  const steps = [
    { n:"01", t:"Pick a Game", d:"Laser Tag or Gel Blasters. 30 or 60 minutes. Solo drop-in or full squad." },
    { n:"02", t:"Lock a Slot", d:"Every slot is venue-wide exclusive. If you book 7:00 PM, the arena is yours." },
    { n:"03", t:"Pay 50%", d:"Drop a deposit via WhatsApp or InstaPay. We hold your slot. No deposit, no reservation." },
    { n:"04", t:"Show Up & Win", d:"Arrive 15 minutes early for gear-up. Bring your A-game. Leave sweaty." },
  ];
  return (
    <section id="how" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionHeader kicker="03 · PROTOCOL" title="How it works" line="Four moves. No hidden steps."/>
        <div style={{ marginTop: 48, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 16 }}>
          {steps.map((s,i)=>(
            <div key={i} className="wa-panel" style={{ padding: 24, position:"relative" }}>
              <div className="wa-h-display" style={{ fontSize: 56, color:"var(--wa-green)", lineHeight: 1 }}>{s.n}</div>
              <div style={{ height: 1, background:"var(--wa-line-hot)", margin:"14px 0" }}/>
              <div className="wa-h-display" style={{ fontSize: 20 }}>{s.t}</div>
              <p style={{ color:"var(--wa-text-dim)", fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------- GALLERY / NOTICE / FAQ / LOCATION / FOOTER ---------------------
function Gallery() {
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionHeader kicker="04 · FROM THE ARENA" title="In the field" line="Real photos go here. Placeholders shown for handoff."/>
        <div style={{
          marginTop: 40,
          display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gridTemplateRows:"220px 220px", gap: 12,
        }}>
          {[
            { c:"span 3", r:"span 2", v:"laser", l:"HERO · LANDSCAPE" },
            { c:"span 2", r:"span 1", v:"gel", l:"GEAR CLOSEUP" },
            { c:"span 1", r:"span 1", v:"bundle", l:"TEAM · PORTRAIT" },
            { c:"span 1", r:"span 1", v:"laser", l:"REACTION" },
            { c:"span 2", r:"span 1", v:"gel", l:"ARENA WIDE" },
          ].map((g,i)=>(
            <div key={i} className="wa-panel" style={{ gridColumn:g.c, gridRow:g.r, overflow:"hidden" }}>
              <GamePlaceholder variant={g.v} label={g.l}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParkNotice() {
  return (
    <section style={{ padding: "40px 24px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="wa-panel" style={{
          padding: 28, display:"flex", alignItems:"center", gap: 20,
          borderColor: "rgba(255,122,26,.3)",
          background: "linear-gradient(90deg, rgba(255,122,26,.06), transparent)",
        }}>
          <div style={{ width: 52, height: 52, display:"grid", placeItems:"center", color:"var(--wa-orange)", border:"1px solid var(--wa-orange)" }}>
            <Icon.shield size={22}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-orange)", letterSpacing:".2em" }}>HEADS UP · PARK ENTRY FEE</div>
            <div style={{ fontSize: 15, color:"var(--wa-text)", marginTop: 4, lineHeight: 1.5 }}>
              Warriors Arena lives inside Family Park. A small <b>park entrance fee</b> is paid at the gate and is <b>not included</b> in your booking.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const qs = [
    { q: "What happens if we're late?", a: "Your slot starts on the clock. We'll hold gear but the timer runs — that's how exclusivity stays fair for the next team." },
    { q: "Minimum players?", a: "Two. Below that, Laser Tag stops being fun. For fixed-total bundles, the price doesn't change — you still get the full arena." },
    { q: "Can I bring my own gear?", a: "For safety and liability, only Warriors Arena gear is used inside the arena. Sorry, super soldier." },
    { q: "Age limits?", a: "7+ for Gel Blasters, 10+ for Laser Tag — supervised. IDs required for group-organizer role." },
    { q: "How do I cancel?", a: "Up to 24 hours before your slot, full deposit back. Inside 24 hours, deposit is forfeit." },
  ];
  return (
    <section id="faq" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <SectionHeader kicker="05 · INTEL" title="FAQ" line=""/>
        <div style={{ marginTop: 40, display:"flex", flexDirection:"column", gap: 6 }}>
          {qs.map((x,i)=>(
            <div key={i} className="wa-panel" style={{ padding: "18px 22px", cursor:"pointer" }} onClick={()=>setOpen(open===i?-1:i)}>
              <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
                <span className="wa-mono" style={{ fontSize: 12, color:"var(--wa-green)" }}>0{i+1}</span>
                <div style={{ flex: 1, fontFamily:"var(--ff-display)", fontSize: 18, textTransform:"uppercase", letterSpacing:".02em" }}>{x.q}</div>
                <div style={{ color:"var(--wa-green)", transform:`rotate(${open===i?45:0}deg)`, transition:"transform 160ms" }}>
                  <Icon.plus size={18}/>
                </div>
              </div>
              {open===i && (
                <div style={{ color:"var(--wa-text-dim)", fontSize: 15, lineHeight: 1.6, paddingTop: 14, paddingInlineStart: 32, animation:"wa-fadein-up 240ms ease" }}>
                  {x.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section id="location" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap: 32 }}>
        <div>
          <SectionHeader kicker="06 · RALLY POINT" title="Heliopolis" line=""/>
          <div style={{ marginTop: 40, display:"flex", flexDirection:"column", gap: 20 }}>
            {[
              ["ADDRESS", "Family Park · Heliopolis, Cairo"],
              ["HOURS", "Daily · 6:00 PM — 9:00 PM (last slot 8:30 PM)"],
              ["WHATSAPP", "+20 122 655 7592"],
              ["INSTAGRAM", "@warriors.arena.egy"],
            ].map(([k,v])=>(
              <div key={k}>
                <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-green)", letterSpacing:".2em" }}>{k}</div>
                <div style={{ fontSize: 20, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap: 12, marginTop: 32 }}>
            <button className="wa-btn"><Icon.whatsapp size={16}/> WHATSAPP</button>
            <button className="wa-btn wa-btn--ghost"><Icon.pin size={16}/> GET DIRECTIONS</button>
          </div>
        </div>
        <div className="wa-panel wa-panel--clip" style={{ height: 420, position:"relative", overflow:"hidden" }}>
          {/* faux tactical map */}
          <div style={{
            position:"absolute", inset: 0,
            background:"#0d1410",
            backgroundImage:
              "linear-gradient(rgba(143,224,74,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(143,224,74,.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}/>
          {/* roads */}
          <svg viewBox="0 0 400 300" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            <path d="M0 160 Q 150 140 280 180 T 400 200" stroke="var(--wa-line-hot)" strokeWidth="8" fill="none"/>
            <path d="M0 160 Q 150 140 280 180 T 400 200" stroke="#0d1410" strokeWidth="2" strokeDasharray="8 10" fill="none"/>
            <path d="M180 0 L 220 300" stroke="var(--wa-line-hot)" strokeWidth="6" fill="none"/>
            <path d="M180 0 L 220 300" stroke="#0d1410" strokeWidth="1.5" strokeDasharray="6 10" fill="none"/>
            {/* pin */}
            <g transform="translate(210 160)">
              <circle r="26" fill="var(--wa-green)" opacity=".18"/>
              <circle r="14" fill="var(--wa-green)" opacity=".35"/>
              <circle r="5" fill="var(--wa-green)"/>
            </g>
          </svg>
          <div style={{ position:"absolute", top: 16, left: 16, display:"flex", gap: 8 }}>
            <span className="wa-tag"><Icon.pin size={12}/> 30.0906°N · 31.3381°E</span>
          </div>
          <div style={{ position:"absolute", bottom: 16, left: 16, right: 16, display:"flex", justifyContent:"space-between" }}>
            <span className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)" }}>TACTICAL MAP · 1:500</span>
            <span className="wa-mono" style={{ fontSize: 10, color:"var(--wa-text-mute)" }}>[ EMBED GOOGLE MAP ]</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop:"1px solid var(--wa-line)", padding:"40px 24px", background:"#080a08" }}>
      <div style={{ maxWidth: 1320, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", gap: 20, flexWrap:"wrap" }}>
        <Logo/>
        <div className="wa-mono" style={{ fontSize: 11, color:"var(--wa-text-mute)", letterSpacing:".15em" }}>
          © WARRIORS ARENA · HELIOPOLIS · DESIGNED FOR WAR — PLAYED FOR FUN
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <a href="#" style={{ color:"var(--wa-text-dim)", fontSize: 12 }} className="wa-mono">PRIVACY</a>
          <a href="#" style={{ color:"var(--wa-text-dim)", fontSize: 12 }} className="wa-mono">TERMS</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  TopNav, Hero, GamesSection, BundlesSection, HowItWorks,
  Gallery, ParkNotice, FAQ, LocationSection, Footer,
  SectionHeader,
});
