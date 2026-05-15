// app.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== Konstanta: 3D Tour ================== */
const MATTERPORT_URL =
  "https://my.matterport.com/show/?m=PTEAUeUbMno&ss=53&sr=-1.6%2C1.05&tag=8hiaV2GWWhB&pin-pos=20.12%2C-3.85%2C8.94";

const BOOKING_URL_CS = "https://www.chillapartments.cz/rezervace-online/";
const BOOKING_URL_INTL = "https://www.chillapartments.cz/en/rezervace-online/";

const LS_LAST_REPLY = "chill_concierge_last_reply_v1";

function flowNode(nid, rest) {
  return { nid, ...rest };
}

/** Kořenová témata pro obrazovku „Důležité teď“ (musí odpovídat `nid` v makeFlows). */
const ESSENTIAL_MENU_NIDS = [
  "wifi_quick",
  "stay_instructions",
  "other_luggage",
  "tech_ac",
];

/** Z odpovědi concierge (markdown) s údaji Wi‑Fi. */
function extractWifiCredsFromReply(src) {
  const s = typeof src === "string" ? src : "";
  const ssidM = s.match(/SSID\s*\*\*([A-Z0-9]{4})\*\*/i);
  const passM = s.match(/\*\*(\d{8})\*\*/);
  if (ssidM?.[1] && passM?.[1]) return { ssid: ssidM[1], pass: passM[1] };
  return null;
}

/** Cesta od kořene k uzlu s daným `nid` (včetně cíle). */
function findPathByNid(nodes, targetNid, pathSoFar = []) {
  if (!nodes?.length) return null;
  for (const n of nodes) {
    const chain = [...pathSoFar, n];
    if (n.nid === targetNid) return chain;
    if (n.children?.length) {
      const hit = findPathByNid(n.children, targetNid, chain);
      if (hit) return hit;
    }
  }
  return null;
}

/** Otevře větev menu podle `nid` (deep link). */
function navigateFlowNid(nid, flows, actions) {
  if (!flows?.length || !nid) return false;
  const path = findPathByNid(flows, nid);
  if (!path?.length) return false;
  const { setStack, setShortcutsOpen, setWifiCtas, scrollToMainNav, onChipClick } = actions;
  const target = path[path.length - 1];
  if (target.children?.length) {
    flushSync(() => {
      setStack(path);
      setShortcutsOpen(true);
      setWifiCtas({ showPassword: false, showNotOk: false });
    });
  } else {
    flushSync(() => {
      setStack(path.slice(0, -1));
      setShortcutsOpen(true);
      setWifiCtas({ showPassword: false, showNotOk: false });
    });
    requestAnimationFrame(() => onChipClick(target));
  }
  scrollToMainNav?.();
  return true;
}

/** ================== UI (inline CSS) ================== */
const AppStyles = () => (
  <style>{`
    :root{
      --ink:#0f1419;
      --ink-soft:#3d4550;
      --light-surface-ink:#0f1419;
      --muted:#5c6570;
      --surface:#ffffff;
      --surface-2:#f1f5f4;
      --border:rgba(15,20,25,.10);
      --glow:rgba(20,184,166,.22);
      --accent:#0d9488;
      --accent-2:#0f766e;
      --accent-3:#115e59;
      --teal:#14b8a6;
      --teal-muted:#5eead4;
      --blue: var(--accent);
      --danger:#dc2626;
      --tile-radius:16px;
      --radius-lg:20px;
      --radius-md:14px;
      --radius-btn:14px;
      --radius-btn-soft:12px;
      --shadow:0 4px 6px -1px rgba(15,20,25,.06), 0 12px 24px -4px rgba(15,20,25,.08);
      --shadow-lg:0 20px 40px -12px rgba(15,20,25,.15);
      --whatsapp-dock:70px;
      --font-app:"Comfortaa","Quicksand",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    }

    body{
      margin:0;
      height:100%;
      overflow:hidden;
      font-family:var(--font-app);
      color:var(--ink);
      -webkit-tap-highlight-color:transparent;
      background:
        radial-gradient(120% 80% at 0% 0%, rgba(13,148,136,.10), transparent 52%),
        radial-gradient(90% 70% at 100% 10%, rgba(20,184,166,.08), transparent 48%),
        linear-gradient(168deg, #f8fafb 0%, #eef2f1 42%, #ecf4f3 100%);
      background-attachment:fixed;
    }

    @media (prefers-color-scheme: dark) {
      :root{
        --ink:#e8ecf0;
        --ink-soft:#b8c0c8;
        --muted:#8a939e;
        --surface:#141a1f;
        --surface-2:#1c242c;
        --border:rgba(255,255,255,.10);
        --glow:rgba(20,184,166,.18);
        --shadow:0 4px 6px -1px rgba(0,0,0,.35), 0 12px 24px -4px rgba(0,0,0,.45);
        --shadow-lg:0 20px 40px -12px rgba(0,0,0,.55);
      }
      body{
        background:
          radial-gradient(120% 80% at 0% 0%, rgba(13,148,136,.16), transparent 52%),
          radial-gradient(90% 70% at 100% 10%, rgba(20,184,166,.10), transparent 48%),
          linear-gradient(168deg, #0d1114 0%, #121a1a 42%, #0f1616 100%);
      }
      .appHeader{
        background:rgba(20,26,30,.92);
      }
      .scroller{
        background:linear-gradient(180deg,#1a2128,#151b20);
      }
      .me{
        background:linear-gradient(145deg, #134e4a, #115e59);
        color:#ecfdf5;
      }
      .bot{
        background:linear-gradient(180deg, #1c242c, #171d24);
      }
      .offlineBar{color:#fcd34d;background:rgba(251,191,36,.12)}
      .errorBar{color:#fecaca}
      .essentialsTile{
        color:#dff8f3;
        border-color:color-mix(in oklab,var(--btn,var(--accent)),white 26%);
        background:linear-gradient(168deg,
          color-mix(in oklab,var(--btn,var(--accent)),black 52%) 0%,
          color-mix(in oklab,var(--btn,var(--accent)),black 68%) 100%);
        box-shadow:
          0 1px 0 rgba(255,255,255,.1) inset,
          0 8px 22px color-mix(in oklab,var(--btn,var(--accent)),transparent 48%),
          0 2px 10px rgba(0,0,0,.4);
      }
      .essentialsTile:hover,.essentialsTile:focus-visible{
        border-color:color-mix(in oklab,var(--btn,var(--accent)),#a5b4fc 38%);
        filter:brightness(1.07);
      }
    }

    #root{font-family:var(--font-app)}
    button,input,textarea,select,optgroup{
      font-family:var(--font-app);
    }

    .appShell{
      flex:1;
      min-height:0;
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }

    .appHeader{
      position:sticky;top:0;z-index:1500;
      padding:calc(10px + env(safe-area-inset-top,0px)) max(16px, env(safe-area-inset-right,0px)) 12px max(16px, env(safe-area-inset-left,0px));
      background:rgba(255,255,255,.88);
      backdrop-filter:saturate(140%) blur(14px);
      border-bottom:1px solid var(--border);
      box-shadow:0 1px 0 rgba(255,255,255,.6) inset;
    }
    .appHeaderInner{max-width:920px;margin:0 auto;width:100%}
    .brandMvp{
      display:flex;align-items:center;justify-content:center;gap:16px;
      max-width:920px;margin:0 auto;
    }
    .brandLogo{
      width:58px;height:58px;object-fit:cover;border-radius:17px;
      flex-shrink:0;
      border:1px solid var(--border);
      box-shadow:var(--shadow);
    }
    .brandText{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;text-align:left}
    .brandName{
      font-weight:800;font-size:clamp(1.12rem, 4vw, 1.3rem);letter-spacing:-.03em;line-height:1.15;color:var(--light-surface-ink);
    }
    .brandTag{
      font-size:.74rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);
    }

    .headerCtaRow{
      display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:stretch;
      margin-top:12px;padding-top:12px;border-top:1px solid var(--border);
    }
    .headerBookBtn{
      flex:1 1 200px;
      display:inline-flex;align-items:center;justify-content:center;gap:8px;
      min-height:46px;padding:12px 18px;border-radius:14px;
      font-family:var(--font-app);
      font-weight:800;font-size:.92rem;letter-spacing:.02em;
      text-shadow:0 1px 0 rgba(0,0,0,.25),0 2px 8px rgba(0,0,0,.2);
      text-decoration:none;color:#fff;text-align:center;
      background:linear-gradient(165deg,#a855f7,#7c3aed);
      border:1px solid color-mix(in oklab,#6d28d9,black 12%);
      box-shadow:0 3px 0 color-mix(in oklab,#5b21b6,black 8%), 0 10px 28px rgba(124,58,237,.32);
      touch-action:manipulation;
    }
    .headerBookBtn:active{transform:translateY(2px);box-shadow:0 1px 0 color-mix(in oklab,#5b21b6,black 8%), 0 6px 18px rgba(124,58,237,.22)}
    .headerInstallBtn{
      flex:0 1 160px;
      appearance:none;
      min-height:46px;padding:12px 16px;border-radius:14px;
      font-family:var(--font-app);
      font-weight:700;font-size:.86rem;
      color:var(--accent-2);
      background:var(--surface-2);
      border:1px solid var(--border);
      cursor:pointer;
      touch-action:manipulation;
    }
    .headerInstallBtn:active{filter:brightness(.97);transform:translateY(1px)}
    .headerShareBtn{
      flex:0 1 140px;
      appearance:none;
      min-height:46px;padding:12px 14px;border-radius:14px;
      font-family:var(--font-app);
      font-weight:700;font-size:.82rem;
      color:var(--accent-2);
      background:linear-gradient(180deg,#f6fdfb,#e8f7f4);
      border:1px solid color-mix(in oklab,var(--accent),transparent 50%);
      cursor:pointer;
      touch-action:manipulation;
      box-shadow:0 2px 8px rgba(13,148,136,.1);
    }
    .headerShareBtn:active{filter:brightness(.96);transform:translateY(1px)}
    .headerCtaRow--solo .headerBookBtn{flex:1 1 200px}
    .headerCtaRow--solo .headerShareBtn{flex:1 1 160px}

    .row{
      flex:1;
      display:flex;
      flex-direction:column;
      gap:10px;
      min-height:0;
      max-width:920px;
      width:100%;
      margin:0 auto;
      padding:8px max(14px, env(safe-area-inset-left,0px)) calc(12px + var(--whatsapp-dock) + env(safe-area-inset-bottom,0px)) max(14px, env(safe-area-inset-right,0px));
      overflow-y:auto;
      overflow-x:hidden;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
      scroll-behavior:auto;
    }
    .row:not(.rowLangOnly){
      padding-bottom:calc(88px + var(--whatsapp-dock) + env(safe-area-inset-bottom,0px));
    }
    .scroller{
      flex:0 0 auto;
      overflow:visible;
      padding:12px 14px 14px;
      border-radius:var(--radius-lg);
      background:var(--surface);
      border:1px solid var(--border);
      box-shadow:var(--shadow);
    }
    .scroller--elevated{
      box-shadow:var(--shadow), 0 0 0 1px color-mix(in oklab,var(--accent),transparent 90%);
    }
    .sectionDivider{
      height:1px;
      background:linear-gradient(90deg,transparent,var(--border),transparent);
      margin:2px 0 0;
      flex-shrink:0;
    }
    .breadcrumbNav{
      font-size:.78rem;font-weight:600;color:var(--muted);line-height:1.4;
      margin:0 0 8px;padding:8px 12px;border-radius:12px;background:var(--surface-2);
      border:1px solid var(--border);
    }
    .breadcrumbNav .crumbSep{opacity:.5;padding:0 5px}
    .essentialsGrid{
      display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 10px;
    }
    .essentialsTile{
      appearance:none;font-family:var(--font-app);font-size:.9rem;font-weight:800;
      min-height:58px;padding:14px 12px;border-radius:16px;cursor:pointer;
      text-align:center;line-height:1.25;touch-action:manipulation;
      border:2px solid color-mix(in oklab,var(--btn,var(--accent)),transparent 18%);
      color:color-mix(in oklab,var(--btn,var(--accent)),black 52%);
      background:linear-gradient(168deg,
        color-mix(in oklab,var(--btn,var(--accent)),white 78%) 0%,
        color-mix(in oklab,var(--btn,var(--accent)),white 90%) 48%,
        color-mix(in oklab,var(--btn,var(--accent)),white 82%) 100%);
      box-shadow:
        0 1px 0 rgba(255,255,255,.55) inset,
        0 6px 16px color-mix(in oklab,var(--btn,var(--accent)),transparent 72%),
        0 2px 6px rgba(15,20,25,.06);
      transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease,filter .12s ease;
    }
    .essentialsTile:hover,.essentialsTile:focus-visible{
      outline:none;
      filter:brightness(1.02);
      border-color:color-mix(in oklab,var(--btn,var(--accent)),#6366f1 28%);
      box-shadow:
        0 1px 0 rgba(255,255,255,.65) inset,
        0 8px 22px color-mix(in oklab,var(--btn,var(--accent)),transparent 58%),
        0 0 0 1px color-mix(in oklab,#6366f1,transparent 82%),
        0 3px 8px rgba(15,20,25,.08);
    }
    .essentialsTile:focus-visible{
      outline:2px solid color-mix(in oklab,var(--btn,var(--accent)),#6366f1 35%);outline-offset:2px;
    }
    .essentialsTile:active{transform:scale(.985);filter:brightness(.98)}
    .essentialsAllTopicsBtn{
      display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;
      margin:8px 0 18px;padding:16px 20px;border-radius:16px;cursor:pointer;touch-action:manipulation;
      min-height:60px;border:2px solid color-mix(in oklab,var(--accent),black 14%);
      font-family:var(--font-app);font-weight:800;font-size:clamp(.95rem,3.2vw,1.08rem);letter-spacing:.03em;
      color:#f8fffe;
      background:linear-gradient(155deg,color-mix(in oklab,var(--accent),white 14%) 0%,var(--accent) 40%,color-mix(in oklab,var(--accent),black 12%) 100%);
      box-shadow:
        0 1px 0 rgba(255,255,255,.28) inset,
        0 2px 0 rgba(255,255,255,.08) inset,
        0 10px 28px color-mix(in oklab,var(--accent),transparent 48%),
        0 4px 14px rgba(15,20,25,.14);
      text-shadow:0 1px 0 rgba(0,0,0,.22);
      transition:transform .12s ease,filter .12s ease,box-shadow .12s ease;
    }
    .essentialsAllTopicsBtnIcon{
      font-size:1.15rem;line-height:1;opacity:.95;font-weight:900;
    }
    .essentialsAllTopicsBtn:hover,.essentialsAllTopicsBtn:focus-visible{
      filter:brightness(1.05);outline:none;
      box-shadow:
        0 1px 0 rgba(255,255,255,.3) inset,
        0 2px 0 rgba(255,255,255,.1) inset,
        0 12px 32px color-mix(in oklab,var(--accent),transparent 42%),
        0 4px 16px rgba(15,20,25,.16);
    }
    .essentialsAllTopicsBtn:focus-visible{
      outline:3px solid color-mix(in oklab,var(--accent),white 35%);outline-offset:3px;
    }
    .essentialsAllTopicsBtn:active{transform:scale(.985);filter:brightness(.97)}
    .wifiCopyBar{margin:8px 0 0;padding:0 2px}
    .wifiCopyBtn{
      appearance:none;font-family:var(--font-app);font-size:.84rem;font-weight:700;
      padding:12px 16px;border-radius:12px;border:1px solid color-mix(in oklab,var(--accent),transparent 35%);
      background:color-mix(in oklab,var(--accent),transparent 92%);color:var(--accent-2);
      cursor:pointer;width:100%;max-width:280px;touch-action:manipulation;min-height:48px;
    }
    .wifiCopyBtn:hover,.wifiCopyBtn:focus-visible{border-color:var(--accent);outline:none}
    .searchQuickPicks{margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)}
    .searchQuickPicksLabel{font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:8px}
    .searchQuickPickBtn{
      display:block;width:100%;text-align:left;margin-bottom:6px;padding:11px 14px;border-radius:12px;
      border:1px solid var(--border);background:var(--surface-2);font-family:var(--font-app);
      font-weight:600;font-size:.88rem;color:var(--accent-2);cursor:pointer;min-height:46px;touch-action:manipulation;
    }
    .searchQuickPickBtn:hover,.searchQuickPickBtn:focus-visible{
      background:color-mix(in oklab,var(--accent),transparent 86%);outline:none;
    }
    .toastBar{
      position:fixed;top:calc(env(safe-area-inset-top,0px) + 72px);left:50%;transform:translateX(-50%);
      z-index:2100;max-width:min(520px,calc(100vw - 24px));padding:12px 18px;border-radius:14px;
      background:linear-gradient(165deg,var(--accent),var(--accent-2));color:#fff;font-weight:700;font-size:.86rem;
      text-shadow:0 1px 0 rgba(0,0,0,.25);box-shadow:var(--shadow-lg);
      animation:toastIn .28s ease;text-align:center;
    }
    @keyframes toastIn{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}
    .offlineBar,.errorBar{
      max-width:920px;width:100%;margin:0 auto 8px;
      padding:11px 14px;border-radius:12px;font-size:.86rem;font-weight:600;line-height:1.45;
      box-sizing:border-box;
    }
    .offlineBar{background:rgba(251,191,36,.2);border:1px solid rgba(245,158,11,.38);color:#92400e}
    .errorBar{
      background:rgba(252,165,165,.18);border:1px solid rgba(248,113,113,.42);color:#991b1b;
      display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;
    }
    .errorBar a{color:inherit;font-weight:800;text-underline-offset:3px}

    .bubble{
      border-radius:var(--radius-md);padding:12px 16px;line-height:1.45;width:fit-content;max-width:100%;white-space:pre-line;
      border:1px solid var(--border);background:var(--surface);box-shadow:0 2px 8px rgba(15,20,25,.04);
    }
    .chatAssistantAnchor{
      scroll-margin-top:calc(88px + env(safe-area-inset-top, 0px));
    }
    .me{
      margin-left:auto;
      background:linear-gradient(145deg, #ecfdf5, #d1fae5);
      border-color:rgba(20,184,166,.25);
      color:var(--light-surface-ink);
    }
    .bot{
      background:linear-gradient(180deg, #ffffff, #f9fafb);
      border-color:color-mix(in oklab,var(--accent),transparent 88%);
      color:var(--light-surface-ink);
    }

    .bot p{margin:6px 0}
    .bot ul,.bot ol{margin:8px 0;padding-left:20px}
    .bot li{margin:3px 0}
    .bot li p{margin:0}
    .bot li p + p{margin-top:4px}

    .bot img{
      max-width:100%;height:auto;border-radius:var(--radius-md);display:block;margin:10px 0;
      box-shadow:var(--shadow);border:1px solid var(--border);
    }
    .bot a{
      display:inline-block;padding:10px 16px;border-radius:999px;margin:4px 4px 0 0;
      border:1px solid color-mix(in oklab, var(--accent), black 12%);
      background:linear-gradient(180deg, var(--accent), var(--accent-2));
      color:#fff;text-decoration:none;font-family:var(--font-app);font-weight:700;font-size:.9rem;
      box-shadow:0 6px 16px rgba(13,148,136,.28);
      transition:transform .15s ease, box-shadow .15s ease;
    }
    .bot a:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(13,148,136,.32)}

    .chipPrimary{
      --btn:var(--accent);
      appearance:none;
      font-family:var(--font-app);
      padding:14px 18px;border-radius:var(--radius-btn);
      min-height:48px;
      border:1px solid color-mix(in oklab,var(--btn),black 14%);
      border-bottom-width:3px;
      background:linear-gradient(165deg,color-mix(in oklab,var(--btn),white 10%),var(--btn));
      color:#fff;font-weight:700;font-size:.93rem;letter-spacing:.01em;
      text-shadow:0 1px 0 rgba(0,0,0,.28),0 2px 10px rgba(0,0,0,.22);
      box-shadow:0 4px 0 color-mix(in oklab,var(--btn),black 22%), 0 8px 20px color-mix(in oklab,var(--btn),transparent 70%);
      cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,filter .12s ease,border-bottom-width .12s ease;text-align:center;
      touch-action:manipulation;
    }
    .chipPrimary:hover{transform:translateY(-1px)}
    .chipPrimary:active{transform:translateY(2px);border-bottom-width:1px;box-shadow:0 2px 10px color-mix(in oklab,var(--btn),transparent 75%)}
    .chipPrimary:disabled{opacity:.55;cursor:not-allowed;transform:none;border-bottom-width:3px}

    .chip{
      --btn:var(--surface-2);
      appearance:none;
      font-family:var(--font-app);
      padding:14px 16px 14px 14px;border-radius:var(--radius-btn-soft);
      min-height:48px;
      border:1px solid var(--border);
      border-left:4px solid color-mix(in oklab,var(--accent),transparent 45%);
      background:linear-gradient(180deg,#fff,var(--surface-2));
      color:var(--ink-soft);font-weight:700;font-size:.91rem;
      box-shadow:0 2px 0 rgba(15,20,25,.06), 0 4px 12px rgba(15,20,25,.05);
      cursor:pointer;text-align:center;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease;
      touch-action:manipulation;
    }
    .chip:hover{transform:translateY(-2px);border-left-color:var(--accent);box-shadow:0 3px 0 rgba(15,20,25,.06), 0 8px 18px rgba(15,20,25,.07)}
    .chip:active{transform:translateY(0)}

    /* Hlavní menu: čtverce 2×2, jednotná tealková paleta */
    .menuGrid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:11px;
      width:100%;
    }
    .menuGrid .chipPrimary,
    .menuGrid .chip{
      width:100%;
      margin:0;
      aspect-ratio:1;
      min-height:0;
      min-width:0;
      padding:10px 8px;
      border-radius:var(--tile-radius);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:6px;
      font-size:clamp(0.88rem, 3.9vw, 1.06rem);
      line-height:1.2;
      letter-spacing:.01em;
      font-weight:800;
      text-align:center;
      hyphens:auto;
      -webkit-hyphens:auto;
      overflow:hidden;
      border-bottom-width:1px;
      border-left-width:1px;
      box-shadow:0 2px 10px rgba(15,20,25,.07);
    }
    .menuGrid .chipPrimary{
      color:#fff;
      border:1px solid color-mix(in oklab,var(--btn),black 18%);
      background:linear-gradient(155deg,color-mix(in oklab,var(--btn),white 18%) 0%,var(--btn) 42%,color-mix(in oklab,var(--btn),black 10%) 100%);
      text-shadow:0 1px 0 rgba(0,0,0,.32),0 2px 6px rgba(0,0,0,.25),0 0 1px rgba(0,0,0,.4);
      box-shadow:
        0 1px 0 rgba(255,255,255,.28) inset,
        0 2px 0 rgba(255,255,255,.08) inset,
        0 8px 22px color-mix(in oklab,var(--btn),transparent 52%),
        0 4px 14px rgba(15,20,25,.12);
    }
    .menuGrid .chipPrimary:hover{transform:translateY(-2px);box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 10px 24px color-mix(in oklab,var(--btn),transparent 50%)}
    .menuGrid .chipPrimary:active{transform:translateY(0);filter:brightness(.97)}
    .menuGrid .chipPrimary:disabled{transform:none;filter:none;opacity:.5}
    .menuTileWrap{
      position:relative;
      width:100%;
      min-width:0;
      aspect-ratio:1;
    }
    .menuTileWrap .chipPrimary{
      width:100%;
      height:100%;
      box-sizing:border-box;
      padding:10px 32px 10px 8px;
    }
    .tileShareBtn{
      position:absolute;top:7px;right:7px;z-index:4;
      width:32px;height:32px;border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      font-size:.95rem;line-height:1;padding:0;
      border:1px solid color-mix(in oklab,white,black 12%);
      background:rgba(255,255,255,.9);
      color:var(--accent-2);
      cursor:pointer;
      box-shadow:0 2px 10px rgba(15,20,25,.2);
      touch-action:manipulation;
      font-family:var(--font-app);
    }
    .tileShareBtn:active{transform:scale(.93)}
    @media (prefers-color-scheme: dark){
      .tileShareBtn{
        background:rgba(28,36,44,.94);
        color:var(--teal-muted);
        border-color:var(--border);
      }
    }
    .backBtn{
      appearance:none;
      font-family:var(--font-app);
      padding:12px 16px;min-height:46px;border-radius:12px;
      font-weight:700;font-size:.82rem;
      cursor:pointer;
      transition:transform .12s ease,box-shadow .12s ease,filter .12s ease,border-color .12s ease;
      touch-action:manipulation;
    }
    .backBtn--teal{
      border:1px solid color-mix(in oklab,var(--accent),transparent 58%);
      background:linear-gradient(180deg,#f6fdfb,#e8f7f4);
      color:var(--accent-2);
      box-shadow:0 2px 8px rgba(13,148,136,.1);
    }
    .backBtn--teal:hover{
      border-color:color-mix(in oklab,var(--accent),transparent 35%);
      box-shadow:0 4px 12px rgba(13,148,136,.14);
    }
    .backBtn--teal:active{transform:scale(.98)}
    .backBtn--danger{
      border:1px solid color-mix(in oklab,var(--danger),black 12%);
      background:linear-gradient(165deg,#f87171,#dc2626);
      color:#fff;
      box-shadow:0 3px 12px rgba(220,38,38,.35);
    }
    .backBtn--danger:hover{filter:brightness(1.05)}
    .backBtn--danger:active{transform:scale(.98)}
    .backBtn--language{
      display:inline-flex;align-items:center;justify-content:center;
      flex:1 1 190px;
      max-width:100%;
      min-height:52px;
      padding:14px 20px;
      border:1px solid color-mix(in oklab,#d97706,black 18%);
      background:linear-gradient(165deg,#fde68a 0%,#fbbf24 45%,#f59e0b 100%);
      color:#241400;
      font-weight:800;
      font-size:.88rem;
      line-height:1.15;
      text-align:center;
      white-space:normal;
      box-shadow:
        0 1px 0 rgba(255,255,255,.48) inset,
        0 3px 0 color-mix(in oklab,#b45309,black 14%),
        0 10px 22px rgba(217,119,6,.28);
    }
    .backBtn--language:hover,.backBtn--language:focus-visible{
      outline:none;
      border-color:color-mix(in oklab,#b45309,black 12%);
      filter:brightness(1.02);
      box-shadow:
        0 1px 0 rgba(255,255,255,.55) inset,
        0 3px 0 color-mix(in oklab,#92400e,black 10%),
        0 12px 26px rgba(217,119,6,.34),
        0 0 0 3px rgba(251,191,36,.22);
    }
    .backBtn--language:active{transform:translateY(2px);box-shadow:0 1px 0 color-mix(in oklab,#92400e,black 10%),0 6px 16px rgba(217,119,6,.24)}

    .typingBubble{min-height:48px;display:flex;align-items:center}
    .typingDots{display:inline-flex;gap:7px;align-items:center;padding:2px 4px}
    .typingDots span{
      width:8px;height:8px;border-radius:50%;
      background:var(--accent);
      opacity:.4;
      animation:typingBounce 1.15s ease-in-out infinite;
    }
    .typingDots span:nth-child(2){animation-delay:.18s}
    .typingDots span:nth-child(3){animation-delay:.36s}
    @keyframes typingBounce{
      0%,80%,100%{transform:translateY(0);opacity:.4}
      40%{transform:translateY(-6px);opacity:1}
    }

    .tips{color:var(--muted);font-size:13px;line-height:1.4;margin-top:6px}

    .searchPanel{
      flex:0 0 auto;
      border-radius:var(--radius-lg);padding:14px 16px;
      background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);
      scroll-margin-top:14px;
    }
    .searchPanel label.searchLabel{
      display:block;font-weight:800;font-size:.95rem;letter-spacing:-.01em;margin-bottom:8px;color:var(--ink);
    }
    .searchWrap{position:relative}
    .searchInputRow{
      display:flex;align-items:center;gap:8px;
      padding:5px 8px 5px 12px;border-radius:12px;
      border:1px solid color-mix(in oklab,var(--border),var(--accent) 18%);
      background:linear-gradient(180deg,#edf5f2 0%,#f8fbfa 100%);
      box-shadow:inset 0 2px 5px rgba(15,23,42,.12),inset 0 -1px 0 rgba(255,255,255,.88);
      transition:border-color .2s ease, box-shadow .2s ease, background .2s ease;
    }
    .searchWrap:focus-within .searchInputRow{
      border-color:color-mix(in oklab,var(--accent),black 8%);
      box-shadow:0 0 0 4px color-mix(in oklab,var(--accent),transparent 78%),inset 0 1px 3px rgba(15,23,42,.1);
      background:#fff;
    }
    .searchIcon{opacity:.62;font-size:1.08rem;flex-shrink:0;color:var(--accent-2)}
    .searchInput{
      flex:1;min-width:0;border:none;background:transparent;
      font:inherit;font-size:.96rem;padding:11px 4px 11px 0;outline:none;color:var(--ink);
    }
    .searchInput::placeholder{color:#4b5563;opacity:.92}
    @media (max-width:420px){.searchInput{font-size:.92rem}}
    .searchResults{
      position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:1200;
      max-height:min(52vh,360px);overflow:auto;margin:0;padding:6px;list-style:none;
      background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);
      box-shadow:var(--shadow-lg);
    }
    .searchResults li{margin:0}
    .searchHit{
      width:100%;text-align:left;padding:12px 14px;border:none;border-radius:10px;
      background:transparent;font:inherit;cursor:pointer;
      display:flex;flex-direction:column;align-items:flex-start;gap:4px;
      transition:background .12s ease;
    }
    .searchHit:hover,.searchHit:focus-visible{background:var(--surface-2);outline:none}
    .searchHitTitle{font-weight:700;color:var(--ink);font-size:.95rem}
    .searchHitTrail{font-size:12px;color:var(--muted);line-height:1.3}
    .searchHitScore{font-size:11px;color:var(--muted);opacity:.7}
    .searchEmpty{padding:12px 14px;color:var(--muted);font-size:14px}

    .shortcuts{
      flex:0 1 auto;
      min-height:0;
      border:none;
      border-radius:0;
      padding:4px 0 8px;
      background:transparent;
      box-shadow:none;
      scroll-margin-top:14px;
    }
    .shortcutsHeader{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;padding:0 2px}
    .shortcutsHeader strong{font-size:1.02rem;letter-spacing:-.02em;font-weight:800}

    .btnRow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

    .whatsappDock{
      position:fixed;
      left:0;right:0;bottom:0;
      z-index:1050;
      padding:10px max(14px, env(safe-area-inset-left,0px)) max(10px, env(safe-area-inset-bottom,0px)) max(14px, env(safe-area-inset-right,0px));
      pointer-events:none;
      background:linear-gradient(180deg,transparent,rgba(248,250,249,.92) 35%);
    }
    .whatsappDockBtn{
      pointer-events:auto;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      width:100%;
      max-width:920px;
      margin:0 auto;
      padding:14px 18px;
      border-radius:14px;
      border:1px solid color-mix(in oklab,#128C7E,black 8%);
      background:linear-gradient(165deg,#25D366,#128C7E);
      color:#fff;
      font-family:var(--font-app);
      font-weight:800;
      font-size:.95rem;
      letter-spacing:.02em;
      text-shadow:0 1px 0 rgba(0,0,0,.22),0 2px 10px rgba(0,0,0,.18);
      text-decoration:none;
      box-shadow:0 6px 22px rgba(18,140,126,.4);
      transition:transform .12s ease,filter .12s ease,box-shadow .12s ease;
    }
    .whatsappDockBtn:active{transform:scale(.99);filter:brightness(.96)}
    .whatsappDockBtn .waIco{font-size:1.35rem;line-height:1}

    .langMenuGrid{margin-top:0}
    .langMenuGrid .langBtnWide{
      grid-column:1 / -1;
      aspect-ratio:auto;
      min-height:108px;
      padding:20px 16px;
    }

    .langChooserCard{
      display:block;
      width:100%;
      max-width:100%;
      box-sizing:border-box;
    }

    .overlay{position:fixed;inset:0;background:rgba(15,20,25,.4);backdrop-filter:blur(4px);
      display:flex;align-items:flex-end;justify-content:center;
      padding:18px;padding-bottom:max(18px, env(safe-area-inset-bottom, 0px));z-index:2000}
    .sheet{
      width:100%;max-width:560px;border-radius:var(--radius-lg) var(--radius-lg) 12px 12px;
      background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-lg);padding:20px;
    }
    .sheet h4{margin:0 0 12px 0;font-size:1.1rem}

    .pillRow{display:flex;gap:8px;flex-wrap:wrap}
    .pill{
      font-family:var(--font-app);
      padding:11px 14px;min-height:44px;border-radius:12px;border:1px solid var(--border);
      background:var(--surface);color:var(--accent);cursor:pointer;font-weight:700;font-size:.88rem;
      transition:background .15s ease,border-color .15s ease;
    }
    .pill:hover{border-color:rgba(13,148,136,.4)}
    .pill.active{
      border-color:color-mix(in oklab,var(--accent),black 10%);
      background:linear-gradient(165deg,var(--accent),var(--accent-2));color:#fff;
      text-shadow:0 1px 0 rgba(0,0,0,.25),0 1px 6px rgba(0,0,0,.2);
    }

    .fabStack{
      position:fixed;left:50%;transform:translateX(-50%);
      bottom:calc(var(--whatsapp-dock) + 14px + env(safe-area-inset-bottom,0px));z-index:1150;
      display:flex;flex-direction:column;gap:10px;
      padding:0 max(12px, env(safe-area-inset-left,0px)) 0 max(12px, env(safe-area-inset-right,0px));
      width:min(calc(100vw - 24px), 400px);
    }
    .fabAction{
      appearance:none;border:none;border-radius:var(--radius-btn);padding:15px 22px;min-height:52px;
      font-family:var(--font-app);font-weight:700;font-size:.95rem;
      text-shadow:0 1px 0 rgba(0,0,0,.28),0 2px 10px rgba(0,0,0,.2);
      background:linear-gradient(165deg,var(--accent),var(--accent-2));
      color:#fff;
      box-shadow:0 4px 0 color-mix(in oklab,var(--accent-2),black 15%), 0 14px 32px rgba(13,148,136,.32);
      cursor:pointer;width:100%;text-align:center;touch-action:manipulation;
    }
    .fabAction:active{transform:translateY(2px);box-shadow:0 1px 0 color-mix(in oklab,var(--accent-2),black 15%), 0 6px 20px rgba(13,148,136,.25)}

    .fab{
      position:fixed;right:max(14px, env(safe-area-inset-right,0px));
      bottom:calc(var(--whatsapp-dock) + 100px + env(safe-area-inset-bottom, 0px));z-index:1140;
      appearance:none;border:none;border-radius:var(--radius-btn);
      font-family:var(--font-app);
      text-shadow:0 1px 0 rgba(0,0,0,.3),0 2px 8px rgba(0,0,0,.22);
      padding:13px 18px;min-height:48px;font-weight:700;font-size:.88rem;cursor:pointer;color:#fff;
      box-shadow:0 4px 0 color-mix(in oklab,var(--danger),black 18%), 0 12px 28px rgba(220,38,38,.32);
      background:linear-gradient(165deg,#ef4444,#dc2626);
      border:1px solid color-mix(in oklab,var(--danger),black 8%);
      touch-action:manipulation;
    }
    .fab:active{transform:translateY(2px)}

    @media (max-width:640px){
      .row{
        max-width:none;
        margin:0;
        padding-left:max(12px, env(safe-area-inset-left,0px));
        padding-right:max(12px, env(safe-area-inset-right,0px));
        padding-bottom:calc(24px + var(--whatsapp-dock) + env(safe-area-inset-bottom,0px));
      }
      .row:not(.rowLangOnly){
        padding-bottom:calc(104px + var(--whatsapp-dock) + env(safe-area-inset-bottom,0px));
      }
      .scroller,.searchPanel{
        border-radius:14px;
      }
      .shortcutsHeader .btnRow{width:100%}
      .shortcutsHeader .backBtn--language{
        flex:1 0 100%;
        width:100%;
        box-sizing:border-box;
      }
    }
    @media (max-width:480px){
      .row:not(.rowLangOnly){padding-bottom:calc(112px + var(--whatsapp-dock) + env(safe-area-inset-bottom,0px))}
      .brandMvp{gap:12px}
      .brandLogo{width:52px;height:52px;border-radius:15px}
      .appHeader{padding-top:calc(8px + env(safe-area-inset-top,0px));padding-bottom:10px}
      .headerInstallBtn,.headerShareBtn{flex:1 1 130px}
    }
    @media (prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  cs:"Čeština", en:"English", es:"Español", de:"Deutsch", fr:"Français",
  uk:"Українська", nl:"Nederlands", it:"Italiano", da:"Dansk", pl:"Polski",
  ru:"Русский",
};

const WHATSAPP_E164 = "420733439733";

/** Text tlačítka a předvyplněná zpráva pro wa.me (jazyk UI) */
const whatsappI18n = {
  cs: {
    btn: "Napsat Davidovi na WhatsApp",
    prefill: "Dobrý den, jsem host Chill Apartments a potřebuji pomoc s: ",
  },
  en: {
    btn: "Message David on WhatsApp",
    prefill: "Hi, I'm a guest at Chill Apartments and I need help with: ",
  },
  es: {
    btn: "Escribir a David por WhatsApp",
    prefill: "Hola, soy huésped en Chill Apartments y necesito ayuda con: ",
  },
  de: {
    btn: "David per WhatsApp schreiben",
    prefill: "Hallo, ich bin Gast in den Chill Apartments und brauche Hilfe bei: ",
  },
  fr: {
    btn: "Écrire à David sur WhatsApp",
    prefill: "Bonjour, je suis client aux Chill Apartments et j’ai besoin d’aide pour : ",
  },
  ru: {
    btn: "Написать Давиду в WhatsApp",
    prefill: "Здравствуйте, я гость Chill Apartments, нужна помощь с: ",
  },
  uk: {
    btn: "Написати Давиду в WhatsApp",
    prefill: "Добрий день, я гість Chill Apartments, потрібна допомога з: ",
  },
  nl: {
    btn: "David een WhatsApp sturen",
    prefill: "Hallo, ik ben gast in Chill Apartments en ik heb hulp nodig bij: ",
  },
  it: {
    btn: "Scrivere a David su WhatsApp",
    prefill: "Ciao, sono ospite ai Chill Apartments e ho bisogno di aiuto con: ",
  },
  da: {
    btn: "Skriv til David på WhatsApp",
    prefill: "Hej, jeg er gæst på Chill Apartments og har brug for hjælp til: ",
  },
  pl: {
    btn: "Napisz do Davida na WhatsApp",
    prefill: "Dzień dobry, jestem gościem Chill Apartments i potrzebuję pomocy w: ",
  },
};

/** Hlavička: rezervace + instalace PWA (mimo obrazovky jazyka) */
const TOP_BAR_I18N = {
  cs: {
    bookApart: "Rezervovat další pobyt",
    installApp: "Instalovat aplikaci",
    addToHome: "Přidat na plochu",
    installHelpTitle: "Aplikace na mobilu",
    installHelpIos:
      "Na iPhonu nebo iPadu klepněte na tlačítko Sdílet (↑) a zvolte „Přidat na plochu“.",
    installHelpAndroid:
      "V Chrome nebo Edge otevřete menu (⋮) a zvolte „Nainstalovat aplikaci“ nebo „Přidat na plochu“.",
    installHelpDesktop:
      "Na počítači hledejte v adresním řádku ikonu instalace nebo položku „Nainstalovat aplikaci“ v menu prohlížeče.",
    close: "Zavřít",
  },
  en: {
    bookApart: "Book your next stay",
    installApp: "Install app",
    addToHome: "Add to Home Screen",
    installHelpTitle: "App on your phone",
    installHelpIos:
      'On iPhone or iPad, tap Share (↑) and choose "Add to Home Screen".',
    installHelpAndroid:
      'In Chrome or Edge, open the menu (⋮) and choose "Install app" or "Add to Home screen".',
    installHelpDesktop:
      'On desktop, look for the install icon in the address bar or "Install app" in the browser menu.',
    close: "Close",
  },
  es: { bookApart: "Reservar próxima estancia" },
  de: { bookApart: "Nächsten Aufenthalt buchen" },
  fr: { bookApart: "Réserver le prochain séjour" },
  uk: { bookApart: "Забронювати наступний візит" },
  nl: { bookApart: "Boek uw volgende verblijf" },
  it: { bookApart: "Prenota il prossimo soggiorno" },
  da: { bookApart: "Book dit næste ophold" },
  pl: { bookApart: "Zarezerwuj kolejny pobyt" },
  ru: { bookApart: "Забронировать следующий визит" },
};

function topBarCopy(code) {
  return { ...TOP_BAR_I18N.en, ...(TOP_BAR_I18N[code] ?? {}) };
}

const tr = {
  cs:{ chooseLang:"🌍 Změnit jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       instructionsLabel:"📄 Instrukce k ubytování",
       catFood:"🍽️ Jídlo a okolí", catTech:"🔧 Technické potíže", catOther:"📋 Ostatní", catTransport:"🚌 Doprava", catAmenities:"🏨 Vybavení hotelu",
       tourLabel:"🧭 3D prohlídka hotelu", tourOpenMsg:"[Otevřít 3D prohlídku]("+MATTERPORT_URL+")",
       stillAsk:"Vyberte jednu z možností níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       hide:"Skrýt",
       foodDelivery:"🛵 Jídlo domů", transportInfo:"🗺️ Doprava po Praze",
       diningLabel:"🍽️ Snídaně / Restaurace", bakeryLabel:"🥖 Pekárny",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Kavárny", barLabel:"🍸 Bary",
       groceryLabel:"🛒 Obchody", pharmacyLabel:"💊 Lékárny",
       moneyGroupLabel:"💱 Směnárny / ATM", exchangeLabel:"💱 Směnárny", atmLabel:"🏧 ATM",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elektřina", hotWaterLabel:"💧 Teplá voda",
       acLabel:"❄️ Klimatizace (AC)", inductionLabel:"🍳 Indukční deska", hoodLabel:"🌀 Digestoř",
       coffeeLabel:"☕ Kávovar Tchibo", fireAlarmLabel:"🔥 Požární hlásič",
       elevatorPhoneLabel:"🛗 Výtah – servis", safeLabel:"🔐 Trezor",
       spareKeyLabel:"🔑 Náhradní klíč",
       laundryLabel:"🧺 Prádelna", accessLabel:"♿️ Bezbariérovost", smokingLabel:"🚭 Kouření",
       luggageLabel:"🎒 Úschovna zavazadel", doorbellsLabel:"🔔 Zvonky",
       trashLabel:"🗑️ Odpadky / Popelnice",
       doctorLabel:"👩‍⚕️ Lékař 24/7", linenLabel:"🧻 Povlečení / Ručníky",
       pickRoom:"Zvolte číslo apartmánu", floor:"Patro", room:"Pokoj", confirm:"Zobrazit", cancel:"Zavřít",
       wifiStatus:"Funguje Wi-Fi?", ok:"Funguje", notOk:"Nefunguje",
       pickSsid:"Vyberte SSID", showMyWifi:"Zobrazit moje heslo",
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchyň", aBathroom:"🛁 Koupelna", aService:"🧰 Prádelna, úschovna, odpadky" },

  en:{ chooseLang:"🌍 Choose language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       instructionsLabel:"📄 Check-in instructions",
       catFood:"🍽️ Food & Nearby", catTech:"🔧 Technical issues", catOther:"📋 Other", catTransport:"🚌 Transport", catAmenities:"🏨 Hotel amenities",
       tourLabel:"🧭 3D virtual tour", tourOpenMsg:"[Open the 3D tour]("+MATTERPORT_URL+")",
       stillAsk:"Pick one of the options below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       hide:"Hide",
       foodDelivery:"🛵 Food delivery", transportInfo:"🗺️ Getting around Prague",
       diningLabel:"🍽️ Breakfast / Restaurants", bakeryLabel:"🥖 Bakeries",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Groceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Exchanges / ATMs", exchangeLabel:"💱 Exchanges", atmLabel:"🏧 ATMs",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Power", hotWaterLabel:"💧 Hot water",
       acLabel:"❄️ Air conditioning (AC)", inductionLabel:"🍳 Induction hob", hoodLabel:"🌀 Cooker hood",
       coffeeLabel:"☕ Tchibo coffee machine", fireAlarmLabel:"🔥 Fire alarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Spare key",
       laundryLabel:"🧺 Laundry", accessLabel:"♿️ Accessibility", smokingLabel:"🚭 Smoking",
       luggageLabel:"🎒 Luggage room", doorbellsLabel:"🔔 Doorbells",
       trashLabel:"🗑️ Trash / bins",
       doctorLabel:"👩‍⚕️ Doctor 24/7", linenLabel:"🧻 Linen / towels",
       pickRoom:"Choose your apartment number", floor:"Floor", room:"Room", confirm:"Show", cancel:"Close",
       wifiStatus:"Is the Wi-Fi working?", ok:"Works", notOk:"Doesn’t work",
       pickSsid:"Pick the SSID", showMyWifi:"Show my password",
       aRooms:"🛏️ Rooms", aKitchen:"🍳 Kitchen", aBathroom:"🛁 Bathroom", aService:"🧰 Laundry, luggage, trash" },

  // Další jazyky – UI bere přesně zvolený jazyk:
  es:{ chooseLang:"🌍 Elegir idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       instructionsLabel:"📄 Instrucciones de check-in",
       catFood:"🍽️ Comida y alrededores", catTech:"🔧 Problemas técnicos", catOther:"📋 Otros", catTransport:"🚌 Transporte", catAmenities:"🏨 Servicios del hotel",
       tourLabel:"🧭 Tour virtual 3D", tourOpenMsg:"[Abrir el tour 3D]("+MATTERPORT_URL+")",
       stillAsk:"Elige una de las opciones abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       hide:"Ocultar",
       foodDelivery:"🛵 Delivery de comida", transportInfo:"🗺️ Moverse por Praga",
       diningLabel:"🍽️ Desayuno / Restaurantes", bakeryLabel:"🥖 Panaderías",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bares",
       groceryLabel:"🛒 Supermercados", pharmacyLabel:"💊 Farmacias",
       moneyGroupLabel:"💱 Casas de cambio / Cajeros", exchangeLabel:"💱 Casas de cambio", atmLabel:"🏧 Cajeros automáticos",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Electricidad", hotWaterLabel:"💧 Agua caliente",
       acLabel:"❄️ Aire acondicionado (AC)", inductionLabel:"🍳 Placa de inducción", hoodLabel:"🌀 Campana extractora",
       coffeeLabel:"☕ Cafetera Tchibo", fireAlarmLabel:"🔥 Detector de humo",
       elevatorPhoneLabel:"🛗 Ascensor – servicio", safeLabel:"🔐 Caja fuerte",
       spareKeyLabel:"🔑 Llave de repuesto",
       laundryLabel:"🧺 Lavandería", accessLabel:"♿️ Accesibilidad", smokingLabel:"🚭 Fumar",
       luggageLabel:"🎒 Consigna de equipaje", doorbellsLabel:"🔔 Timbres",
       trashLabel:"🗑️ Basura / contenedores",
       doctorLabel:"👩‍⚕️ Médico 24/7", linenLabel:"🧻 Ropa de cama / Toallas",
       pickRoom:"Elige el número de apartamento", floor:"Planta", room:"Habitación", confirm:"Mostrar", cancel:"Cerrar",
       wifiStatus:"¿Funciona el Wi-Fi?", ok:"Funciona", notOk:"No funciona",
       pickSsid:"Elige el SSID", showMyWifi:"Mostrar mi contraseña",
       aRooms:"🛏️ Habitaciones", aKitchen:"🍳 Cocina", aBathroom:"🛁 Baño", aService:"🧰 Lavandería, consigna, basura" },

  de:{ chooseLang:"🌍 Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       instructionsLabel:"📄 Check-in-Anleitung",
       catFood:"🍽️ Essen & Umgebung", catTech:"🔧 Technische Probleme", catOther:"📋 Sonstiges", catTransport:"🚌 Transport", catAmenities:"🏨 Hotelausstattung",
       tourLabel:"🧭 3D-Rundgang", tourOpenMsg:"[3D-Rundgang öffnen]("+MATTERPORT_URL+")",
       stillAsk:"Wähle eine Option unten.",
       contact:"Falls Sie nicht finden, was Sie brauchen, schreiben Sie David (WhatsApp +420 733 439 733).",
       hide:"Ausblenden",
       foodDelivery:"🛵 Essen liefern lassen", transportInfo:"🗺️ Unterwegs in Prag",
       diningLabel:"🍽️ Frühstück / Restaurants", bakeryLabel:"🥖 Bäckereien",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Supermärkte", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wechselstuben / Geldautomaten", exchangeLabel:"💱 Wechselstuben", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Strom", hotWaterLabel:"💧 Warmwasser",
       acLabel:"❄️ Klimaanlage (AC)", inductionLabel:"🍳 Induktionskochfeld", hoodLabel:"🌀 Dunstabzug",
       coffeeLabel:"☕ Tchibo-Kaffeemaschine", fireAlarmLabel:"🔥 Rauchmelder",
       elevatorPhoneLabel:"🛗 Aufzug – Service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Ersatzschlüssel",
       laundryLabel:"🧺 Wäscherei", accessLabel:"♿️ Barrierefreiheit", smokingLabel:"🚭 Rauchen",
       luggageLabel:"🎒 Gepäckaufbewahrung", doorbellsLabel:"🔔 Klingeln",
       trashLabel:"🗑️ Müll / Tonnen",
       doctorLabel:"👩‍⚕️ Arzt 24/7", linenLabel:"🧻 Bettwäsche / Handtücher",
       pickRoom:"Apartmentnummer auswählen", floor:"Stockwerk", room:"Zimmer", confirm:"Anzeigen", cancel:"Schließen",
       wifiStatus:"Funktioniert das Wi-Fi?", ok:"Funktioniert", notOk:"Funktioniert nicht",
       pickSsid:"SSID auswählen", showMyWifi:"Mein Passwort anzeigen",
       aRooms:"🛏️ Zimmer", aKitchen:"🍳 Küche", aBathroom:"🛁 Badezimmer", aService:"🧰 Wäscherei, Gepäck, Müll" },

  fr:{ chooseLang:"🌍 Choisir la langue", mainTitle:"Choisissez un sujet", subTitle:"Sous-sujet", back:"← Retour",
       instructionsLabel:"📄 Instructions de check-in",
       catFood:"🍽️ Nourriture & alentours", catTech:"🔧 Problèmes techniques", catOther:"📋 Autres", catTransport:"🚌 Transport", catAmenities:"🏨 Services de l’hôtel",
       tourLabel:"🧭 Visite virtuelle 3D", tourOpenMsg:"[Ouvrir la visite 3D]("+MATTERPORT_URL+")",
       stillAsk:"Choisissez une option ci-dessous.",
       contact:"Si vous ne trouvez pas ce qu’il vous faut, contactez David (WhatsApp +420 733 439 733).",
       hide:"Masquer",
       foodDelivery:"🛵 Livraison de repas", transportInfo:"🗺️ Se déplacer à Prague",
       diningLabel:"🍽️ Petit-déjeuner / Restaurants", bakeryLabel:"🥖 Boulangeries",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Épiceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Bureaux de change / DAB", exchangeLabel:"💱 Bureaux de change", atmLabel:"🏧 Distributeurs",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Électricité", hotWaterLabel:"💧 Eau chaude",
       acLabel:"❄️ Climatisation (AC)", inductionLabel:"🍳 Plaque à induction", hoodLabel:"🌀 Hotte",
       coffeeLabel:"☕ Machine à café Tchibo", fireAlarmLabel:"🔥 Détecteur de fumée",
       elevatorPhoneLabel:"🛗 Ascenseur – service", safeLabel:"🔐 Coffre-fort",
       spareKeyLabel:"🔑 Clé de secours",
       laundryLabel:"🧺 Laverie", accessLabel:"♿️ Accessibilité", smokingLabel:"🚭 Fumer",
       luggageLabel:"🎒 Consigne à bagages", doorbellsLabel:"🔔 Sonnette",
       trashLabel:"🗑️ Poubelles / déchets",
       doctorLabel:"👩‍⚕️ Médecin 24/7", linenLabel:"🧻 Linge / Serviettes",
       pickRoom:"Choisissez votre numéro d’appartement", floor:"Étage", room:"Pièce", confirm:"Afficher", cancel:"Fermer",
       wifiStatus:"Le Wi-Fi fonctionne ?", ok:"Fonctionne", notOk:"Ne fonctionne pas",
       pickSsid:"Choisir le SSID", showMyWifi:"Afficher mon mot de passe",
       aRooms:"🛏️ Chambres", aKitchen:"🍳 Cuisine", aBathroom:"🛁 Salle de bain", aService:"🧰 Laverie, bagages, déchets" },

  ru:{ chooseLang:"🌍 Выбрать язык", mainTitle:"Выберите тему", subTitle:"Подтема", back:"← Назад",
       instructionsLabel:"📄 Инструкции по заселению",
       catFood:"🍽️ Еда и поблизости", catTech:"🔧 Технические вопросы", catOther:"📋 Другое", catTransport:"🚌 Транспорт", catAmenities:"🏨 Удобства отеля",
       tourLabel:"🧭 3D-тур по отелю", tourOpenMsg:"[Открыть 3D-тур]("+MATTERPORT_URL+")",
       stillAsk:"Выберите один из вариантов ниже.",
       contact:"Если вы не нашли нужную информацию, напишите Давиду (WhatsApp +420 733 439 733).",
       hide:"Скрыть",
       foodDelivery:"🛵 Доставка еды", transportInfo:"🗺️ Как передвигаться по Праге",
       diningLabel:"🍽️ Завтрак / Рестораны", bakeryLabel:"🥖 Пекарни",
       cafeBarGroupLabel:"☕/🍸 Кафе / Бар", cafeLabel:"☕ Кафе", barLabel:"🍸 Бары",
       groceryLabel:"🛒 Супермаркеты", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмен / Банкоматы", exchangeLabel:"💱 Обменные пункты", atmLabel:"🏧 Банкоматы",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Электричество", hotWaterLabel:"💧 Горячая вода",
       acLabel:"❄️ Кондиционер (AC)", inductionLabel:"🍳 Индукционная плита", hoodLabel:"🌀 Вытяжка",
       coffeeLabel:"☕ Кофемашина Tchibo", fireAlarmLabel:"🔥 Пожарный датчик",
       elevatorPhoneLabel:"🛗 Лифт – сервис", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасной ключ",
       laundryLabel:"🧺 Прачечная", accessLabel:"♿️ Безбарьерность", smokingLabel:"🚭 Курение",
       luggageLabel:"🎒 Камера хранения", doorbellsLabel:"🔔 Домофоны",
       trashLabel:"🗑️ Мусор / контейнеры",
       doctorLabel:"👩‍⚕️ Врач 24/7", linenLabel:"🧻 Постель / Полотенца",
       pickRoom:"Выберите номер апартамента", floor:"Этаж", room:"Комната", confirm:"Показать", cancel:"Закрыть",
       wifiStatus:"Работает ли Wi-Fi?", ok:"Работает", notOk:"Не работает",
       pickSsid:"Выберите SSID", showMyWifi:"Показать мой пароль",
       aRooms:"🛏️ Комнаты", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванная", aService:"🧰 Прачечная, багаж, мусор" },

  uk:{ chooseLang:"🌍 Обрати мову", mainTitle:"Оберіть тему", subTitle:"Підтема", back:"← Назад",
       instructionsLabel:"📄 Інструкції поселення",
       catFood:"🍽️ Їжа та поруч", catTech:"🔧 Технічні питання", catOther:"📋 Інше", catTransport:"🚌 Транспорт", catAmenities:"🏨 Зручності готелю",
       tourLabel:"🧭 3D-тур готелем", tourOpenMsg:"[Відкрити 3D-тур]("+MATTERPORT_URL+")",
       stillAsk:"Виберіть один із варіантів нижче.",
       contact:"Якщо не знайшли потрібну інформацію, напишіть Давиду (WhatsApp +420 733 439 733).",
       hide:"Приховати",
       foodDelivery:"🛵 Доставка їжі", transportInfo:"🗺️ Пересування Прагою",
       diningLabel:"🍽️ Сніданок / Ресторани", bakeryLabel:"🥖 Пекарні",
       cafeBarGroupLabel:"☕/🍸 Кав’ярня / Бар", cafeLabel:"☕ Кав’ярні", barLabel:"🍸 Бари",
       groceryLabel:"🛒 Супермаркети", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмін / Банкомати", exchangeLabel:"💱 Обмін валют", atmLabel:"🏧 Банкомати",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Електрика", hotWaterLabel:"💧 Гаряча вода",
       acLabel:"❄️ Кондиціонер (AC)", inductionLabel:"🍳 Індукційна плита", hoodLabel:"🌀 Витяжка",
       coffeeLabel:"☕ Кавоварка Tchibo", fireAlarmLabel:"🔥 Пожежний датчик",
       elevatorPhoneLabel:"🛗 Ліфт – сервіс", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасний ключ",
       laundryLabel:"🧺 Пральня", accessLabel:"♿️ Безбар’єрність", smokingLabel:"🚭 Паління",
       luggageLabel:"🎒 Камера зберігання", doorbellsLabel:"🔔 Дзвінки",
       trashLabel:"🗑️ Сміття / контейнери",
       doctorLabel:"👩‍⚕️ Лікар 24/7", linenLabel:"🧻 Постіль / Рушники",
       pickRoom:"Оберіть номер апартаменту", floor:"Поверх", room:"Кімната", confirm:"Показати", cancel:"Закрити",
       wifiStatus:"Працює Wi-Fi?", ok:"Працює", notOk:"Не працює",
       pickSsid:"Оберіть SSID", showMyWifi:"Показати мій пароль",
       aRooms:"🛏️ Кімнати", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванна", aService:"🧰 Пральня, багаж, сміття" },

  nl:{ chooseLang:"🌍 Taal kiezen", mainTitle:"Kies een onderwerp", subTitle:"Subonderwerp", back:"← Terug",
       instructionsLabel:"📄 Check-in instructies",
       catFood:"🍽️ Eten & in de buurt", catTech:"🔧 Technische problemen", catOther:"📋 Overig", catTransport:"🚌 Vervoer", catAmenities:"🏨 Hotelfaciliteiten",
       tourLabel:"🧭 3D-tour", tourOpenMsg:"[3D-tour openen]("+MATTERPORT_URL+")",
       stillAsk:"Kies een optie hieronder.",
       contact:"Kun je niet vinden wat je zoekt? Stuur David een bericht (WhatsApp +420 733 439 733).",
       hide:"Verbergen",
       foodDelivery:"🛵 Maaltijdbezorging", transportInfo:"🗺️ Reizen door Praag",
       diningLabel:"🍽️ Ontbijt / Restaurants", bakeryLabel:"🥖 Bakkerijen",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Supermarkten", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wisselkantoren / Geldautomaten", exchangeLabel:"💱 Wisselkantoren", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elektriciteit", hotWaterLabel:"💧 Warm water",
       acLabel:"❄️ Airconditioning (AC)", inductionLabel:"🍳 Inductiekookplaat", hoodLabel:"🌀 Afzuigkap",
       coffeeLabel:"☕ Tchibo-koffiemachine", fireAlarmLabel:"🔥 Brandmelder",
       elevatorPhoneLabel:"🛗 Lift – service", safeLabel:"🔐 Kluis",
       spareKeyLabel:"🔑 Reservésleutel",
       laundryLabel:"🧺 Wasserij", accessLabel:"♿️ Toegankelijkheid", smokingLabel:"🚭 Roken",
       luggageLabel:"🎒 Bagageopslag", doorbellsLabel:"🔔 Deurbellen",
       trashLabel:"🗑️ Afval / containers",
       doctorLabel:"👩‍⚕️ Arts 24/7", linenLabel:"🧻 Beddengoed / Handdoeken",
       pickRoom:"Kies je appartementnummer", floor:"Verdieping", room:"Kamer", confirm:"Weergeven", cancel:"Sluiten",
       wifiStatus:"Werkt de Wi-Fi?", ok:"Werkt", notOk:"Werkt niet",
       pickSsid:"Kies de SSID", showMyWifi:"Mijn wachtwoord tonen",
       aRooms:"🛏️ Kamers", aKitchen:"🍳 Keuken", aBathroom:"🛁 Badkamer", aService:"🧰 Wasserij, bagage, afval" },

  it:{ chooseLang:"🌍 Scegli lingua", mainTitle:"Scegli un argomento", subTitle:"Sottoargomento", back:"← Indietro",
       instructionsLabel:"📄 Istruzioni di check-in",
       catFood:"🍽️ Cibo e dintorni", catTech:"🔧 Problemi tecnici", catOther:"📋 Altro", catTransport:"🚌 Trasporti", catAmenities:"🏨 Servizi dell’hotel",
       tourLabel:"🧭 Tour 3D", tourOpenMsg:"[Apri il tour 3D]("+MATTERPORT_URL+")",
       stillAsk:"Scegli una delle opzioni sotto.",
       contact:"Se non trovi ciò che ti serve, scrivi a David (WhatsApp +420 733 439 733).",
       hide:"Nascondi",
       foodDelivery:"🛵 Consegna di cibo", transportInfo:"🗺️ Muoversi a Praga",
       diningLabel:"🍽️ Colazione / Ristoranti", bakeryLabel:"🥖 Panetterie",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Caffetterie", barLabel:"🍸 Bar",
       groceryLabel:"🛒 Supermercati", pharmacyLabel:"💊 Farmacie",
       moneyGroupLabel:"💱 Cambio / Bancomat", exchangeLabel:"💱 Cambiavalute", atmLabel:"🏧 Bancomat",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elettricità", hotWaterLabel:"💧 Acqua calda",
       acLabel:"❄️ Aria condizionata (AC)", inductionLabel:"🍳 Piano a induzione", hoodLabel:"🌀 Cappa aspirante",
       coffeeLabel:"☕ Macchina da caffè Tchibo", fireAlarmLabel:"🔥 Rilevatore di fumo",
       elevatorPhoneLabel:"🛗 Ascensore – assistenza", safeLabel:"🔐 Cassaforte",
       spareKeyLabel:"🔑 Chiave di riserva",
       laundryLabel:"🧺 Lavanderia", accessLabel:"♿️ Accessibilità", smokingLabel:"🚭 Fumo",
       luggageLabel:"🎒 Deposito bagagli", doorbellsLabel:"🔔 Campanelli",
       trashLabel:"🗑️ Rifiuti / bidoni",
       doctorLabel:"👩‍⚕️ Medico 24/7", linenLabel:"🧻 Lenzuola / Asciugamani",
       pickRoom:"Scegli il numero dell’appartamento", floor:"Piano", room:"Camera", confirm:"Mostra", cancel:"Chiudi",
       wifiStatus:"Il Wi-Fi funziona?", ok:"Funziona", notOk:"Non funziona",
       pickSsid:"Scegli l’SSID", showMyWifi:"Mostra la mia password",
       aRooms:"🛏️ Camere", aKitchen:"🍳 Cucina", aBathroom:"🛁 Bagno", aService:"🧰 Lavanderia, deposito, rifiuti" },

  da:{ chooseLang:"🌍 Vælg sprog", mainTitle:"Vælg et emne", subTitle:"Underemne", back:"← Tilbage",
       instructionsLabel:"📄 Check-in instruktioner",
       catFood:"🍽️ Mad og nærområde", catTech:"🔧 Tekniske problemer", catOther:"📋 Andet", catTransport:"🚌 Transport", catAmenities:"🏨 Hotelfaciliteter",
       tourLabel:"🧭 3D-rundtur", tourOpenMsg:"[Åbn 3D-rundturen]("+MATTERPORT_URL+")",
       stillAsk:"Vælg en af mulighederne herunder.",
       contact:"Hvis du ikke finder det, du har brug for, så skriv til David (WhatsApp +420 733 439 733).",
       hide:"Skjul",
       foodDelivery:"🛵 Madudbringning", transportInfo:"🗺️ Rundt i Prag",
       diningLabel:"🍽️ Morgenmad / Restauranter", bakeryLabel:"🥖 Bagerier",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Caféer", barLabel:"🍸 Barer",
       groceryLabel:"🛒 Dagligvarebutikker", pharmacyLabel:"💊 Apoteker",
       moneyGroupLabel:"💱 Veksling / Hæveautomater", exchangeLabel:"💱 Vekselkontorer", atmLabel:"🏧 Hæveautomater",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Strøm", hotWaterLabel:"💧 Varmt vand",
       acLabel:"❄️ Aircondition (AC)", inductionLabel:"🍳 Induktionskogeplade", hoodLabel:"🌀 Emhætte",
       coffeeLabel:"☕ Tchibo kaffemaskine", fireAlarmLabel:"🔥 Røgalarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Pengeskab",
       spareKeyLabel:"🔑 Ekstra nøgle",
       laundryLabel:"🧺 Vaskeri", accessLabel:"♿️ Tilgængelighed", smokingLabel:"🚭 Rygning",
       luggageLabel:"🎒 Bagageopbevaring", doorbellsLabel:"🔔 Dørklokker",
       trashLabel:"🗑️ Affald / beholdere",
       doctorLabel:"👩‍⚕️ Læge 24/7", linenLabel:"🧻 Sengetøj / Håndklæder",
       pickRoom:"Vælg dit lejlighedsnummer", floor:"Etage", room:"Værelse", confirm:"Vis", cancel:"Luk",
       wifiStatus:"Virker Wi-Fi'en?", ok:"Virker", notOk:"Virker ikke",
       pickSsid:"Vælg SSID", showMyWifi:"Vis min adgangskode",
       aRooms:"🛏️ Værelser", aKitchen:"🍳 Køkken", aBathroom:"🛁 Badeværelse", aService:"🧰 Vaskeri, bagage, affald" },

  pl:{ chooseLang:"🌍 Zmień język", mainTitle:"Wybierz temat", subTitle:"Podtemat", back:"← Wstecz",
       instructionsLabel:"📄 Instrukcje zameldowania",
       catFood:"🍽️ Jedzenie i okolica", catTech:"🔧 Problemy techniczne", catOther:"📋 Inne", catTransport:"🚌 Transport", catAmenities:"🏨 Udogodnienia hotelu",
       tourLabel:"🧭 Wirtualna wycieczka 3D", tourOpenMsg:"[Otwórz wycieczkę 3D]("+MATTERPORT_URL+")",
       stillAsk:"Wybierz jedną z opcji poniżej.",
       contact:"Jeśli nie znajdziesz potrzebnych informacji, napisz do Davida (WhatsApp +420 733 439 733).",
       hide:"Ukryj",
       foodDelivery:"🛵 Dostawa jedzenia", transportInfo:"🗺️ Poruszanie się po Pradze",
       diningLabel:"🍽️ Śniadania / Restauracje", bakeryLabel:"🥖 Piekarnie",
       cafeBarGroupLabel:"☕/🍸 Kawiarnia / Bar", cafeLabel:"☕ Kawiarnie", barLabel:"🍸 Bary",
       groceryLabel:"🛒 Sklepy spożywcze", pharmacyLabel:"💊 Apteki",
       moneyGroupLabel:"💱 Kantory / Bankomaty", exchangeLabel:"💱 Kantory", atmLabel:"🏧 Bankomaty",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Prąd", hotWaterLabel:"💧 Ciepła woda",
       acLabel:"❄️ Klimatyzacja (AC)", inductionLabel:"🍳 Płyta indukcyjna", hoodLabel:"🌀 Okap",
       coffeeLabel:"☕ Ekspres Tchibo", fireAlarmLabel:"🔥 Czujnik dymu",
       elevatorPhoneLabel:"🛗 Winda – serwis", safeLabel:"🔐 Sejf",
       spareKeyLabel:"🔑 Zapasowy klucz",
       laundryLabel:"🧺 Pralnia", accessLabel:"♿️ Dostępność", smokingLabel:"🚭 Palenie",
       luggageLabel:"🎒 Przechowalnia bagażu", doorbellsLabel:"🔔 Dzwonki",
       trashLabel:"🗑️ Śmieci / kosze",
       doctorLabel:"👩‍⚕️ Lekarz 24/7", linenLabel:"🧻 Pościel / Ręczniki",
       pickRoom:"Wybierz numer apartamentu", floor:"Piętro", room:"Pokój", confirm:"Pokaż", cancel:"Zamknij",
       wifiStatus:"Czy Wi-Fi działa?", ok:"Działa", notOk:"Nie działa",
       pickSsid:"Wybierz SSID", showMyWifi:"Pokaż moje hasło",
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchnia", aBathroom:"🛁 Łazienka", aService:"🧰 Pralnia, bagaż, śmieci" }
};

/** Vyhledávání (klíče mimo `tr` kvůli přehlednosti) */
const searchI18n = {
  cs: {
    searchLabel: "Rychlé vyhledávání",
    searchPlaceholder: "Hledat: Wi‑Fi, klimatizace, prádelna...",
    searchNoResults: "Zkuste jiná slova nebo vyberte téma níže.",
    searchHint: "Najdeme nejbližší položku v menu podle vašeho dotazu.",
    searchGo: "Otevřít",
  },
  en: {
    searchLabel: "Quick search",
    searchPlaceholder: "Search: Wi‑Fi, AC, laundry...",
    searchNoResults: "Try different words or pick a topic below.",
    searchHint: "We match the closest menu option to what you type.",
    searchGo: "Open",
  },
  es: {
    searchLabel: "Búsqueda rápida",
    searchPlaceholder: "Buscar: Wi‑Fi, A/C, lavandería...",
    searchNoResults: "Prueba otras palabras o elige un tema abajo.",
    searchHint: "Mostramos la opción del menú más parecida a lo que escribes.",
    searchGo: "Abrir",
  },
  de: {
    searchLabel: "Schnellsuche",
    searchPlaceholder: "Suche: Wi‑Fi, Klima, Wäsche...",
    searchNoResults: "Andere Wörter versuchen oder unten ein Thema wählen.",
    searchHint: "Wir finden den passendsten Menüpunkt zu deiner Eingabe.",
    searchGo: "Öffnen",
  },
  fr: {
    searchLabel: "Recherche rapide",
    searchPlaceholder: "Rechercher: Wi‑Fi, clim, linge...",
    searchNoResults: "Essayez d’autres mots ou choisissez un sujet ci-dessous.",
    searchHint: "Nous proposons l’entrée de menu la plus proche de votre texte.",
    searchGo: "Ouvrir",
  },
  ru: {
    searchLabel: "Быстрый поиск",
    searchPlaceholder: "Поиск: Wi‑Fi, AC, стирка...",
    searchNoResults: "Попробуйте другие слова или выберите тему ниже.",
    searchHint: "Показываем ближайший пункт меню к вашему запросу.",
    searchGo: "Открыть",
  },
  uk: {
    searchLabel: "Швидкий пошук",
    searchPlaceholder: "Пошук: Wi‑Fi, AC, пральня...",
    searchNoResults: "Спробуйте інші слова або оберіть тему нижче.",
    searchHint: "Показуємо найближчий пункт меню до вашого запиту.",
    searchGo: "Відкрити",
  },
  nl: {
    searchLabel: "Snel zoeken",
    searchPlaceholder: "Zoeken: Wi‑Fi, airco, wasruimte...",
    searchNoResults: "Probeer andere woorden of kies hieronder een onderwerp.",
    searchHint: "We tonen het dichtstbijzijnde menu-item bij je invoer.",
    searchGo: "Openen",
  },
  it: {
    searchLabel: "Ricerca veloce",
    searchPlaceholder: "Cerca: Wi‑Fi, A/C, lavanderia...",
    searchNoResults: "Prova altre parole o scegli un argomento qui sotto.",
    searchHint: "Troviamo la voce di menu più vicina a ciò che scrivi.",
    searchGo: "Apri",
  },
  da: {
    searchLabel: "Hurtigsøgning",
    searchPlaceholder: "Søg: Wi‑Fi, aircondition, vaskeri...",
    searchNoResults: "Prøv andre ord eller vælg et emne nedenfor.",
    searchHint: "Vi finder det menupunkt, der ligger tættest på det, du skriver.",
    searchGo: "Åbn",
  },
  pl: {
    searchLabel: "Szybkie wyszukiwanie",
    searchPlaceholder: "Szukaj: Wi‑Fi, klima, pralnia...",
    searchNoResults: "Spróbuj innych słów lub wybierz temat poniżej.",
    searchHint: "Pokazujemy najbliższą pozycję menu do Twojego zapytania.",
    searchGo: "Otwórz",
  },
};

/** Zprávy při prázdné / chybějící odpovědi API */
const replyI18n = {
  cs: {
    replyEmpty:
      "Odpověď ze serveru je prázdná. Zkuste akci znovu. Při lokálním vývoji spusťte „npx netlify dev“ (funkce běží tam, ne ve Vite).",
    replyNetwork:
      "Nelze se připojit k serveru. Při „npm run dev“ musí současně běžet „npx netlify dev“ (proxy předává /.netlify/functions na port 8888).",
    replyNoHtml: "Obsah odpovědi se nepodařilo bezpečně zobrazit — text níže:",
    loadingReply: "Načítám odpověď…",
  },
  en: {
    replyEmpty: "The server returned an empty reply. Please try again.",
    replyNetwork:
      "Cannot reach the server. For “npm run dev”, also run “npx netlify dev” (functions are proxied to port 8888).",
    replyNoHtml: "Could not render the reply safely — plain text below:",
    loadingReply: "Loading reply…",
  },
  es: {
    replyEmpty: "El servidor devolvió una respuesta vacía. Inténtalo de nuevo.",
    replyNetwork: "No hay conexión con el servidor. Para desarrollo local, ejecuta también “npx netlify dev”.",
    replyNoHtml: "No se pudo mostrar el contenido; texto a continuación:",
    loadingReply: "Cargando respuesta…",
  },
  de: {
    replyEmpty: "Der Server hat eine leere Antwort gesendet. Bitte erneut versuchen.",
    replyNetwork: "Server nicht erreichbar. Für lokale Entwicklung bitte auch “npx netlify dev” starten.",
    replyNoHtml: "Inhalt konnte nicht sicher dargestellt werden — Text unten:",
    loadingReply: "Antwort wird geladen…",
  },
  fr: {
    replyEmpty: "Le serveur a renvoyé une réponse vide. Réessayez.",
    replyNetwork: "Impossible de joindre le serveur. En local, lancez aussi “npx netlify dev”.",
    replyNoHtml: "Impossible d’afficher le contenu — texte ci-dessous :",
    loadingReply: "Chargement de la réponse…",
  },
  ru: {
    replyEmpty: "Сервер вернул пустой ответ. Попробуйте снова.",
    replyNetwork: "Нет соединения с сервером. Для разработки запустите также «npx netlify dev».",
    replyNoHtml: "Не удалось безопасно отобразить ответ — текст ниже:",
    loadingReply: "Загрузка ответа…",
  },
  uk: {
    replyEmpty: "Сервер повернув порожню відповідь. Спробуйте ще раз.",
    replyNetwork: "Немає зв’язку з сервером. Для розробки також запустіть «npx netlify dev».",
    replyNoHtml: "Не вдалося безпечно показати відповідь — текст нижче:",
    loadingReply: "Завантаження відповіді…",
  },
  nl: {
    replyEmpty: "De server gaf een leeg antwoord. Probeer opnieuw.",
    replyNetwork: "Geen verbinding met de server. Start voor lokaal ook “npx netlify dev”.",
    replyNoHtml: "Kon de inhoud niet veilig tonen — platte tekst hieronder:",
    loadingReply: "Antwoord laden…",
  },
  it: {
    replyEmpty: "Il server ha restituito una risposta vuota. Riprova.",
    replyNetwork: "Impossibile contattare il server. In locale avvia anche “npx netlify dev”.",
    replyNoHtml: "Impossibile mostrare il contenuto in modo sicuro — testo sotto:",
    loadingReply: "Caricamento risposta…",
  },
  da: {
    replyEmpty: "Serveren returnerede et tomt svar. Prøv igen.",
    replyNetwork: "Kan ikke få kontakt til serveren. Kør også “npx netlify dev” lokalt.",
    replyNoHtml: "Indholdet kunne ikke vises sikkert — tekst nedenfor:",
    loadingReply: "Henter svar…",
  },
  pl: {
    replyEmpty: "Serwer zwrócił pustą odpowiedź. Spróbuj ponownie.",
    replyNetwork: "Brak połączenia z serwerem. Lokalnie uruchom też „npx netlify dev”.",
    replyNoHtml: "Nie udało się bezpiecznie wyświetlić treści — tekst poniżej:",
    loadingReply: "Ładowanie odpowiedzi…",
  },
};

/** Rychlé UX řetězce (cs + en, ostatní jazyky → en) */
const uxStrings = {
  en: {
    breadcrumbHome: "Home",
    searchTryTitle: "Try:",
    searchTryWifi: "Wi‑Fi",
    searchTryInstructions: "Check-in instructions",
    searchTryFood: "Food & nearby",
    sentToast: "Sent — tap « Back » (red) to return to topics.",
    errorWhatsappCta: "Report via WhatsApp",
    offlineBanner: "You’re offline. The app may be cached; new answers might not load.",
    ariaMenuSection: "Topics and shortcuts",
    ariaBreadcrumb: "Where you are",
    ariaSearchResults: "Search results",
    shareSection: "Share link",
    shareTitle: "Chill Concierge",
    shareText: "Open this topic in the app:",
    shareCopied: "Link copied to clipboard.",
    shareFailed: "Copy this link manually:",
    shareTileAria: "Share link to",
    essentialsTitle: "Important now",
    essentialsAllTopics: "All topics",
    copyWifiPassword: "Copy Wi‑Fi password",
    wifiPasswordCopied: "Password copied.",
  },
  cs: {
    breadcrumbHome: "Domů",
    searchTryTitle: "Zkuste:",
    searchTryWifi: "Wi‑Fi",
    searchTryInstructions: "Instrukce k ubytování",
    searchTryFood: "Jídlo a okolí",
    sentToast: "Odesláno — pro návrat k tématům klepněte na červené « Zpět ».",
    errorWhatsappCta: "Nahlásit přes WhatsApp",
    offlineBanner: "Jste offline. Aplikace může být z mezipaměti; nové odpovědi nemusí přijít.",
    ariaMenuSection: "Témata a zkratky",
    ariaBreadcrumb: "Kde se nacházíte",
    ariaSearchResults: "Výsledky vyhledávání",
    shareSection: "Sdílet odkaz",
    shareTitle: "Chill Concierge",
    shareText: "Otevřete toto téma v aplikaci:",
    shareCopied: "Odkaz zkopírován do schránky.",
    shareFailed: "Zkopírujte odkaz ručně:",
    shareTileAria: "Sdílet odkaz k položce",
    essentialsTitle: "Důležité teď",
    essentialsAllTopics: "Všechna témata",
    copyWifiPassword: "Zkopírovat heslo Wi‑Fi",
    wifiPasswordCopied: "Heslo zkopírováno.",
  },
};

const tUx = (lang, key) => uxStrings[lang]?.[key] ?? uxStrings.en[key] ?? key;

/** ===== helper: překlady ===== */
const t = (lang, key) =>
  tr[lang]?.[key] ??
  uxStrings[lang]?.[key] ??
  uxStrings.en[key] ??
  searchI18n[lang]?.[key] ??
  searchI18n.en[key] ??
  replyI18n[lang]?.[key] ??
  replyI18n.en[key] ??
  key;

/** ===== vyhledávání: normalizace + skóre ===== */
const stripForSearch = (s) =>
  String(s || "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearch = (s) =>
  stripForSearch(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

function levenshtein(a, b) {
  if (a.length < b.length) [a, b] = [b, a];
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}

function scoreMatch(queryRaw, labelRaw) {
  const q = normalizeSearch(queryRaw);
  const full = normalizeSearch(labelRaw);
  if (!q.length) return 0;
  const words = full.split(/\s+/).filter(Boolean);
  const qw = q.split(/\s+/).filter(Boolean);

  if (full === q) return 1000;
  if (full.startsWith(q)) return 920;
  if (full.includes(q)) return 820;

  let wordHits = 0;
  for (const w of qw) {
    if (words.some((x) => x.includes(w) || w.includes(x))) wordHits++;
  }
  if (wordHits && qw.length) return 500 + (wordHits / qw.length) * 200;

  const dist = levenshtein(q, full);
  const maxLen = Math.max(q.length, full.length, 1);
  const sim = 1 - dist / maxLen;
  if (sim >= 0.55 && maxLen <= 48) return sim * 400;

  for (const w of words) {
    if (w.length >= 3) {
      const d = levenshtein(q, w);
      const m = Math.max(q.length, w.length, 1);
      const s = 1 - d / m;
      if (s >= 0.65) return s * 320;
    }
  }
  return 0;
}

/** Všechny uzly menu s cestou `stack` (předci pro správné `setStack`) */
function enumerateFlowEntries(nodes, ancestors = []) {
  const out = [];
  for (const n of nodes) {
    out.push({ node: n, stack: ancestors });
    if (n.children?.length) {
      out.push(...enumerateFlowEntries(n.children, [...ancestors, n]));
    }
  }
  return out;
}

/** ================== barvy ============== */
/** Tealková škála — sladěné odstíny (bez oranžové) */
const btnColorForIndex = (i) => {
  const hex = [
    "#0d9488",
    "#0f766e",
    "#115e59",
    "#134e4a",
    "#14b8a6",
    "#0d9488",
  ];
  return hex[i % hex.length];
};

/** ================== App ================== */
export default function App(){
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);

  // Overlays
  const [roomSheet, setRoomSheet] = useState({ open:false, floor:null, last:null }); // keys (interní)
  const [wifiRoomSheet, setWifiRoomSheet] = useState({ open:false, floor:null, last:null });
  const [wifiSsidSheet, setWifiSsidSheet] = useState({ open:false, ssid:null });

  const [wifiCtas, setWifiCtas] = useState({ showPassword:false, showNotOk:false });
  /** false = jen „Důležité teď“ na kořeni; true = plná mřížka témat. */
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [sentToast, setSentToast] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  const [conciergeError, setConciergeError] = useState(null);
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const mainColumnRef = useRef(null);
  const prevChatLenRef = useRef(0);
  const lastAssistantRef = useRef(null);
  const shortcutsRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchPanelRef = useRef(null);
  const pendingDeepLinkNid = useRef(null);
  const deepLinkConsumed = useRef(false);
  const onChipClickRef = useRef(() => {});
  const lastTouchedNidRef = useRef(null);
  const scrollToMainNav = () => {
    requestAnimationFrame(() => {
      searchPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  useEffect(() => {
    setShowAllTopics(false);
  }, [lang]);

  // Nová odpověď asistenta: zarovnat začátek bubliny nahoře (ne skok na konec dlouhého textu)
  useEffect(() => {
    const prev = prevChatLenRef.current;
    prevChatLenRef.current = chat.length;
    const last = chat[chat.length - 1];
    const assistantAppended =
      chat.length > prev && last?.role === "assistant";
    if (!assistantAppended) return;
    requestAnimationFrame(() => {
      lastAssistantRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
  }, [chat]);

  // Po výběru jazyka / otevření menu skoč na vyhledávání a témata
  useEffect(() => {
    if (lang && shortcutsOpen) scrollToMainNav();
  }, [lang, shortcutsOpen]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!searchWrapRef.current?.contains(e.target)) setSearchDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    if (!sentToast) return;
    const t = window.setTimeout(() => setSentToast(false), 4200);
    return () => window.clearTimeout(t);
  }, [sentToast]);

  useEffect(() => {
    if (!shareNotice) return;
    const t = window.setTimeout(() => setShareNotice(null), 2400);
    return () => window.clearTimeout(t);
  }, [shareNotice]);


  useEffect(() => {
    const anyOpen =
      roomSheet.open ||
      wifiRoomSheet.open ||
      wifiSsidSheet.open ||
      installHelpOpen;
    if (!anyOpen) return;
    const id = requestAnimationFrame(() => {
      document.querySelector(".overlay .sheet")?.querySelector("button")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [roomSheet.open, wifiRoomSheet.open, wifiSsidSheet.open, installHelpOpen]);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const n = u.searchParams.get("nid");
      if (n) pendingDeepLinkNid.current = n;
      const l = u.searchParams.get("lang");
      if (l && LANGS[l]) setLang(l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!lang || typeof window === "undefined") return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("lang", lang);
      const n = u.searchParams.get("nid");
      if (n) u.searchParams.set("nid", n);
      window.history.replaceState(null, "", `${u.pathname}?${u.searchParams.toString()}`);
    } catch {
      /* ignore */
    }
  }, [lang]);

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault();
      setDeferredInstall(e);
    };
    const onInstalled = () => setDeferredInstall(null);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      );
    } catch {
      return false;
    }
  }, []);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/i.test(ua)) return true;
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }, []);

  async function handleDeferredInstall() {
    const ev = deferredInstall;
    if (!ev) {
      setInstallHelpOpen(true);
      return;
    }
    try {
      ev.prompt();
      await ev.userChoice;
    } catch {
      /* ignore */
    } finally {
      setDeferredInstall(null);
    }
  }

  /** ====== FLOWS ====== */
  function makeFlows(activeLang){
    const FOOD = [
      flowNode("food_dining", { label: t(activeLang,"diningLabel"), control:{ intent:"local", sub:"dining" } }),
      flowNode("food_bakery", { label: t(activeLang,"bakeryLabel"), control:{ intent:"local", sub:"bakery" } }),
      flowNode("food_cafe_bar", {
        label: t(activeLang,"cafeBarGroupLabel"),
        children:[
          flowNode("food_cafe", { label: t(activeLang,"cafeLabel"), control:{ intent:"local", sub:"cafe" } }),
          flowNode("food_bar", { label: t(activeLang,"barLabel"),  control:{ intent:"local", sub:"bar"  } }),
        ],
      }),
      flowNode("food_grocery", { label: t(activeLang,"groceryLabel"),  control:{ intent:"local", sub:"grocery" } }),
      flowNode("food_pharmacy", { label: t(activeLang,"pharmacyLabel"), control:{ intent:"local", sub:"pharmacy" } }),
      flowNode("food_delivery", { label: t(activeLang,"foodDelivery"),  control:{ intent:"tech",  sub:"food_delivery" } }),
      flowNode("food_money", {
        label: t(activeLang,"moneyGroupLabel"),
        children:[
          flowNode("food_exchange", { label: t(activeLang,"exchangeLabel"), control:{ intent:"local", sub:"exchange" } }),
          flowNode("food_atm", { label: t(activeLang,"atmLabel"),      control:{ intent:"local", sub:"atm" } }),
        ],
      }),
    ];

    const TECH = [
      flowNode("tech_wifi", { label: t(activeLang,"wifiLabel"), control:{ intent:"tech", sub:"wifi", kind:"wifi" } }),
      flowNode("tech_power", { label: t(activeLang,"powerLabel"),           control:{ intent:"tech", sub:"power" } }),
      flowNode("tech_hot_water", { label: t(activeLang,"hotWaterLabel"),        control:{ intent:"tech", sub:"hot_water" } }),
      flowNode("tech_ac", { label: t(activeLang,"acLabel"),              control:{ intent:"tech", sub:"ac" } }),
      flowNode("tech_induction", { label: t(activeLang,"inductionLabel"),       control:{ intent:"tech", sub:"induction" } }),
      flowNode("tech_hood", { label: t(activeLang,"hoodLabel"),            control:{ intent:"tech", sub:"hood" } }),
      flowNode("tech_coffee", { label: t(activeLang,"coffeeLabel"),          control:{ intent:"tech", sub:"coffee" } }),
      flowNode("tech_fire_alarm", { label: t(activeLang,"fireAlarmLabel"),       control:{ intent:"tech", sub:"fire_alarm" } }),
      flowNode("tech_elevator", { label: t(activeLang,"elevatorPhoneLabel"),   control:{ intent:"tech", sub:"elevator_phone" } }),
      flowNode("tech_safe", { label: t(activeLang,"safeLabel"),            control:{ intent:"tech", sub:"safe" } }),
      flowNode("tech_spare_key", { label: t(activeLang,"spareKeyLabel"),        control:{ intent:"tech", sub:"keys" } }),
    ];

    const TRANSPORT = [
      flowNode("transport_prague", { label: t(activeLang,"transportInfo"), control:{ intent:"tech", sub:"transport" } }),
    ];

    const AMENITIES = [
      flowNode("amenity_rooms", { label: t(activeLang,"aRooms"),   control:{ intent:"amenities", sub:"rooms" } }),
      flowNode("amenity_kitchen", { label: t(activeLang,"aKitchen"), control:{ intent:"amenities", sub:"kitchen" } }),
      flowNode("amenity_bathroom", { label: t(activeLang,"aBathroom"),control:{ intent:"amenities", sub:"bathroom" } }),
      flowNode("amenity_service", { label: t(activeLang,"aService"), control:{ intent:"amenities", sub:"service" } }),
    ];

    const OTHER = [
      flowNode("other_laundry", { label: t(activeLang,"laundryLabel"),     control:{ intent:"tech", sub:"laundry" } }),
      flowNode("other_access", { label: t(activeLang,"accessLabel"),      control:{ intent:"tech", sub:"access" } }),
      flowNode("other_smoking", { label: t(activeLang,"smokingLabel"),     control:{ intent:"tech", sub:"smoking" } }),
      flowNode("other_luggage", { label: t(activeLang,"luggageLabel"),     control:{ intent:"tech", sub:"luggage" } }),
      flowNode("other_doorbells", { label: t(activeLang,"doorbellsLabel"),   control:{ intent:"tech", sub:"doorbells" } }),
      flowNode("other_trash", { label: t(activeLang,"trashLabel"),       control:{ intent:"tech", sub:"trash" } }),
      flowNode("other_doctor", { label: t(activeLang,"doctorLabel"),      control:{ intent:"tech", sub:"doctor" } }),
      flowNode("other_linen", { label: t(activeLang,"linenLabel"),       control:{ intent:"tech", sub:"linen_towels" } }),
    ];

    return [
      flowNode("stay_instructions", { label: t(activeLang,"instructionsLabel"), control:{ intent:"tech", sub:"stay_instructions" } }),
      flowNode("tour_3d", { label: t(activeLang,"tourLabel"), action:"tour" }),
      flowNode("wifi_quick", { label: t(activeLang,"wifiLabel"), control:{ intent:"tech", sub:"wifi", kind:"wifi" } }),
      flowNode("cat_food", { label: t(activeLang,"catFood"),      children:FOOD }),
      flowNode("cat_tech", { label: t(activeLang,"catTech"),      children:TECH }),
      flowNode("cat_transport", { label: t(activeLang,"catTransport"), children:TRANSPORT }),
      flowNode("cat_amenities", { label: t(activeLang,"catAmenities"), children:AMENITIES }),
      flowNode("cat_other", { label: t(activeLang,"catOther"),     children:OTHER }),
    ];
  }
  const FLOWS = useMemo(() => (lang ? makeFlows(lang) : []), [lang]);

  useEffect(() => {
    const nid = pendingDeepLinkNid.current;
    if (!nid || !lang || !FLOWS.length || deepLinkConsumed.current) return;
    const ok = navigateFlowNid(nid, FLOWS, {
      setStack,
      setShortcutsOpen,
      setWifiCtas,
      scrollToMainNav,
      onChipClick: (node) => onChipClickRef.current?.(node),
    });
    if (ok) {
      deepLinkConsumed.current = true;
      pendingDeepLinkNid.current = null;
    } else {
      pendingDeepLinkNid.current = null;
    }
  }, [lang, FLOWS]);

  const searchIndex = useMemo(
    () => (FLOWS.length ? enumerateFlowEntries(FLOWS) : []),
    [FLOWS]
  );

  const searchHits = useMemo(() => {
    const q = searchQuery.trim();
    if (!lang || !q || normalizeSearch(q).length < 2) return [];
    const ranked = searchIndex
      .map((e) => ({ ...e, score: scoreMatch(q, e.node.label) }))
      .filter((e) => e.score >= 120)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    return ranked;
  }, [lang, searchQuery, searchIndex]);

  const searchFallbackEntries = useMemo(() => {
    if (!searchIndex.length) return [];
    const pick = (nid) => searchIndex.find((e) => e.node.nid === nid);
    return [pick("wifi_quick"), pick("stay_instructions"), pick("cat_food")].filter(Boolean);
  }, [searchIndex]);

  function renderAssistant(md){
    const src = typeof md === "string" ? md : "";
    if (!src.trim()) {
      return <div className="bubble bot tips">{t(lang ?? "en", "replyEmpty")}</div>;
    }

    let raw;
    try {
      raw = marked.parse(src, { breaks: true, async: false });
    } catch {
      return (
        <div className="bubble bot" style={{ whiteSpace: "pre-wrap" }}>
          {src}
        </div>
      );
    }

    if (typeof raw !== "string") {
      return (
        <div className="bubble bot" style={{ whiteSpace: "pre-wrap" }}>
          {src}
        </div>
      );
    }

    let clean = DOMPurify.sanitize(raw);
    if (!clean.trim()) {
      clean = DOMPurify.sanitize(raw, {
        ADD_TAGS: ["img"],
        ADD_ATTR: ["src", "alt", "title", "loading"],
      });
    }
    if (!clean.trim()) {
      return (
        <div className="bubble bot">
          <p className="tips" style={{ marginTop: 0 }}>
            {t(lang ?? "en", "replyNoHtml")}
          </p>
          <div style={{ whiteSpace: "pre-wrap" }}>{src}</div>
        </div>
      );
    }

    const bubble = (
      <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />
    );
    const wifiCreds = extractWifiCredsFromReply(src);
    if (!wifiCreds) return bubble;
    const copyLabel = tUx(lang ?? "en", "copyWifiPassword");
    const copiedMsg = tUx(lang ?? "en", "wifiPasswordCopied");
    const failMsg = tUx(lang ?? "en", "shareFailed");
    return (
      <>
        {bubble}
        <div className="wifiCopyBar">
          <button
            type="button"
            className="wifiCopyBtn"
            onClick={() => {
              const { pass } = wifiCreds;
              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                navigator.clipboard
                  .writeText(pass)
                  .then(() => setShareNotice(copiedMsg))
                  .catch(() => window.prompt(failMsg, pass));
              } else if (typeof window !== "undefined") {
                window.prompt(failMsg, pass);
              }
            }}
          >
            {copyLabel}
          </button>
        </div>
      </>
    );
  }

  function extractReplyFromResponseBody(rawText, httpOk) {
    let data = null;
    try {
      data = rawText && rawText.trim() ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }
    let reply = "";
    if (data && typeof data.reply === "string") reply = data.reply;
    if (!reply && data && typeof data.body === "string") {
      try {
        const inner = JSON.parse(data.body);
        if (typeof inner?.reply === "string") reply = inner.reply;
      } catch {
        /* ignore */
      }
    }
    if (!reply.trim() && !httpOk && typeof data?.message === "string") reply = data.message;
    return reply;
  }

  async function callBackend(payload){
    const MAX_MESSAGES = 28;
    const bodyPayload =
      Array.isArray(payload?.messages) && payload.messages.length > MAX_MESSAGES
        ? { ...payload, messages: payload.messages.slice(-MAX_MESSAGES) }
        : payload;

    setLoading(true);
    setConciergeError(null);
    try{
      const r = await fetch("/.netlify/functions/concierge", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(bodyPayload),
        keepalive: true,
      });
      const rawText = await r.text();
      let reply = extractReplyFromResponseBody(rawText, r.ok);
      if (!reply.trim() && !r.ok) {
        reply = `⚠️ HTTP ${r.status}`;
      }
      if (!reply.trim()) {
        reply = t(lang ?? "en", "replyEmpty");
      }
      setChat((c) => [...c, { role:"assistant", content: reply }]);
      if (r.ok) {
        setConciergeError(null);
        try {
          if (typeof localStorage !== "undefined" && reply.trim()) {
            localStorage.setItem(
              LS_LAST_REPLY,
              JSON.stringify({
                reply: reply.slice(0, 16000),
                ts: Date.now(),
                lang: lang ?? "en",
              })
            );
          }
        } catch {
          /* ignore */
        }
        return { ok: true };
      }
      setConciergeError({ kind: "http", status: r.status });
      return { ok: false };
    }catch{
      setConciergeError({ kind: "network" });
      setChat((c) => [...c, { role:"assistant", content: t(lang ?? "en", "replyNetwork") }]);
      return { ok: false };
    }finally{ setLoading(false); }
  }

  function sendControl(promptText, control){
    let nextMessages;
    flushSync(() => {
      setChat((prev) => {
        nextMessages = [...prev, { role:"user", content: promptText }];
        return nextMessages;
      });
    });
    return callBackend({ messages: nextMessages, uiLang: lang, control });
  }

  function sendText(text){
    let nextMessages;
    flushSync(() => {
      setChat((prev) => {
        nextMessages = [...prev, { role:"user", content: text }];
        return nextMessages;
      });
    });
    return callBackend({ messages: nextMessages, uiLang: lang });
  }

  const openNode = (node) => setStack(s => [...s, node]);
  const goBack = () => {
    setWifiCtas({ showPassword: false, showNotOk: false });
    setStack((s) => {
      const next = s.slice(0, -1);
      if (next.length === 0) lastTouchedNidRef.current = null;
      return next;
    });
  };
  const resetToRoot = () => setStack([]);

  const currentChildren =
    !lang ? null :
    stack.length === 0 ? FLOWS :
    stack[stack.length - 1]?.children ?? FLOWS;


  const essentialTiles = useMemo(() => {
    if (!FLOWS.length) return [];
    return ESSENTIAL_MENU_NIDS.map((nid) => {
      const path = findPathByNid(FLOWS, nid);
      if (!path?.length) return null;
      const node = path[path.length - 1];
      return { nid, label: node.label };
    }).filter(Boolean);
  }, [FLOWS]);

  const essentialsOnlyView = Boolean(
    lang && stack.length === 0 && !showAllTopics && essentialTiles.length > 0
  );

  const showRootTopicGrid =
    stack.length > 0 || showAllTopics || essentialTiles.length === 0;

  const breadcrumbSegments = useMemo(() => {
    if (!lang) return [];
    const h = tUx(lang, "breadcrumbHome");
    if (stack.length === 0) return [];
    return [h, ...stack.map((s) => s.label)];
  }, [lang, stack]);

  const waUi = whatsappI18n[lang ?? "cs"] ?? whatsappI18n.en;
  const whatsappHref = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(waUi.prefill)}`;
  const whatsappErrorHref = useMemo(() => {
    if (!conciergeError) return whatsappHref;
    const tag =
      conciergeError.kind === "network"
        ? "\n[Concierge: network error]"
        : `\n[Concierge: HTTP ${conciergeError.status}]`;
    return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(waUi.prefill + tag)}`;
  }, [conciergeError, waUi.prefill, whatsappHref]);
  const bookingHref = lang === "cs" ? BOOKING_URL_CS : BOOKING_URL_INTL;
  const headerTb = lang ? topBarCopy(lang) : null;

  const ALL_SSIDS = ["D384","CDEA","CF2A","93EO","D93A","D9E4","6A04","9B7A","1CF8","D8C4","CD9E","CF20","23F0","B4B4","DA4E","D5F6"];

  const onChipClick = (n) => {
    if (n?.nid) lastTouchedNidRef.current = n.nid;

    if (n.children) {
      setWifiCtas({ showPassword:false, showNotOk:false });
      return openNode(n);
    }

    if (n.action === "tour") {
      try { window.open(MATTERPORT_URL, "_blank", "noopener,noreferrer"); } catch {}
      setWifiCtas({ showPassword:false, showNotOk:false });
      setShortcutsOpen(false);
      setChat(c => [...c, { role:"assistant", content: tr[lang]?.tourOpenMsg || "Link" }]);
      return;
    }

    if (n.control?.kind === "wifi") {
      setShortcutsOpen(false);
      setWifiCtas({ showPassword:true, showNotOk:false });
      return sendControl("Wi-Fi", { intent:"tech", sub:"wifi" }).then((res) => {
        if (res?.ok) setSentToast(true);
      });
    }

    if (n.control) {
      setShortcutsOpen(false);
      setWifiCtas({ showPassword:false, showNotOk:false });
      return sendControl(n.label, n.control).then((res) => {
        if (res?.ok) setSentToast(true);
      });
    }
  };

  function buildShareUrlWithNid(nid) {
    try {
      const u = new URL(window.location.href);
      u.hash = "";
      u.search = "";
      if (lang) u.searchParams.set("lang", lang);
      if (nid) u.searchParams.set("nid", nid);
      return u.toString();
    } catch {
      return "";
    }
  }

  function getContextualShareNid() {
    if (stack.length > 0) return stack[stack.length - 1].nid ?? null;
    return lastTouchedNidRef.current ?? null;
  }

  async function shareConciergeUrl(overrideNid) {
    if (typeof window === "undefined" || !lang) return;
    const nid = overrideNid ?? getContextualShareNid();
    const url = buildShareUrlWithNid(nid);
    if (!url) return;
    const title = tUx(lang, "shareTitle");
    const text = tUx(lang, "shareText");
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text}\n${url}`,
          url,
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice(tUx(lang, "shareCopied"));
    } catch {
      window.prompt(tUx(lang, "shareFailed"), url);
    }
  }

  function applySearchHit(entry) {
    setSearchQuery("");
    setSearchDropdownOpen(false);
    setStack(entry.stack);
    setShortcutsOpen(true);
    setWifiCtas({ showPassword:false, showNotOk:false });
    requestAnimationFrame(() => {
      scrollToMainNav();
      onChipClick(entry.node);
    });
  }

  const confirmRoom = () => {
    const { floor, last } = roomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setRoomSheet({ open:false, floor:null, last:null });
    return sendControl(`Náhradní klíč ${room}`, { intent:"tech", sub:"keys", room });
  };

  const confirmWifiRoom = () => {
    const { floor, last } = wifiRoomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setWifiRoomSheet({ open:false, floor:null, last:null });
    setWifiCtas({ showPassword:false, showNotOk:true }); // po odeslání pokoje zobraz „Nefunguje“
    return sendText(room);
  };

  const confirmWifiSsid = () => {
    if (!wifiSsidSheet.ssid) return;
    const ssid = wifiSsidSheet.ssid;
    setWifiSsidSheet({ open:false, ssid:null });
    setWifiCtas({ showPassword:false, showNotOk:false });
    return sendText(ssid);
  };

  // Pomocné: výběr jazyka – EN první, ostatní ve dvojicích
  const renderLangChooser = () => {
    const entries = Object.entries(LANGS);
    const first = entries.find(([code]) => code === "en");
    const rest = entries.filter(([code]) => code !== "en");

    return (
      <div className="bubble bot langChooserCard">
        <div className="menuGrid langMenuGrid">
          <button
            type="button"
            className="chipPrimary langBtnWide"
            style={{ ["--btn"]: btnColorForIndex(0) }}
            onClick={() => {
              lastTouchedNidRef.current = null;
              setLang("en");
              resetToRoot();
              setSearchQuery("");
              setWifiCtas({ showPassword:false, showNotOk:false });
              setShortcutsOpen(true);
              scrollToMainNav();
            }}
          >
            {first?.[1] || "English"}
          </button>
          {rest.map(([code, label], i) => (
            <button
              type="button"
              key={code}
              className="chipPrimary"
              style={{ ["--btn"]: btnColorForIndex(i + 1) }}
              onClick={() => {
                lastTouchedNidRef.current = null;
                setLang(code);
                resetToRoot();
                setSearchQuery("");
                setWifiCtas({ showPassword:false, showNotOk:false });
                setShortcutsOpen(true);
                scrollToMainNav();
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="tips">
          {Object.keys(LANGS).map(k => k.toUpperCase()).join(" / ")}
        </div>
      </div>
    );
  };

  onChipClickRef.current = onChipClick;

  return (
    <>
      <AppStyles />

      <div className="appShell">
      {/* Header */}
      <header className="appHeader">
        <div className="appHeaderInner">
          <div className="brandMvp">
            <img
              className="brandLogo"
              src="/help/chill1.jpg"
              alt=""
              width={58}
              height={58}
              decoding="async"
              fetchPriority="high"
            />
            <div className="brandText">
              <span className="brandName">Chill Apartments</span>
              <span className="brandTag">Concierge</span>
            </div>
          </div>
          {lang && headerTb && (
            <div
              className={`headerCtaRow${isStandalone ? " headerCtaRow--solo" : ""}`}
              aria-label={`${headerTb.bookApart}, ${tUx(lang, "shareSection")}${
                isStandalone
                  ? ""
                  : `, ${
                      deferredInstall
                        ? headerTb.installApp
                        : isIOS
                          ? headerTb.addToHome
                          : headerTb.installApp
                    }`
              }`}
            >
              <a
                className="headerBookBtn"
                href={bookingHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {headerTb.bookApart}
              </a>
              <button
                type="button"
                className="headerShareBtn"
                onClick={() => shareConciergeUrl()}
              >
                🔗 {tUx(lang, "shareSection")}
              </button>
              {!isStandalone && (
                <button
                  type="button"
                  className="headerInstallBtn"
                  onClick={() => (deferredInstall ? handleDeferredInstall() : setInstallHelpOpen(true))}
                >
                  {deferredInstall
                    ? headerTb.installApp
                    : isIOS
                      ? headerTb.addToHome
                      : headerTb.installApp}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className={`row${lang ? "" : " rowLangOnly"}`} ref={mainColumnRef}>
        {lang && !online && (
          <div className="offlineBar" role="status">
            {tUx(lang, "offlineBanner")}
          </div>
        )}
        {lang && conciergeError && (
          <div className="errorBar" role="alert">
            <span>
              {conciergeError.kind === "network"
                ? t(lang, "replyNetwork")
                : `⚠️ HTTP ${conciergeError.status}`}
            </span>
            <a href={whatsappErrorHref} target="_blank" rel="noopener noreferrer">
              {tUx(lang, "errorWhatsappCta")}
            </a>
          </div>
        )}
        {/* CHAT SCROLLER */}
        <div className="scroller scroller--elevated">
          {!lang && renderLangChooser()}

          {chat.map((m, i) => {
            const isLast = i === chat.length - 1;
            const anchorRef =
              m.role === "assistant" && isLast ? lastAssistantRef : undefined;
            return m.role === "assistant" ? (
              <div key={i} ref={anchorRef} className="chatAssistantAnchor">
                {renderAssistant(m.content)}
              </div>
            ) : (
              <div key={i} className="bubble me">
                {m.content}
              </div>
            );
          })}
          {loading && (
            <div className="bubble bot typingBubble" aria-busy="true" aria-label={t(lang ?? "en", "loadingReply")}>
              <span className="typingDots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>

        {lang && <div className="sectionDivider" aria-hidden />}

        {/* Vyhledávání (po výběru jazyka) */}
        {lang && (
          <section className="searchPanel" ref={searchPanelRef} aria-label={t(lang, "searchLabel")}>
            <label className="searchLabel" htmlFor="concierge-search">
              {t(lang, "searchLabel")}
            </label>
            <p className="tips" style={{ marginTop: 0, marginBottom: 10 }}>
              {t(lang, "searchHint")}
            </p>
            <div className="searchWrap" ref={searchWrapRef}>
              <div className="searchInputRow">
                <span className="searchIcon" aria-hidden>
                  ⌕
                </span>
                <input
                  id="concierge-search"
                  className="searchInput"
                  type="search"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder={t(lang, "searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchDropdownOpen(true);
                  }}
                  onFocus={() => setSearchDropdownOpen(true)}
                />
              </div>
              {searchDropdownOpen && normalizeSearch(searchQuery).length >= 2 && (
                <ul
                  className="searchResults"
                  role="listbox"
                  aria-label={tUx(lang, "ariaSearchResults")}
                >
                  {searchHits.length === 0 ? (
                    <>
                      <li className="searchEmpty" role="option">
                        {t(lang, "searchNoResults")}
                      </li>
                      {searchFallbackEntries.length > 0 && (
                        <li role="presentation">
                          <div className="searchQuickPicks">
                            <div className="searchQuickPicksLabel">
                              {tUx(lang, "searchTryTitle")}
                            </div>
                            {searchFallbackEntries.map((hit) => (
                              <button
                                key={hit.node.nid || hit.node.label}
                                type="button"
                                className="searchQuickPickBtn"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applySearchHit(hit)}
                              >
                                {hit.node.label}
                              </button>
                            ))}
                          </div>
                        </li>
                      )}
                    </>
                  ) : (
                    searchHits.map((hit, i) => (
                      <li key={`${hit.node.label}-${i}-${hit.score}`} role="option">
                        <button
                          type="button"
                          className="searchHit"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySearchHit(hit)}
                        >
                          <span className="searchHitTitle">{hit.node.label}</span>
                          {hit.stack.length > 0 && (
                            <span className="searchHitTrail">
                              {hit.stack.map((s) => s.label).join(" › ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ZKRATKY */}
        {lang && currentChildren && shortcutsOpen && (
          <div
            className="shortcuts"
            ref={shortcutsRef}
            role="region"
            aria-labelledby="shortcuts-heading"
          >
            {breadcrumbSegments.length > 0 && (
              <nav className="breadcrumbNav" aria-label={tUx(lang, "ariaBreadcrumb")}>
                {breadcrumbSegments.map((seg, i) => (
                  <span key={`${i}-${seg}`}>
                    {i > 0 && (
                      <span className="crumbSep" aria-hidden>
                        ›
                      </span>
                    )}
                    {seg}
                  </span>
                ))}
              </nav>
            )}
            <div className="shortcutsHeader">
              <strong id="shortcuts-heading">
                {stack.length > 0
                  ? t(lang, "subTitle")
                  : essentialsOnlyView
                    ? tUx(lang, "essentialsTitle")
                    : t(lang, "mainTitle")}
              </strong>
              <div className="btnRow">
                {stack.length > 0 && (
                  <button
                    type="button"
                    className="backBtn backBtn--danger"
                    onClick={() => {
                      goBack();
                      scrollToMainNav();
                    }}
                  >
                    {t(lang,"back")}
                  </button>
                )}
                <button type="button" className="backBtn backBtn--teal" onClick={() => { setShortcutsOpen(false); }}>
                  {t(lang,"hide")}
                </button>
                <button
                  type="button"
                  className="backBtn backBtn--teal"
                  onClick={() => shareConciergeUrl()}
                  title={tUx(lang, "shareSection")}
                >
                  🔗 {tUx(lang, "shareSection")}
                </button>
                <button
                  type="button"
                  className="backBtn backBtn--language"
                  onClick={() => {
                    lastTouchedNidRef.current = null;
                    setLang(null);
                    setStack([]);
                    setSearchQuery("");
                    setWifiCtas({ showPassword:false, showNotOk:false });
                    setShortcutsOpen(false);
                    requestAnimationFrame(() => {
                      mainColumnRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    });
                  }}
                >
                  {t(lang || "cs","chooseLang")}
                </button>
              </div>
            </div>
            {essentialsOnlyView && (
              <>
                <div className="essentialsGrid">
                  {essentialTiles.map((tile, i) => (
                    <button
                      key={tile.nid}
                      type="button"
                      className="essentialsTile"
                      style={{ ["--btn"]: btnColorForIndex(i) }}
                      disabled={loading}
                      onClick={() => {
                        lastTouchedNidRef.current = tile.nid;
                        navigateFlowNid(tile.nid, FLOWS, {
                          setStack,
                          setShortcutsOpen,
                          setWifiCtas,
                          scrollToMainNav,
                          onChipClick: (node) => onChipClick(node),
                        });
                      }}
                    >
                      {tile.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="essentialsAllTopicsBtn"
                  onClick={() => setShowAllTopics(true)}
                >
                  <span className="essentialsAllTopicsBtnIcon" aria-hidden>
                    ⊞
                  </span>
                  {tUx(lang, "essentialsAllTopics")}
                </button>
              </>
            )}
            {showRootTopicGrid && (
              <div className="menuGrid">
                {currentChildren.map((n, idx) =>
                  n.nid ? (
                    <div key={n.nid} className="menuTileWrap">
                      <button
                        type="button"
                        className="chipPrimary"
                        style={{ ["--btn"]: btnColorForIndex(idx) }}
                        onClick={() => onChipClick(n)}
                        disabled={loading && !n.children}
                        title={n.control?.sub || n.action || ""}
                      >
                        {n.label}
                      </button>
                      <button
                        type="button"
                        className="tileShareBtn"
                        aria-label={`${tUx(lang, "shareTileAria")}: ${n.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          shareConciergeUrl(n.nid);
                        }}
                      >
                        🔗
                      </button>
                    </div>
                  ) : (
                    <button
                      key={`m-${idx}`}
                      type="button"
                      className="chipPrimary"
                      style={{ ["--btn"]: btnColorForIndex(idx) }}
                      onClick={() => onChipClick(n)}
                      disabled={loading && !n.children}
                      title={n.control?.sub || n.action || ""}
                    >
                      {n.label}
                    </button>
                  )
                )}
              </div>
            )}

            {stack.length > 0 && (
              <div className="tips" style={{ marginTop: 8 }}>{t(lang, "stillAsk")}</div>
            )}
          </div>
        )}

        {/* FAB: když jsou zkratky zavřené → červené tlačítko „← Zpět“ (jen znovu otevře menu) */}
        {!shortcutsOpen && lang && (
          <button
            className="fab"
            onClick={() => {
              setShortcutsOpen(true);
              requestAnimationFrame(() => {
                scrollToMainNav();
              });
            }}
            title={t(lang,"back")}
          >
            {t(lang,"back")}
          </button>
        )}

      </div>
      </div>

      {lang && (sentToast || shareNotice) && (
        <div className="toastBar" role="status">
          {sentToast ? tUx(lang, "sentToast") : shareNotice}
        </div>
      )}

      <footer className="whatsappDock" role="contentinfo">
        <a
          className="whatsappDockBtn"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={waUi.btn}
        >
          <span className="waIco" aria-hidden>
            💬
          </span>
          <span>{waUi.btn}</span>
        </a>
      </footer>

      {/* ===== CTA STACK (jen nad chatem — při otevřeném menu skrýt, ať nepřekrývá dlaždice) ===== */}
      <div className="fabStack" aria-live="polite">
        {wifiCtas.showPassword && !shortcutsOpen && (
          <button className="fabAction" onClick={() => setWifiRoomSheet({ open:true, floor:null, last:null })}>
            {t(lang,"showMyWifi")}
          </button>
        )}
        {wifiCtas.showNotOk && !shortcutsOpen && (
          <button className="fabAction" onClick={() => setWifiSsidSheet({ open:true, ssid:null })}>
            {t(lang,"notOk")}
          </button>
        )}
      </div>

      {/* OVERLAY: Náhradní klíč – výběr pokoje */}
      {roomSheet.open && (
        <div className="overlay" onClick={()=>setRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t(lang,"floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${roomSheet.floor===f?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t(lang,"room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${roomSheet.last===l?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button type="button" className="backBtn backBtn--teal" onClick={()=>setRoomSheet({open:false,floor:null,last:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={roomSheet.floor===null || roomSheet.last===null}
                onClick={confirmRoom}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr pokoje */}
      {wifiRoomSheet.open && (
        <div className="overlay" onClick={()=>setWifiRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t(lang,"floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${wifiRoomSheet.floor===f?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t(lang,"room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${wifiRoomSheet.last===l?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button type="button" className="backBtn backBtn--teal" onClick={()=>setWifiRoomSheet({open:false,floor:null,last:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={wifiRoomSheet.floor===null || wifiRoomSheet.last===null}
                onClick={confirmWifiRoom}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr SSID */}
      {installHelpOpen && lang && (
        <div className="overlay" onClick={() => setInstallHelpOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{topBarCopy(lang).installHelpTitle}</h4>
            <p className="tips" style={{ marginTop: 0, lineHeight: 1.5 }}>
              {isIOS ? (
                topBarCopy(lang).installHelpIos
              ) : (
                <>
                  {topBarCopy(lang).installHelpAndroid}
                  <br />
                  <br />
                  {topBarCopy(lang).installHelpDesktop}
                </>
              )}
            </p>
            <div className="pillRow">
              <button
                type="button"
                className="backBtn backBtn--teal"
                onClick={() => setInstallHelpOpen(false)}
              >
                {topBarCopy(lang).close}
              </button>
            </div>
          </div>
        </div>
      )}

      {wifiSsidSheet.open && (
        <div className="overlay" onClick={()=>setWifiSsidSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickSsid")}</h4>
            <div className="pillRow" style={{marginBottom:12}}>
              {ALL_SSIDS.map(code=>(
                <button
                  key={code}
                  className={`pill ${wifiSsidSheet.ssid===code?'active':''}`}
                  onClick={()=>setWifiSsidSheet(s=>({...s, ssid:code}))}
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button type="button" className="backBtn backBtn--teal" onClick={()=>setWifiSsidSheet({open:false, ssid:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={!wifiSsidSheet.ssid}
                onClick={confirmWifiSsid}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
