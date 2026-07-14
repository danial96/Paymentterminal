import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmbeddedCheckoutButton from "./EmbeddedCheckout";
import ScrollPayButton from "./ScrollPayButton";
import PrintButton from "./PrintButton";

const CURRENCY_SYMBOLS: Record<string, string> = { gbp: "£", usd: "$", eur: "€", pkr: "₨" };

/* ─────────────────────────── STYLE BLOCKS ─────────────────────────── */

function modernStyles(a: string, p: boolean) {
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#e8eaed"}}
  .w{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:${p?"#fff":"#e8eaed"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#111}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;border-radius:12px;box-shadow:0 2px 20px rgba(0,0,0,.07);overflow:hidden;border-top:4px solid ${a};position:relative}
  /* PAID — diagonal watermark center */
  .paid-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:90px;font-weight:900;color:rgba(22,163,74,.11);border:8px solid rgba(22,163,74,.11);border-radius:12px;padding:4px 28px;letter-spacing:12px;text-transform:uppercase;pointer-events:none;user-select:none;white-space:nowrap;z-index:10}
  .hd{padding:32px 44px 28px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:1px solid #f0f1f4}
  .logo{max-height:58px;max-width:200px;object-fit:contain;display:block}
  .logo-txt{font-size:22px;font-weight:900;color:#1e2330;letter-spacing:-.5px}
  .hd-r{text-align:right}
  .hd-title{font-size:36px;font-weight:900;color:#1e2330;letter-spacing:6px;line-height:1}
  .hd-num{font-size:13px;color:#999;margin-top:8px;font-weight:500}
  .accent-bar{display:block;width:40px;height:3px;background:${a};border-radius:2px;margin:8px 0 0 auto}
  .status-strip{padding:7px 44px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;text-align:center}
  .s-sent{background:#eff6ff;color:#3b82f6}.s-paid{background:#dcfce7;color:#16a34a}.s-cancelled{background:#fef2f2;color:#ef4444}.s-draft{background:#f5f6f8;color:#9ca3af}
  .meta{display:flex;background:#f8f9fb;border-bottom:1px solid #eef0f3}
  .mc{flex:1;padding:13px 44px;border-right:1px solid #eef0f3}
  .mc:last-child{border-right:none}
  .ml{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#aaa;margin-bottom:3px}
  .mv{font-size:13px;font-weight:700;color:#1e2330}
  .addrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #f0f1f4}
  .ab{padding:24px 44px}
  .ab:first-child{border-right:1px solid #f0f1f4}
  .al{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;margin-bottom:10px}
  .an{font-size:15px;font-weight:800;color:#1e2330;line-height:1.3}
  .as{font-size:13px;font-weight:500;color:#666;margin-top:2px}
  .ad{font-size:12.5px;color:#888;line-height:1.85;margin-top:7px}
  .ad a{color:#888;text-decoration:none;pointer-events:none}
  .tw{padding:28px 44px 0}
  table{width:100%;border-collapse:collapse}
  thead tr{border-bottom:2px solid ${a}}
  thead th{padding:9px 12px;font-size:10px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:1px}
  thead th:first-child{text-align:left;padding-left:0}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #f3f4f6}
  tbody td{padding:13px 12px;font-size:13.5px;color:#444}
  tbody td:first-child{padding-left:0;color:#1e2330}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:700;color:#1e2330}
  .totals{display:flex;justify-content:flex-end;padding:20px 44px 28px}
  .tbox{width:260px}
  .tr{display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:13px;border-bottom:1px solid #f0f1f4}
  .tr:last-child{border-bottom:none;border-top:2px solid ${a};margin-top:6px;padding-top:12px}
  .tr:last-child span{font-size:16px;font-weight:900;color:#1e2330}
  .tl{color:#999;font-weight:500}.ta{font-weight:600;color:#333}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 44px 28px}
  .nb{background:#f8f9fb;border-radius:8px;padding:14px 16px}
  .nl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#aaa;margin-bottom:6px}
  .nt{font-size:12.5px;color:#666;line-height:1.65;white-space:pre-wrap}
  /* bank */
  .bank{margin:0 44px 32px;border:1px solid #eef0f3;border-radius:10px;overflow:hidden}
  .bh{background:#f8f9fb;padding:10px 20px;border-bottom:2px solid ${a}}
  .bht{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#666}
  .bg{display:grid;grid-template-columns:1fr 1fr}
  .bc{padding:14px 20px;border-bottom:1px solid #f0f1f4;border-right:1px solid #f0f1f4}
  .bc:nth-child(even){border-right:none}
  .bc:nth-last-child(-n+2){border-bottom:none}
  .bcf{grid-column:1/-1;border-right:none}
  .bclbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#bbb;margin-bottom:4px}
  .bcv{font-size:13.5px;font-weight:700;color:#1e2330;font-family:monospace}
  .bref{padding:10px 20px;background:#f8f9fb;text-align:center;font-size:12px;color:#999;border-top:1px solid #f0f1f4}
  .bref strong{color:#1e2330;font-weight:700}
  .pay{padding:24px 44px 36px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:1px solid #f0f1f4}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;background:#dcfce7;color:#16a34a;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px}
  .foot{padding:14px 44px;background:#1e2330;display:flex;align-items:center;justify-content:space-between}
  .fb{font-size:11px;font-weight:700;color:rgba(255,255,255,.7)}
  .fn{font-size:11px;color:rgba(255,255,255,.35);font-family:monospace}
  .inv-print-btn{position:fixed;bottom:28px;right:28px;display:inline-flex;align-items:center;gap:8px;background:#1e2330;color:#fff;font-size:14px;font-weight:700;padding:13px 24px;border-radius:10px;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.18);z-index:999;transition:opacity .15s;font-family:inherit}
  .inv-print-btn:hover{opacity:.85}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none;border-radius:0}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.card{border-radius:0}.hd{padding:20px;flex-direction:column}.hd-r{text-align:left}.meta{flex-wrap:wrap}.mc{flex:0 0 50%;padding:10px 20px}.addrs{grid-template-columns:1fr}.ab{padding:18px 20px}.ab:first-child{border-right:none;border-bottom:1px solid #f0f1f4}.tw{padding:20px 20px 0}.totals{padding:16px 20px 20px}.tbox{width:100%}.notes{grid-template-columns:1fr;padding:0 20px 20px}.bank{margin:0 20px 24px}.bg{grid-template-columns:1fr}.bc{border-right:none!important}.pay{padding:20px}.foot{padding:12px 20px}}
  `;
}

function classicStyles(a: string, p: boolean) {
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#d4d8dc"}}
  .w{font-family:Georgia,'Times New Roman',serif;background:${p?"#fff":"#d4d8dc"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#222}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;box-shadow:0 1px 12px rgba(0,0,0,.10);overflow:hidden;position:relative;border:1px solid #ccc}
  /* PAID — big green top banner replaces status strip */
  .hd{background:${a};padding:28px 44px 24px;text-align:center}
  .logo{max-height:60px;max-width:200px;object-fit:contain;display:block;margin:0 auto 12px;filter:brightness(0) invert(1)}
  .logo-txt{font-size:24px;font-weight:bold;color:#fff;letter-spacing:2px;margin-bottom:10px}
  .hd-title{font-size:13px;font-weight:bold;color:rgba(255,255,255,.85);letter-spacing:6px;text-transform:uppercase}
  .hd-num{font-size:12px;color:rgba(255,255,255,.65);margin-top:4px;font-family:monospace;letter-spacing:1px}
  /* PAID banner replaces status strip entirely */
  .paid-banner{background:#16a34a;padding:14px 44px;text-align:center;font-size:18px;font-weight:bold;color:#fff;font-family:sans-serif;letter-spacing:3px;text-transform:uppercase}
  .status-strip{padding:7px 44px;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;text-align:center;font-family:sans-serif}
  .s-sent{background:#eff6ff;color:#3b82f6}.s-paid{background:#16a34a;color:#fff;font-size:16px;padding:12px;letter-spacing:4px}.s-cancelled{background:#fef2f2;color:#ef4444}.s-draft{background:#f5f6f8;color:#9ca3af}
  .meta{display:flex;border-top:2px solid #eee;border-bottom:2px solid #eee}
  .mc{flex:1;padding:14px 44px;border-right:1px solid #eee;text-align:center}
  .mc:last-child{border-right:none}
  .ml{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px;font-family:sans-serif}
  .mv{font-size:14px;font-weight:bold;color:#222}
  .addrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #eee}
  .ab{padding:22px 44px}
  .ab:first-child{border-right:1px solid #eee}
  .al{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:${a};margin-bottom:10px;font-family:sans-serif}
  .an{font-size:16px;font-weight:bold;color:#222;line-height:1.3}
  .as{font-size:13px;color:#555;margin-top:3px}
  .ad{font-size:12.5px;color:#777;line-height:1.9;margin-top:8px}
  .ad a{color:#777;text-decoration:none;pointer-events:none}
  .tw{padding:28px 44px 0}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f9f9f9;border-top:1px solid #ddd;border-bottom:1px solid #ddd}
  thead th{padding:11px 14px;font-size:10px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:1.2px;font-family:sans-serif}
  thead th:first-child{text-align:left;padding-left:0}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #eee}
  tbody td{padding:14px 14px;font-size:14px;color:#444}
  tbody td:first-child{padding-left:0;color:#222}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:bold;color:#222}
  .totals{display:flex;justify-content:flex-end;padding:24px 44px 28px}
  .tbox{width:280px;border:1px solid #ddd}
  .tr{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;font-size:13px;border-bottom:1px solid #eee;font-family:sans-serif}
  .tr:last-child{border-bottom:none;background:${a}}
  .tr:last-child span{font-size:15px;font-weight:bold;color:#fff}
  .tl{color:#888}.ta{font-weight:bold;color:#333}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 44px 28px}
  .nb{border:1px solid #ddd;padding:14px 16px}
  .nl{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${a};margin-bottom:8px;font-family:sans-serif}
  .nt{font-size:13px;color:#666;line-height:1.7;white-space:pre-wrap}
  /* bank — centered */
  .bank{margin:0 44px 32px;border:1px solid #ddd}
  .bh{background:${a};padding:10px 20px;text-align:center}
  .bht{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#fff;font-family:sans-serif}
  .bg{display:flex;flex-direction:column}
  .bc{padding:12px 0;border-bottom:1px solid #eee;display:flex;flex-direction:column;align-items:center;text-align:center}
  .bc:last-of-type{border-bottom:none}
  .bclbl{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#bbb;margin-bottom:4px;font-family:sans-serif}
  .bcv{font-size:15px;font-weight:bold;color:#222;font-family:monospace;letter-spacing:1px}
  .bref{padding:10px 20px;background:#f8f8f8;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee;font-family:sans-serif}
  .bref strong{color:${a};font-weight:bold}
  .pay{padding:24px 44px 36px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:2px solid #eee}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;background:#dcfce7;color:#16a34a;font-size:15px;font-weight:bold;padding:14px 32px;font-family:sans-serif;border:2px solid #bbf7d0}
  .foot{overflow:hidden}
  .ft{background:${a};padding:12px 44px;display:flex;align-items:center;gap:20px}
  .fb{font-size:13px;font-weight:bold;color:#fff;font-family:sans-serif}
  .fc{font-size:11px;color:rgba(255,255,255,.7);font-family:sans-serif}
  .fb2{background:#f9f9f9;border-top:1px solid #eee;padding:8px 44px;display:flex;align-items:center;justify-content:space-between}
  .fb2 span{font-size:10px;color:#aaa;font-family:sans-serif;font-style:italic}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.meta{flex-wrap:wrap}.mc{flex:0 0 50%;padding:10px 20px}.addrs{grid-template-columns:1fr}.ab{padding:18px 20px}.ab:first-child{border-right:none;border-bottom:1px solid #eee}.tw{padding:20px 20px 0}.totals{padding:16px 20px 20px}.tbox{width:100%}.notes{grid-template-columns:1fr;padding:0 20px 20px}.bank{margin:0 20px 24px}.pay{padding:20px}}
  `;
}

function minimalStyles(a: string, p: boolean) {
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#f0f0f0"}}
  .w{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${p?"#fff":"#f0f0f0"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#222}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06);overflow:hidden;position:relative}
  /* PAID — small inline badge in header, next to invoice number */
  .hd{padding:36px 52px 28px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #e5e5e5}
  .logo{max-height:44px;max-width:160px;object-fit:contain;display:block}
  .logo-txt{font-size:16px;font-weight:600;color:#111;letter-spacing:-.3px}
  .hd-r{text-align:right}
  .hd-title{font-size:11px;font-weight:600;color:#999;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px}
  .hd-num{font-size:22px;font-weight:300;color:#111;letter-spacing:-.5px}
  .hd-paid-tag{display:inline-block;background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:700;padding:3px 10px;border:1px solid #bbf7d0;letter-spacing:1px;margin-top:6px}
  .accent-line{width:32px;height:2px;background:${a};margin:10px 0 0 auto}
  .status-strip{padding:6px 52px;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-align:center}
  .s-sent{background:#f0f7ff;color:#3b82f6}.s-paid{display:none}.s-cancelled{background:#fff5f5;color:#ef4444}.s-draft{background:#fafafa;color:#aaa}
  .meta{display:flex;border-bottom:1px solid #e5e5e5}
  .mc{flex:1;padding:14px 52px;border-right:1px solid #e5e5e5}
  .mc:last-child{border-right:none}
  .ml{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#bbb;margin-bottom:4px}
  .mv{font-size:13px;font-weight:500;color:#222}
  .addrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e5e5e5}
  .ab{padding:24px 52px}
  .ab:first-child{border-right:1px solid #e5e5e5}
  .al{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin-bottom:10px}
  .an{font-size:14px;font-weight:600;color:#111;line-height:1.4}
  .as{font-size:13px;color:#666;margin-top:2px}
  .ad{font-size:12px;color:#999;line-height:1.9;margin-top:8px}
  .ad a{color:#999;text-decoration:none;pointer-events:none}
  .tw{padding:32px 52px 0}
  table{width:100%;border-collapse:collapse}
  thead tr{border-bottom:1px solid #222}
  thead th{padding:0 0 10px;font-size:9px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:1.5px}
  thead th:first-child{text-align:left}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody td{padding:14px 0;font-size:13.5px;color:#555}
  tbody td:first-child{color:#222}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:500;color:#111}
  .totals{display:flex;justify-content:flex-end;padding:20px 52px 32px}
  .tbox{width:240px}
  .tr{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid #f0f0f0}
  .tr:last-child{border-bottom:none;border-top:1px solid #222;margin-top:8px;padding-top:14px}
  .tr:last-child span{font-size:15px;font-weight:600;color:#111}
  .tl{color:#bbb;font-weight:400}.ta{font-weight:500;color:#444}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 52px 32px}
  .nb{padding:14px 0;border-top:1px solid #e5e5e5}
  .nl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#bbb;margin-bottom:8px}
  .nt{font-size:12.5px;color:#777;line-height:1.7;white-space:pre-wrap}
  /* bank — left-aligned key:value */
  .bank{margin:0 52px 32px;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5}
  .bh{padding:14px 0 10px;border-bottom:1px solid #e5e5e5}
  .bht{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#bbb}
  .bg{display:flex;flex-direction:column;padding:4px 0}
  .bc{display:flex;align-items:baseline;gap:10px;padding:9px 0;border-bottom:1px solid #f0f0f0}
  .bc:last-of-type{border-bottom:none}
  .bclbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#bbb;min-width:130px;flex-shrink:0}
  .bcv{font-size:13px;font-weight:500;color:#222;font-family:monospace}
  .bref{padding:10px 0;font-size:11px;color:#aaa;border-top:1px solid #e5e5e5}
  .bref strong{color:#444;font-weight:600}
  .pay{padding:24px 52px 36px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:1px solid #e5e5e5}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;color:#16a34a;font-size:14px;font-weight:500;padding:12px 24px;border:1px solid #bbf7d0;background:#f0fdf4}
  .foot{padding:16px 52px;border-top:1px solid #e5e5e5;display:flex;align-items:center;justify-content:center;gap:10px}
  .fb{font-size:11px;font-weight:500;color:#aaa}
  .fsep{font-size:11px;color:#ddd}
  .fn{font-size:11px;color:#ccc;font-family:monospace}
  .inv-print-btn{position:fixed;bottom:28px;right:28px;display:inline-flex;align-items:center;gap:8px;background:#111;color:#fff;font-size:13px;font-weight:500;padding:12px 22px;border-radius:6px;border:none;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.15);z-index:999;transition:opacity .15s;font-family:inherit}
  .inv-print-btn:hover{opacity:.8}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.hd{padding:24px}.meta{flex-wrap:wrap}.mc{flex:0 0 50%;padding:10px 24px}.addrs{grid-template-columns:1fr}.ab{padding:18px 24px}.ab:first-child{border-right:none;border-bottom:1px solid #e5e5e5}.tw{padding:24px 24px 0}.totals{padding:16px 24px 24px}.tbox{width:100%}.notes{grid-template-columns:1fr;padding:0 24px 24px}.bank{margin:0 24px 24px}.bc{display:flex}.pay{padding:20px 24px}.foot{padding:12px 24px}}
  `;
}

function corporateStyles(a: string, p: boolean) {
  // Dark navy sidebar + yellow/accent corner block; PAID = corner box turns green
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#c8cdd4"}}
  .w{font-family:'Segoe UI',Arial,sans-serif;background:${p?"#fff":"#c8cdd4"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#1a1e2e}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;box-shadow:0 2px 24px rgba(0,0,0,.13);overflow:hidden;position:relative}
  /* PAID — corner ribbon top-right */
  .paid-corner{position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 110px 110px 0;border-color:transparent #16a34a transparent transparent;z-index:20;pointer-events:none}
  .paid-corner-txt{position:absolute;top:22px;right:4px;color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;transform:rotate(45deg);z-index:21;pointer-events:none;white-space:nowrap}
  /* header */
  .hd{display:flex;align-items:stretch;border-bottom:none}
  .hd-left{flex:1;padding:28px 32px;background:#fff;display:flex;flex-direction:column;justify-content:center}
  .logo{max-height:52px;max-width:180px;object-fit:contain;display:block;margin-bottom:8px}
  .logo-txt{font-size:20px;font-weight:800;color:#1a1e2e;line-height:1.1}
  .logo-sub{font-size:11px;color:#999;margin-top:2px}
  .hd-right{background:${a};min-width:160px;padding:24px 28px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end}
  .hd-right.paid{background:#16a34a}
  .hd-title{font-size:26px;font-weight:900;color:#fff;letter-spacing:2px;line-height:1}
  .hd-paid-lbl{font-size:11px;color:rgba(255,255,255,.7);letter-spacing:2px;text-transform:uppercase;margin-top:6px}
  /* invoice meta table */
  .inv-meta-tbl{width:100%;background:#f7f8fa;border-bottom:3px solid ${a}}
  .inv-meta-tbl td{padding:10px 20px;font-size:12px;font-family:monospace}
  .inv-meta-tbl .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-family:sans-serif;display:block;margin-bottom:2px}
  .inv-meta-tbl .val{font-size:13px;font-weight:700;color:#1a1e2e;font-family:sans-serif}
  .inv-meta-tbl td:not(:first-child){border-left:1px solid #e5e7eb}
  /* addresses */
  .addrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e5e7eb}
  .ab{padding:20px 32px}
  .ab:first-child{border-right:1px solid #e5e7eb}
  .al{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${a};margin-bottom:8px}
  .an{font-size:14px;font-weight:800;color:#1a1e2e}
  .as{font-size:12.5px;color:#555;margin-top:2px}
  .ad{font-size:12px;color:#888;line-height:1.8;margin-top:6px}
  .ad a{color:#888;text-decoration:none;pointer-events:none}
  /* table */
  .tw{padding:24px 32px 0}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#1a1e2e}
  thead th{padding:11px 14px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}
  thead th:first-child{text-align:left}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #f0f1f4}
  tbody tr:nth-child(even){background:#fafbfc}
  tbody td{padding:12px 14px;font-size:13px;color:#444}
  tbody td:first-child{color:#1a1e2e;font-weight:500}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:700;color:#1a1e2e}
  /* totals */
  .totals{display:flex;justify-content:flex-end;padding:20px 32px 24px}
  .tbox{width:280px}
  .tr{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #f0f1f4}
  .tr:last-child{border-bottom:none;border-top:3px solid ${a};margin-top:6px;padding-top:12px}
  .tr:last-child span{font-size:16px;font-weight:900;color:#1a1e2e}
  .tl{color:#999}.ta{font-weight:600;color:#333}
  /* dotted separator */
  .sep{border:none;border-top:2px dotted #ddd;margin:0 32px}
  /* bottom section */
  .bot{display:grid;grid-template-columns:1fr 1fr;padding:20px 32px 24px;gap:20px;border-top:1px solid #eee}
  .bot-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:6px}
  .bot-val{font-size:13px;font-weight:600;color:#1a1e2e;margin-bottom:2px}
  .bot-sub{font-size:12px;color:#888}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 32px 24px}
  .nb{background:#f7f8fa;padding:14px 16px}
  .nl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#999;margin-bottom:6px}
  .nt{font-size:12.5px;color:#666;line-height:1.65;white-space:pre-wrap}
  /* bank — 2-col grid */
  .bank{margin:0 32px 24px;border:1px solid #e5e7eb}
  .bh{background:#1a1e2e;padding:10px 20px}
  .bht{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#fff}
  .bg{display:grid;grid-template-columns:1fr 1fr}
  .bc{padding:12px 20px;border-bottom:1px solid #f0f1f4;border-right:1px solid #f0f1f4}
  .bc:nth-child(even){border-right:none}
  .bc:nth-last-child(-n+2){border-bottom:none}
  .bcf{grid-column:1/-1;border-right:none}
  .bclbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#bbb;margin-bottom:4px}
  .bcv{font-size:13.5px;font-weight:700;color:#1a1e2e;font-family:monospace}
  .bref{padding:10px 20px;background:#f7f8fa;text-align:center;font-size:12px;color:#999;border-top:1px solid #e5e7eb}
  .bref strong{color:#1a1e2e;font-weight:700}
  .pay{padding:20px 32px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:1px solid #eee}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;background:#dcfce7;color:#16a34a;font-size:15px;font-weight:800;padding:14px 32px}
  /* footer */
  .foot{background:#1a1e2e;padding:14px 32px;display:flex;align-items:center;justify-content:space-between}
  .fb{font-size:11px;font-weight:700;color:rgba(255,255,255,.6)}
  .fn{font-size:11px;color:rgba(255,255,255,.3);font-family:monospace}
  .inv-print-btn{position:fixed;bottom:28px;right:28px;display:inline-flex;align-items:center;gap:8px;background:#1a1e2e;color:#fff;font-size:14px;font-weight:700;padding:13px 24px;border-radius:6px;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:999;transition:opacity .15s;font-family:inherit}
  .inv-print-btn:hover{opacity:.85}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.hd{flex-direction:column}.hd-right{min-width:auto;align-items:flex-start;padding:16px 24px}.addrs{grid-template-columns:1fr}.ab{padding:16px 24px}.ab:first-child{border-right:none;border-bottom:1px solid #e5e7eb}.tw{padding:16px 24px 0}.totals{padding:12px 24px 20px}.tbox{width:100%}.bank{margin:0 24px 20px}.bg{grid-template-columns:1fr}.bc{border-right:none!important}.pay{padding:16px 24px}.notes{grid-template-columns:1fr;padding:0 24px 20px}.bot{grid-template-columns:1fr;padding:16px 24px}.foot{padding:12px 24px}}
  `;
}

function professionalStyles(a: string, p: boolean) {
  // Screenshot 1 inspired: company left, big INVOICE right, grey row headers, stamp in totals
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#dde0e5"}}
  .w{font-family:Arial,Helvetica,sans-serif;background:${p?"#fff":"#dde0e5"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#333}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;box-shadow:0 1px 10px rgba(0,0,0,.08);overflow:hidden;position:relative}
  /* PAID — rubber stamp in bottom-right of totals */
  .paid-stamp-totals{display:inline-block;border:4px solid #16a34a;color:#16a34a;font-size:18px;font-weight:900;padding:6px 18px;letter-spacing:3px;text-transform:uppercase;transform:rotate(-8deg);margin-top:8px;font-family:Arial,sans-serif;border-radius:4px}
  /* header */
  .hd{padding:28px 40px 20px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #e0e0e0}
  .hd-left{}
  .logo{max-height:52px;max-width:180px;object-fit:contain;display:block;margin-bottom:8px}
  .logo-txt{font-size:16px;font-weight:bold;color:#333}
  .co-addr{font-size:11.5px;color:#777;line-height:1.9;margin-top:4px}
  .hd-right{text-align:right}
  .hd-title{font-size:38px;font-weight:900;color:${a};letter-spacing:2px;line-height:1}
  /* inv# + date table top-right */
  .inv-tbl{margin-top:12px;border:1px solid #ccc;border-collapse:collapse;margin-left:auto}
  .inv-tbl th{background:${a};color:#fff;font-size:10px;font-weight:bold;padding:6px 18px;text-transform:uppercase;letter-spacing:1px;text-align:center;border:1px solid rgba(255,255,255,.2)}
  .inv-tbl td{padding:7px 18px;font-size:13px;font-weight:bold;color:#333;text-align:center;border:1px solid #ccc;font-family:monospace}
  /* TO section */
  .to-section{margin:20px 40px 0;background:#e8eaf0;padding:10px 16px 4px}
  .to-lbl{font-size:10px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .to-name{font-size:14px;font-weight:bold;color:#222;margin-bottom:2px}
  .to-detail{font-size:12.5px;color:#666;line-height:1.7;padding-bottom:8px}
  .to-detail a{color:#666;text-decoration:none;pointer-events:none}
  /* from */
  .from-inline{font-size:11px;color:#888;padding:8px 40px;border-bottom:1px solid #eee;display:flex;gap:24px}
  .from-inline strong{color:#555;font-weight:bold}
  /* table */
  .tw{padding:20px 40px 0}
  .tw-lbl{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#fff;background:${a};padding:8px 0 8px 0;text-align:center;margin-bottom:0}
  table{width:100%;border-collapse:collapse;border:1px solid #ccc}
  thead tr{background:#e8eaf0}
  thead th{padding:9px 12px;font-size:10px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:1px;border:1px solid #ccc}
  thead th:first-child{text-align:left}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #e0e0e0}
  tbody td{padding:11px 12px;font-size:13px;color:#444;border-right:1px solid #eee}
  tbody td:first-child{color:#222}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:bold;border-right:1px solid #ccc}
  /* totals */
  .totals{display:flex;justify-content:space-between;align-items:flex-end;padding:16px 40px 0}
  .thank-you{font-style:italic;font-size:12.5px;color:#777;max-width:280px;line-height:1.6}
  .tbox{width:260px;border:1px solid #ccc}
  .tr{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;font-size:13px;border-bottom:1px solid #e0e0e0}
  .tr:last-child{border-bottom:none;background:${a}}
  .tr:last-child span{font-size:14px;font-weight:bold;color:#fff}
  .tl{color:#777}.ta{font-weight:bold;color:#333}
  .paid-in-full{text-align:right;padding:0 40px 4px;display:flex;justify-content:flex-end}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px 40px}
  .nb{border-top:2px solid ${a};padding-top:10px}
  .nl{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${a};margin-bottom:6px}
  .nt{font-size:12.5px;color:#666;line-height:1.65;white-space:pre-wrap}
  /* bank */
  .bank{margin:0 40px 24px;border:2px solid #e8eaf0}
  .bh{background:${a};padding:8px 16px}
  .bht{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#fff}
  .bg{display:grid;grid-template-columns:1fr 1fr}
  .bc{padding:12px 16px;border-bottom:1px solid #e0e0e0;border-right:1px solid #e0e0e0}
  .bc:nth-child(even){border-right:none}
  .bc:nth-last-child(-n+2){border-bottom:none}
  .bcf{grid-column:1/-1;border-right:none}
  .bclbl{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-bottom:4px}
  .bcv{font-size:13px;font-weight:bold;color:#222;font-family:monospace}
  .bref{padding:8px 16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888;border-top:1px solid #e0e0e0}
  .bref strong{color:#333;font-weight:bold}
  .pay{padding:16px 40px 24px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:2px solid #e8eaf0}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;background:#dcfce7;color:#16a34a;font-size:15px;font-weight:bold;padding:12px 28px;border:2px solid #bbf7d0}
  /* footer */
  .foot{background:#f5f5f5;border-top:2px solid #e0e0e0;padding:12px 40px;display:flex;align-items:center;justify-content:space-between}
  .fb{font-size:11px;font-weight:bold;color:#888}
  .fn{font-size:11px;color:#bbb;font-family:monospace}
  .inv-print-btn{position:fixed;bottom:28px;right:28px;display:inline-flex;align-items:center;gap:8px;background:#333;color:#fff;font-size:13px;font-weight:bold;padding:12px 22px;border-radius:4px;border:none;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.18);z-index:999;transition:opacity .15s;font-family:Arial,sans-serif}
  .inv-print-btn:hover{opacity:.85}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.hd{flex-direction:column;padding:20px}.hd-right{text-align:left;margin-top:16px}.inv-tbl{margin-left:0}.to-section{margin:16px 20px 0}.from-inline{padding:8px 20px;flex-wrap:wrap;gap:10px}.tw{padding:16px 20px 0}.totals{flex-direction:column;padding:12px 20px 0;gap:12px}.tbox{width:100%}.paid-in-full{padding:0 20px 4px}.notes{grid-template-columns:1fr;padding:12px 20px}.bank{margin:0 20px 20px}.bg{grid-template-columns:1fr}.bc{border-right:none!important}.pay{padding:16px 20px}.foot{padding:10px 20px}}
  `;
}

function squareStyles(a: string, p: boolean) {
  // Screenshot 3 inspired: thick line separator, big biz name, 3-col info, PAID as green amount
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${p?"#fff":"#e2e5e8"}}
  .w{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;background:${p?"#fff":"#e2e5e8"};min-height:100vh;padding:${p?"0":"40px 16px 80px"};color:#1a1a1a}
  .pg{max-width:840px;margin:0 auto}
  .card{background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.09);overflow:hidden;position:relative}
  /* PAID — green diagonal watermark but top-left positioned */
  .paid-stamp{position:absolute;top:120px;left:40px;font-size:64px;font-weight:900;color:rgba(22,163,74,.1);border:6px solid rgba(22,163,74,.1);border-radius:8px;padding:4px 20px;letter-spacing:8px;text-transform:uppercase;pointer-events:none;user-select:none;white-space:nowrap;z-index:10;transform:rotate(-15deg)}
  /* header */
  .hd{padding:28px 40px 20px;display:flex;align-items:flex-start;justify-content:space-between}
  .hd-left{display:flex;align-items:flex-start;gap:14px}
  .logo-box{width:52px;height:52px;border-radius:8px;background:#f0f2f5;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
  .logo{width:52px;height:52px;object-fit:cover;display:block}
  .logo-txt-box{}
  .logo-txt{font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.2}
  .logo-addr{font-size:11.5px;color:#999;line-height:1.8;margin-top:2px}
  .hd-right{text-align:right}
  .hd-inv{font-size:13px;font-weight:600;color:#1a1a1a}
  .hd-lbl{font-size:10px;color:#aaa;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
  .hd-date{font-size:13px;font-weight:500;color:#555;margin-top:8px}
  /* thick accent line */
  .divider{height:3px;background:${a};margin:0}
  /* message/notes section */
  .msg-section{padding:28px 40px 8px}
  .biz-name{font-size:26px;font-weight:300;color:#1a1a1a;margin-bottom:6px;letter-spacing:-.5px}
  .msg-txt{font-size:13px;color:#888;line-height:1.6;max-width:480px}
  /* 3-column info */
  .info3{display:grid;grid-template-columns:1fr 1fr 1fr;padding:20px 40px;gap:24px;border-bottom:1px solid #eee}
  .il{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;margin-bottom:8px}
  .iv{font-size:13px;color:#1a1a1a;line-height:1.75}
  .iv strong{font-weight:700;display:block}
  .iv-sub{font-size:12px;color:#888}
  /* table */
  .tw{padding:20px 40px 0}
  table{width:100%;border-collapse:collapse}
  thead tr{border-bottom:2px solid #1a1a1a}
  thead th{padding:0 0 10px;font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1.5px}
  thead th:first-child{text-align:left}
  thead th:not(:first-child){text-align:right}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody td{padding:14px 0;font-size:13.5px;color:#555}
  tbody td:first-child{color:#1a1a1a}
  tbody td:not(:first-child){text-align:right}
  tbody td:last-child{font-weight:600;color:#1a1a1a}
  /* totals */
  .totals-outer{display:flex;justify-content:flex-end;padding:16px 40px 0}
  .tbox{width:260px}
  .tr{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #f5f5f5}
  .tr:last-child{border-bottom:none;border-top:2px solid #1a1a1a;margin-top:6px;padding-top:12px;font-weight:700}
  .tr:last-child span{font-size:16px;font-weight:700;color:#1a1a1a}
  .tr:last-child span.paid-amt{color:#16a34a}
  .tl{color:#aaa}.ta{color:#555;font-weight:500}
  /* notes */
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 40px 24px}
  .nb{padding:14px 0;border-top:1px solid #eee}
  .nl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;margin-bottom:8px}
  .nt{font-size:12.5px;color:#777;line-height:1.7;white-space:pre-wrap}
  /* bank */
  .bank{margin:0 40px 24px;border-top:1px solid #eee}
  .bh{padding:14px 0 10px;border-bottom:1px solid #eee}
  .bht{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#aaa}
  .bg{display:grid;grid-template-columns:1fr 1fr}
  .bc{padding:12px 0;border-bottom:1px solid #f5f5f5;border-right:1px solid #f5f5f5;padding-right:20px}
  .bc:nth-child(even){border-right:none;padding-left:20px;padding-right:0}
  .bc:nth-last-child(-n+2){border-bottom:none}
  .bcf{grid-column:1/-1;border-right:none;padding-right:0}
  .bclbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ccc;margin-bottom:4px}
  .bcv{font-size:13px;font-weight:600;color:#1a1a1a;font-family:monospace}
  .bref{padding:10px 0;font-size:11px;color:#aaa;border-top:1px solid #eee}
  .bref strong{color:#555;font-weight:700}
  .pay{padding:16px 40px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;border-top:1px solid #eee}
  .paid-badge{display:inline-flex;align-items:center;gap:10px;color:#16a34a;font-size:14px;font-weight:600;padding:12px 24px;border:1px solid #bbf7d0;background:#f0fdf4}
  /* footer */
  .foot{padding:14px 40px;background:#fafafa;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
  .fb{font-size:11px;font-weight:500;color:#aaa}
  .fn{font-size:11px;color:#ccc;font-family:monospace}
  .inv-print-btn{position:fixed;bottom:28px;right:28px;display:inline-flex;align-items:center;gap:8px;background:#1a1a1a;color:#fff;font-size:13px;font-weight:500;padding:12px 22px;border-radius:6px;border:none;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.15);z-index:999;transition:opacity .15s;font-family:inherit}
  .inv-print-btn:hover{opacity:.8}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff}.w{background:#fff;padding:0}.card{box-shadow:none}.inv-print-btn{display:none!important}}
  @media(max-width:600px){.w{padding:0 0 80px}.hd{padding:20px;flex-direction:column;gap:16px}.hd-right{text-align:left}.info3{grid-template-columns:1fr;padding:16px 20px;gap:16px}.tw{padding:16px 20px 0}.totals-outer{padding:12px 20px 0}.tbox{width:100%}.notes{grid-template-columns:1fr;padding:0 20px 20px}.bank{margin:0 20px 20px}.bg{grid-template-columns:1fr}.bc{border-right:none!important;padding-left:0!important;padding-right:0!important}.pay{padding:16px 20px}.foot{padding:10px 20px}}
  `;
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceNumber: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { invoiceNumber } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  if (!invoice) notFound();

  const brand = invoice.brandId
    ? await prisma.brand.findUnique({ where: { id: invoice.brandId } })
    : null;

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];
  const sym = CURRENCY_SYMBOLS[invoice.currency] ?? "£";
  const isPaid = invoice.status === "paid";
  const accent = (brand as { brandColor?: string | null })?.brandColor ?? "#1a1a2e";
  const template = (brand as { invoiceTemplate?: string | null })?.invoiceTemplate ?? "modern";

  const inv = invoice as typeof invoice & {
    paymentMethod?: string;
    showBankName?: boolean;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankSortCode?: string | null;
    bankIban?: string | null;
    bankSwift?: string | null;
    clientCompany?: string | null;
  };

  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const styles =
    template === "classic"       ? classicStyles(accent, isPreview) :
    template === "minimal"       ? minimalStyles(accent, isPreview) :
    template === "corporate"     ? corporateStyles(accent, isPreview) :
    template === "professional"  ? professionalStyles(accent, isPreview) :
    template === "square"        ? squareStyles(accent, isPreview) :
    modernStyles(accent, isPreview);

  const stripeSection = invoice.stripeAccountId && !isPaid && invoice.status !== "cancelled" ? (
    <div id="pay-section" className="pay">
      <EmbeddedCheckoutButton invoiceId={invoice.id} total={Number(invoice.total).toFixed(2)} sym={sym} currency={invoice.currency} invoiceNumber={invoice.invoiceNumber} />
    </div>
  ) : null;

  /* shared bank helpers — each template's HTML tweaked per design */
  function bankGrid(centered?: boolean, listStyle?: boolean) {
    if (centered) return (
      <div className="bg">
        {inv.showBankName !== false && inv.bankName && <div className="bc"><div className="bclbl">Bank</div><div className="bcv">{inv.bankName}</div></div>}
        {inv.bankAccountName && <div className="bc"><div className="bclbl">Account Name</div><div className="bcv">{inv.bankAccountName}</div></div>}
        {inv.bankAccountNumber && <div className="bc"><div className="bclbl">Account Number</div><div className="bcv">{inv.bankAccountNumber}</div></div>}
        {inv.bankSortCode && <div className="bc"><div className="bclbl">Sort Code</div><div className="bcv">{inv.bankSortCode}</div></div>}
        {inv.bankIban && <div className="bc"><div className="bclbl">IBAN</div><div className="bcv">{inv.bankIban}</div></div>}
        {inv.bankSwift && <div className="bc"><div className="bclbl">SWIFT / BIC</div><div className="bcv">{inv.bankSwift}</div></div>}
      </div>
    );
    if (listStyle) return (
      <div className="bg">
        {inv.showBankName !== false && inv.bankName && <div className="bc"><span className="bclbl">Bank</span><span className="bcv">{inv.bankName}</span></div>}
        {inv.bankAccountName && <div className="bc"><span className="bclbl">Account Name</span><span className="bcv">{inv.bankAccountName}</span></div>}
        {inv.bankAccountNumber && <div className="bc"><span className="bclbl">Account No.</span><span className="bcv">{inv.bankAccountNumber}</span></div>}
        {inv.bankSortCode && <div className="bc"><span className="bclbl">Sort Code</span><span className="bcv">{inv.bankSortCode}</span></div>}
        {inv.bankIban && <div className="bc"><span className="bclbl">IBAN</span><span className="bcv">{inv.bankIban}</span></div>}
        {inv.bankSwift && <div className="bc"><span className="bclbl">SWIFT / BIC</span><span className="bcv">{inv.bankSwift}</span></div>}
      </div>
    );
    // grid (default)
    return (
      <div className="bg">
        {inv.showBankName !== false && inv.bankName && <div className="bc"><div className="bclbl">Bank</div><div className="bcv">{inv.bankName}</div></div>}
        {inv.bankAccountName && <div className="bc"><div className="bclbl">Account Name</div><div className="bcv">{inv.bankAccountName}</div></div>}
        {inv.bankAccountNumber && <div className="bc"><div className="bclbl">Account Number</div><div className="bcv">{inv.bankAccountNumber}</div></div>}
        {inv.bankSortCode && <div className="bc"><div className="bclbl">Sort Code</div><div className="bcv">{inv.bankSortCode}</div></div>}
        {inv.bankIban && <div className="bc bcf"><div className="bclbl">IBAN</div><div className="bcv">{inv.bankIban}</div></div>}
        {inv.bankSwift && <div className="bc"><div className="bclbl">SWIFT / BIC</div><div className="bcv">{inv.bankSwift}</div></div>}
      </div>
    );
  }

  // Bank section always renders (even when paid) so client always has details
  function bankSection(opts?: { centered?: boolean; listStyle?: boolean; refText?: string }) {
    if (inv.paymentMethod !== "bank_transfer") return invoice!.status !== "cancelled" ? stripeSection : null;
    return (
      <div className="bank">
        <div className="bh"><span className="bht">Bank Transfer Details</span></div>
        {bankGrid(opts?.centered, opts?.listStyle)}
        <div className="bref">Please use <strong>{invoice!.invoiceNumber}</strong> as your {opts?.refText ?? "payment reference"}</div>
      </div>
    );
  }

  const dateStr = new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  function itemRows() {
    return items.map((item, i) => (
      <tr key={i}>
        <td>{item.description}</td>
        <td style={{ textAlign: "right" }}>{item.quantity}</td>
        <td style={{ textAlign: "right" }}>{sym}{Number(item.unitPrice).toFixed(2)}</td>
        <td style={{ textAlign: "right" }}>{sym}{(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    ));
  }

  function totalsRows() {
    const inv2 = invoice!;
    return (<>
      <div className="tr"><span className="tl">Subtotal</span><span className="ta">{sym}{Number(inv2.subtotal).toFixed(2)}</span></div>
      {Number(inv2.discountAmount) > 0 && <div className="tr"><span className="tl">Discount</span><span className="ta" style={{ color: "#ef4444" }}>−{sym}{Number(inv2.discountAmount).toFixed(2)}</span></div>}
      {inv2.taxPercent && Number(inv2.taxPercent) > 0 && <div className="tr"><span className="tl">Tax ({Number(inv2.taxPercent)}%)</span><span className="ta">{sym}{Number(inv2.taxAmount).toFixed(2)}</span></div>}
    </>);
  }

  /* ── MODERN ── PAID: diagonal watermark center */
  if (template === "modern") {
    return (
      <div className="w">
        <style>{styles}</style>
        <div className="pg"><div className="card">
          {isPaid && <div className="paid-stamp">PAID</div>}
          <div className="hd">
            <div>{brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="logo" /> : <div className="logo-txt">{brand?.name ?? "—"}</div>}</div>
            <div className="hd-r">
              <div className="hd-title">INVOICE</div>
              <div className="hd-num">{invoice.invoiceNumber}</div>
              <span className="accent-bar"></span>
            </div>
          </div>
          {invoice.status !== "draft" && (
            <div className={`status-strip s-${invoice.status}`}>
              {isPaid && `✓ PAID${paidDate ? "  ·  " + paidDate : ""}`}
              {invoice.status === "sent" && "⏳  AWAITING PAYMENT"}
              {invoice.status === "cancelled" && "✕  CANCELLED"}
            </div>
          )}
          <div className="meta">
            <div className="mc"><div className="ml">Invoice Date</div><div className="mv">{dateStr}</div></div>
            {dueDateStr && <div className="mc"><div className="ml">Due Date</div><div className="mv">{dueDateStr}</div></div>}
            <div className="mc"><div className="ml">Total Due</div><div className="mv">{sym}{Number(invoice.total).toFixed(2)}</div></div>
            <div className="mc"><div className="ml">Currency</div><div className="mv">{invoice.currency.toUpperCase()}</div></div>
          </div>
          <div className="addrs">
            <div className="ab">
              <div className="al">From</div>
              <div className="an">{brand?.name ?? "—"}</div>
              <div className="ad">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website}>{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="ab">
              <div className="al">Bill To</div>
              {inv.clientCompany && <div className="an">{inv.clientCompany}</div>}
              <div className={inv.clientCompany ? "as" : "an"}>{invoice.clientName}</div>
              <div className="ad">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>
          {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
            <div style={{ padding: "0 44px 4px", display: "flex", justifyContent: "flex-end" }}>
              <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
            </div>
          )}
          <div className="tw">
            <table><thead><tr><th>Description</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Rate</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
            <tbody>{itemRows()}</tbody></table>
          </div>
          <div className="totals"><div className="tbox">
            {totalsRows()}
            <div className="tr"><span>Total</span><span>{sym}{Number(invoice.total).toFixed(2)}</span></div>
          </div></div>
          {(invoice.notes || invoice.terms) && (
            <div className="notes">
              {invoice.notes && <div className="nb"><div className="nl">Notes</div><div className="nt">{invoice.notes}</div></div>}
              {invoice.terms && <div className="nb"><div className="nl">Terms</div><div className="nt">{invoice.terms}</div></div>}
            </div>
          )}
          {/* Modern: bank always visible; paid shown via diagonal watermark + status strip */}
          {bankSection()}
          <div className="foot"><span className="fb">{brand?.name ?? "—"}</span><span className="fn">{invoice.invoiceNumber}</span></div>
        </div></div>
        {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} />}
      </div>
    );
  }

  /* ── CLASSIC ── PAID: status strip becomes big green banner */
  if (template === "classic") {
    return (
      <div className="w">
        <style>{styles}</style>
        <div className="pg"><div className="card">
          <div className="hd">
            {brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="logo" /> : <div className="logo-txt">{brand?.name ?? "—"}</div>}
            <div className="hd-title">Invoice</div>
            <div className="hd-num">{invoice.invoiceNumber}</div>
          </div>
          {isPaid ? (
            <div className="paid-banner">✓ PAID{paidDate ? "  ·  " + paidDate : ""}</div>
          ) : invoice.status !== "draft" && (
            <div className={`status-strip s-${invoice.status}`}>
              {invoice.status === "sent" && "⏳  AWAITING PAYMENT"}
              {invoice.status === "cancelled" && "✕  CANCELLED"}
            </div>
          )}
          <div className="meta">
            <div className="mc"><div className="ml">Invoice Date</div><div className="mv">{dateStr}</div></div>
            {dueDateStr && <div className="mc"><div className="ml">Due Date</div><div className="mv">{dueDateStr}</div></div>}
            <div className="mc"><div className="ml">Total Due</div><div className="mv">{sym}{Number(invoice.total).toFixed(2)}</div></div>
            <div className="mc"><div className="ml">Currency</div><div className="mv">{invoice.currency.toUpperCase()}</div></div>
          </div>
          <div className="addrs">
            <div className="ab">
              <div className="al">From</div>
              <div className="an">{brand?.name ?? "—"}</div>
              <div className="ad">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website}>{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="ab">
              <div className="al">Bill To</div>
              {inv.clientCompany && <div className="an">{inv.clientCompany}</div>}
              <div className={inv.clientCompany ? "as" : "an"}>{invoice.clientName}</div>
              <div className="ad">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>
          <div className="tw">
            <table><thead><tr><th>Description</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Rate</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
            <tbody>{itemRows()}</tbody></table>
          </div>
          <div className="totals"><div className="tbox">
            {totalsRows()}
            <div className="tr"><span>Total</span><span>{sym}{Number(invoice.total).toFixed(2)}</span></div>
          </div></div>
          {(invoice.notes || invoice.terms) && (
            <div className="notes">
              {invoice.notes && <div className="nb"><div className="nl">Notes</div><div className="nt">{invoice.notes}</div></div>}
              {invoice.terms && <div className="nb"><div className="nl">Terms</div><div className="nt">{invoice.terms}</div></div>}
            </div>
          )}
          {/* Classic: bank always visible; paid shown via green banner at top */}
          {bankSection({ centered: true })}
          <div className="foot">
            <div className="ft">
              <span className="fb">{brand?.name ?? "—"}</span>
              {brand?.email && <span className="fc">{brand.email}</span>}
              {brand?.website && <span className="fc">{brand.website.replace(/^https?:\/\//, "")}</span>}
              {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} inside />}
            </div>
            <div className="fb2"><span>{invoice.invoiceNumber}</span><span>Thank you for your business</span></div>
          </div>
        </div></div>
      </div>
    );
  }

  /* ── MINIMAL ── PAID: small green tag inline in header */
  if (template === "minimal") {
    return (
      <div className="w">
        <style>{styles}</style>
        <div className="pg"><div className="card">
          <div className="hd">
            <div>{brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="logo" /> : <div className="logo-txt">{brand?.name ?? "—"}</div>}</div>
            <div className="hd-r">
              <div className="hd-title">Invoice</div>
              <div className="hd-num">{invoice.invoiceNumber}</div>
              {isPaid ? <div className="hd-paid-tag">✓ paid{paidDate ? " · " + paidDate : ""}</div> : <div className="accent-line"></div>}
            </div>
          </div>
          {invoice.status !== "draft" && !isPaid && (
            <div className={`status-strip s-${invoice.status}`}>
              {invoice.status === "sent" && "awaiting payment"}
              {invoice.status === "cancelled" && "cancelled"}
            </div>
          )}
          <div className="meta">
            <div className="mc"><div className="ml">Date</div><div className="mv">{dateStr}</div></div>
            {dueDateStr && <div className="mc"><div className="ml">Due</div><div className="mv">{dueDateStr}</div></div>}
            <div className="mc"><div className="ml">Amount</div><div className="mv">{sym}{Number(invoice.total).toFixed(2)}</div></div>
            <div className="mc"><div className="ml">Currency</div><div className="mv">{invoice.currency.toUpperCase()}</div></div>
          </div>
          <div className="addrs">
            <div className="ab">
              <div className="al">From</div>
              <div className="an">{brand?.name ?? "—"}</div>
              <div className="ad">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website}>{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="ab">
              <div className="al">Bill To</div>
              {inv.clientCompany && <div className="an">{inv.clientCompany}</div>}
              <div className={inv.clientCompany ? "as" : "an"}>{invoice.clientName}</div>
              <div className="ad">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>
          <div className="tw">
            <table><thead><tr><th>Description</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Rate</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
            <tbody>{itemRows()}</tbody></table>
          </div>
          <div className="totals"><div className="tbox">
            {totalsRows()}
            <div className="tr"><span>Total</span><span>{sym}{Number(invoice.total).toFixed(2)}</span></div>
          </div></div>
          {(invoice.notes || invoice.terms) && (
            <div className="notes">
              {invoice.notes && <div className="nb"><div className="nl">Notes</div><div className="nt">{invoice.notes}</div></div>}
              {invoice.terms && <div className="nb"><div className="nl">Terms</div><div className="nt">{invoice.terms}</div></div>}
            </div>
          )}
          {/* Minimal: bank always visible; paid shown via small tag in header */}
          {bankSection({ listStyle: true, refText: "reference" })}
          <div className="foot"><span className="fb">{brand?.name ?? "—"}</span><span className="fsep">·</span><span className="fn">{invoice.invoiceNumber}</span></div>
        </div></div>
        {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} />}
      </div>
    );
  }

  /* ── CORPORATE ── PAID: top-right corner triangle ribbon */
  if (template === "corporate") {
    return (
      <div className="w">
        <style>{styles}</style>
        <div className="pg"><div className="card">
          {isPaid && <><div className="paid-corner"></div><div className="paid-corner-txt">PAID</div></>}
          <div className="hd">
            <div className="hd-left">
              {brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="logo" /> : <div className="logo-txt">{brand?.name ?? "—"}</div>}
              {brand?.name && brand?.logoUrl && <div className="logo-sub">{brand.name}</div>}
            </div>
            <div className={`hd-right${isPaid ? " paid" : ""}`}>
              <div className="hd-title">{isPaid ? "PAID" : "INVOICE"}</div>
              <div className="hd-paid-lbl">{isPaid ? (paidDate ?? "") : invoice.invoiceNumber}</div>
            </div>
          </div>
          <table className="inv-meta-tbl">
            <tbody><tr>
              <td><span className="lbl">Invoice #</span><span className="val">{invoice.invoiceNumber}</span></td>
              <td><span className="lbl">Invoice Date</span><span className="val">{dateStr}</span></td>
              {dueDateStr && <td><span className="lbl">Due Date</span><span className="val">{dueDateStr}</span></td>}
              <td><span className="lbl">Amount</span><span className="val">{sym}{Number(invoice.total).toFixed(2)}</span></td>
            </tr></tbody>
          </table>
          <div className="addrs">
            <div className="ab">
              <div className="al">From</div>
              <div className="an">{brand?.name ?? "—"}</div>
              <div className="ad">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website}>{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="ab">
              <div className="al">Bill To</div>
              {inv.clientCompany && <div className="an">{inv.clientCompany}</div>}
              <div className={inv.clientCompany ? "as" : "an"}>{invoice.clientName}</div>
              <div className="ad">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>
          {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
            <div style={{ padding: "0 32px 4px", display: "flex", justifyContent: "flex-end" }}>
              <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
            </div>
          )}
          <div className="tw">
            <table><thead><tr><th>Description</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Rate</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
            <tbody>{itemRows()}</tbody></table>
          </div>
          <div className="totals"><div className="tbox">
            {totalsRows()}
            <div className="tr"><span>Total</span><span>{sym}{Number(invoice.total).toFixed(2)}</span></div>
          </div></div>
          {invoice.status === "cancelled" && <div style={{ textAlign: "center", padding: "8px", color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>CANCELLED</div>}
          {(invoice.notes || invoice.terms) && (
            <div className="notes">
              {invoice.notes && <div className="nb"><div className="nl">Notes</div><div className="nt">{invoice.notes}</div></div>}
              {invoice.terms && <div className="nb"><div className="nl">Terms</div><div className="nt">{invoice.terms}</div></div>}
            </div>
          )}
          {/* Corporate: bank always visible; paid shown via corner ribbon + green header block */}
          {bankSection()}
          <div className="foot">
            <span className="fb">{brand?.name ?? "—"}</span>
            {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} inside />}
            <span className="fn">{invoice.invoiceNumber}</span>
          </div>
        </div></div>
      </div>
    );
  }

  /* ── PROFESSIONAL ── PAID: rubber stamp in totals section */
  if (template === "professional") {
    return (
      <div className="w">
        <style>{styles}</style>
        <div className="pg"><div className="card">
          <div className="hd">
            <div className="hd-left">
              {brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="logo" /> : <div className="logo-txt">{brand?.name ?? "—"}</div>}
              <div className="co-addr">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div>{brand.email}</div>}
              </div>
            </div>
            <div className="hd-right">
              <div className="hd-title">INVOICE</div>
              <table className="inv-tbl">
                <thead><tr><th>Invoice #</th><th>Date</th></tr></thead>
                <tbody><tr><td>{invoice.invoiceNumber}</td><td>{dateStr}</td></tr></tbody>
              </table>
            </div>
          </div>
          <div className="to-section">
            <div className="to-lbl">To</div>
            {inv.clientCompany && <div className="to-name">{inv.clientCompany}</div>}
            <div className={inv.clientCompany ? "to-detail" : "to-name"}>{invoice.clientName}</div>
            <div className="to-detail">
              {invoice.clientEmail && <div>{invoice.clientEmail}</div>}
              {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
              {invoice.clientAddress && <div style={{ whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
            </div>
          </div>
          {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
            <div style={{ padding: "8px 40px 0", display: "flex", justifyContent: "flex-end" }}>
              <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
            </div>
          )}
          <div className="tw">
            <div className="tw-lbl" style={{ background: accent, padding: "8px", textAlign: "center", color: "#fff", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>Itemized Costs</div>
            <table><thead><tr><th>Description</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Unit Price</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
            <tbody>{itemRows()}</tbody></table>
          </div>
          <div className="totals">
            <div className="thank-you">
              <em>Thank you for your business!</em>
              {invoice.notes && <div style={{ marginTop: "8px", fontSize: "12px", color: "#888" }}>{invoice.notes}</div>}
            </div>
            <div className="tbox">
              {totalsRows()}
              <div className="tr"><span style={{ fontWeight: "bold" }}>Total Invoice</span><span>{sym}{Number(invoice.total).toFixed(2)}</span></div>
            </div>
          </div>
          {isPaid && (
            <div className="paid-in-full">
              <div className="paid-stamp-totals">✓ PAID IN FULL{paidDate ? " · " + paidDate : ""}</div>
            </div>
          )}
          {invoice.status === "cancelled" && <div style={{ textAlign: "center", padding: "8px", color: "#ef4444", fontWeight: "bold" }}>CANCELLED</div>}
          {invoice.terms && (
            <div className="notes">
              <div className="nb"><div className="nl">Terms &amp; Conditions</div><div className="nt">{invoice.terms}</div></div>
            </div>
          )}
          {/* Professional: bank always visible; paid shown via rubber stamp above */}
          {bankSection()}
          <div className="foot"><span className="fb">{brand?.name ?? "—"}</span><span className="fn">{invoice.invoiceNumber}</span></div>
        </div></div>
        {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} />}
      </div>
    );
  }

  /* ── SQUARE ── PAID: green amount text + top-left watermark */
  return (
    <div className="w">
      <style>{squareStyles(accent, isPreview)}</style>
      <div className="pg"><div className="card">
        {isPaid && <div className="paid-stamp">PAID</div>}
        <div className="hd">
          <div className="hd-left">
            <div className="logo-box">
              {brand?.logoUrl
                ? <img src={brand.logoUrl} alt={brand.name} className="logo" />
                : <svg width="28" height="28" fill="none" stroke="#999" viewBox="0 0 24 24" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
            </div>
            <div className="logo-txt-box">
              <div className="logo-txt">{brand?.name ?? "—"}</div>
              <div className="logo-addr">
                {brand?.address?.split("\n")[0]}
                {brand?.website && <div>{brand.website.replace(/^https?:\/\//, "")}</div>}
              </div>
            </div>
          </div>
          <div className="hd-right">
            <div className="hd-lbl">Invoice</div>
            <div className="hd-inv">{invoice.invoiceNumber}</div>
            <div className="hd-date" style={{ marginTop: "10px" }}>
              <div className="hd-lbl">Issue date</div>
              <div style={{ fontSize: "13px", color: "#555" }}>{dateStr}</div>
            </div>
          </div>
        </div>
        <div className="divider"></div>
        <div className="msg-section">
          <div className="biz-name">{brand?.name ?? "—"}</div>
          {invoice.notes && <div className="msg-txt">{invoice.notes}</div>}
        </div>
        <div className="info3">
          <div>
            <div className="il">Bill To</div>
            <div className="iv">
              {inv.clientCompany && <strong>{inv.clientCompany}</strong>}
              <div>{invoice.clientName}</div>
              {invoice.clientEmail && <div className="iv-sub">{invoice.clientEmail}</div>}
              {invoice.clientPhone && <div className="iv-sub">{invoice.clientPhone}</div>}
              {invoice.clientAddress && <div className="iv-sub" style={{ whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
            </div>
          </div>
          <div>
            <div className="il">Details</div>
            <div className="iv">
              {dueDateStr && <><div className="iv-sub">Due {dueDateStr}</div></>}
              <div style={{ marginTop: "4px" }}><strong>{sym}{Number(invoice.total).toFixed(2)}</strong></div>
              <div className="iv-sub">{invoice.currency.toUpperCase()}</div>
            </div>
          </div>
          <div>
            <div className="il">Payment</div>
            <div className="iv">
              {isPaid
                ? <><strong style={{ color: "#16a34a" }}>✓ Paid</strong>{paidDate && <div className="iv-sub">{paidDate}</div>}</>
                : invoice.status === "cancelled"
                  ? <strong style={{ color: "#ef4444" }}>Cancelled</strong>
                  : <><div className="iv-sub">Awaiting payment</div>{dueDateStr && <div className="iv-sub">Due {dueDateStr}</div>}</>}
            </div>
          </div>
        </div>
        {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
          <div style={{ padding: "0 40px 4px", display: "flex", justifyContent: "flex-end" }}>
            <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
          </div>
        )}
        <div className="tw">
          <table><thead><tr><th>Item</th><th style={{ width: "80px" }}>Qty</th><th style={{ width: "120px" }}>Price</th><th style={{ width: "120px" }}>Amount</th></tr></thead>
          <tbody>{itemRows()}</tbody></table>
        </div>
        <div className="totals-outer"><div className="tbox">
          {totalsRows()}
          <div className="tr">
            <span>Total Due</span>
            <span className={isPaid ? "paid-amt" : ""}>{isPaid ? "✓ " : ""}{sym}{Number(invoice.total).toFixed(2)}</span>
          </div>
        </div></div>
        {invoice.terms && (
          <div className="notes">
            <div className="nb"><div className="nl">Terms</div><div className="nt">{invoice.terms}</div></div>
          </div>
        )}
        {/* Square: bank always visible; paid shown via green amount in totals + watermark */}
        {bankSection()}
        <div className="foot">
          <span className="fb">{brand?.name ?? "—"}</span>
          {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} inside />}
          <span className="fn">{invoice.invoiceNumber}</span>
        </div>
      </div></div>
    </div>
  );
}
