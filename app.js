/* =====================================================================
   Proyecto financiero — app web (página "Sitio web" del Figma)
   JavaScript puro, sin librerías. Todo se guarda en localStorage.
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   1. Utilidades
   --------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
const sum = (arr) => arr.reduce((a, b) => a + num(b), 0);

const fmt = (n) => (n < 0 ? '-$ ' : '$ ') + Math.round(Math.abs(n)).toLocaleString('es-CO');
const fmtSin = (n) => (n < 0 ? '-$' : '$') + Math.round(Math.abs(n)).toLocaleString('es-CO');
const fmtDec = (n) => '$ ' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n, d = 2) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const signo = (n) => (n > 0 ? '+' : n < 0 ? '−' : '');
const fmtM = (v) => {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + 'K';
  return String(v);
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const mesDe = (iso) => iso.slice(0, 7);
const mesHoy = () => hoyISO().slice(0, 7);
const nombreMes = (k) => MESES[+k.slice(5, 7) - 1];
const etiquetaMes = (k) => cap(nombreMes(k)) + ' ' + k.slice(0, 4);
const fmtFecha = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${MES_CORTO[+m - 1]} ${y}`; };
const sumarMeses = (k, n) => { let y = +k.slice(0, 4), m = +k.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return `${y}-${String(m + 1).padStart(2, '0')}`; };

/** "1.200.000" → 1200000 ; "" → null */
function parseDinero(s) { const d = String(s ?? '').replace(/[^\d]/g, ''); return d === '' ? null : Number(d); }
/** "1,5" o "1.5" → 1.5 ; "" → null */
function parseNum(s) {
  let t = String(s ?? '').trim().replace(/\s|%/g, '');
  if (t === '') return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return isFinite(n) ? n : NaN;
}
const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.'); return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* nada */ } },
};

/* Iconos (dibujados a partir de los íconos del diseño) */
const IC = {
  tendencia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M6 15l4-5 4 3 5-7"/></svg>',
  billetera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 13h2"/><path d="M5 6l11-3 1 3"/></svg>',
  monedas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="9" cy="6" rx="6" ry="2.5"/><path d="M3 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6"/><path d="M3 10v4c0 1.4 2.7 2.5 6 2.5"/><ellipse cx="15" cy="15" rx="6" ry="2.5"/><path d="M9 15v3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-3"/></svg>',
  alcancia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 11a7 6 0 0 1 12-3h2l1 3 2 1v4l-2 1-1 3h-3l-1-2H9l-1 2H5l-1-4c-1-1-1-3 0-5z"/><circle cx="15" cy="11" r=".8" fill="currentColor"/><path d="M9 6.5a2.5 2.5 0 0 1 4 0"/></svg>',
  portapapeles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  ojoCerrado: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 10c2.5 3 5.5 4.5 9 4.5s6.5-1.5 9-4.5"/><path d="M6.5 13.5L5 16M12 14.5V17M17.5 13.5L19 16"/></svg>',
  correo: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-5 9 5v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 9l9 6 9-6"/></svg>',
  basura: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  lapiz: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bolsa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  flecha: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
};

/* ---------------------------------------------------------------------
   2. Estado, usuarios y datos
   --------------------------------------------------------------------- */
const K_USUARIOS = 'pf_usuarios';
const K_SESION = 'pf_sesion';
const kDatos = (email) => 'pf_datos_' + email;

let usuario = null;   // { email, ... }
let D = null;         // datos del usuario
let mesSel = null;    // mes seleccionado "YYYY-MM"
let instalarEvt = null;

const DEUDAS = [['prestamo', 'Préstamo vehicular'], ['hipotecario', 'Créditos hipotecarios'], ['tarjetas', 'Tarjetas de crédito']];
const HORMIGA = [['streaming', 'Streaming'], ['comida', 'Comida por fuera'], ['salidas', 'Salidas'], ['suscripciones', 'Suscripciones']];
const FUENTES = [['apartamento', 'Apartamento arrendado'], ['acciones', 'Acciones Bancolombia'], ['cdt', 'CDT'], ['moto', 'Alquiler de moto'], ['comercio', 'Comercio informal en redes']];
const CAT_OTRO_GASTO = ['Transporte', 'Salud', 'Comida', 'Vivienda', 'Servicios', 'Pérdidas', 'Robado', 'Otros'];

/* Tipos de gastos (frames "Gasto Transporte", "Gasto Salud", …) */
const CATS = {
  transporte: { nombre: 'Transporte', titulo: 'Gastos relacionados con el transporte', subs: ['Transporte', 'Gasolina', 'Peajes u otros'] },
  salud: { nombre: 'Salud', titulo: 'Gastos relacionados con la salud', subs: ['Citas Médicas', 'Medicamentos', 'Tratamientos y otros'] },
  comida: { nombre: 'Comida', titulo: 'Gastos relacionados con la comida', subs: ['Comidas por fuera', 'Bebidas', 'Otros'] },
  hormiga: {
    nombre: 'Gastos Hormiga', titulo: 'Gastos hormiga', subs: ['Streaming', 'Comida por fuera', 'Salidas', 'Suscripciones'], unaLista: true,
    texto: 'Un gasto hormiga es una pequeña compra cotidiana y no planeada que pasa desapercibida individualmente, pero que al sumarse a lo largo del mes o del año representa una cantidad significativa de dinero.',
  },
  perdidas: { nombre: 'Pérdidas', titulo: 'Pérdidas económicas generales', subs: ['Pérdidas en Inversiones', 'Daños', 'Otros'] },
  robado: { nombre: 'Robado', titulo: 'Capital general robado', subs: ['Efectivo y/o Digital', 'Objetos', 'Otros'] },
  otros: { nombre: 'Otros', titulo: 'Otros gastos', subs: ['Otros gastos'], unaLista: true },
};

/* Colores de las gráficas de gastos e ingresos */
const COLORES_GASTOS = ['#c94343', '#1597d4', '#1b6b25', '#e8b20a', '#e8732f', '#135f86', '#9aa3b2', '#8a5cd1'];
const COLORES_INGRESOS = ['#1fad1f', '#135f86', '#1597d4', '#e8732f', '#8a5cd1', '#1b6b25', '#e8b20a', '#c94343', '#9aa3b2'];

function datosVacios() {
  return { perfil: { completo: false }, patrimonioInicial: 0, meses: {}, movs: [], creado: Date.now() };
}
/** Guarda los datos del usuario. Devuelve true solo si quedaron guardados de verdad. */
function guardar() {
  if (!usuario) return false;
  if (!store.set(kDatos(usuario.email), D)) return false;
  // Comprobación: lo que quedó en el navegador debe coincidir con lo que hay en memoria
  try { return localStorage.getItem(kDatos(usuario.email)) === JSON.stringify(D); } catch { return false; }
}

function cargarSesion() {
  const email = store.get(K_SESION, null);
  const usuarios = store.get(K_USUARIOS, {});
  if (email && usuarios[email]) {
    usuario = { email, ...usuarios[email] };
    D = Object.assign(datosVacios(), store.get(kDatos(email), {}));
    mesSel = store.get('pf_mes_' + email, null) || mesPorDefecto();
  } else { usuario = null; D = null; }
}
function mesPorDefecto() {
  const hoy = mesHoy();
  const conDatos = mesesConDatos().filter((k) => k <= hoy);
  if (conDatos.includes(hoy) || !conDatos.length) return hoy;
  return conDatos[conDatos.length - 1];
}
function fijarMes(k) { mesSel = k; if (usuario) store.set('pf_mes_' + usuario.email, k); }

/* Contraseña: SHA-256 con sal (o hash simple si el navegador no tiene crypto.subtle) */
async function hashClave(clave, sal) {
  const txt = sal + '::' + clave;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'f' + (h >>> 0).toString(16);
}
const nuevaSal = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------------------------------------------------------------------
   3. Cálculos financieros del usuario
   --------------------------------------------------------------------- */
function movsDelMes(k) { return D.movs.filter((m) => mesDe(m.fecha) === k); }
function mesesConDatos() {
  if (!D) return [];
  const s = new Set(Object.keys(D.meses));
  D.movs.forEach((m) => s.add(mesDe(m.fecha)));
  return [...s].sort();
}
function totalesMes(k) {
  const reg = D.meses[k] || {};
  const g = reg.gastos || {};
  const i = reg.ingresos || {};
  const movs = movsDelMes(k);
  const movG = movs.filter((m) => m.tipo === 'gasto');
  const movI = movs.filter((m) => m.tipo === 'ingreso');

  const deudas = sum(DEUDAS.map(([c]) => g[c]));
  const hormigaForm = sum(HORMIGA.map(([c]) => g[c]));
  const hormigaMov = sum(movG.filter((m) => m.cat === 'hormiga').map((m) => m.monto));
  const otrosForm = sum((g.otros || []).map((o) => o.monto));
  const otrosMov = sum(movG.filter((m) => m.cat !== 'hormiga').map((m) => m.monto));
  const hormiga = hormigaForm + hormigaMov;
  const otros = otrosForm + otrosMov;
  const gastos = deudas + hormiga + otros;

  const pasivosFuentes = sum(FUENTES.map(([c]) => i[c]));
  const pasivosOtros = sum((i.otros || []).map((o) => o.monto));
  const pasivosMov = sum(movI.filter((m) => m.clase === 'pasivo').map((m) => m.monto));
  const activosMov = sum(movI.filter((m) => m.clase !== 'pasivo').map((m) => m.monto));
  const tieneDatos = Boolean(D.meses[k]) || movs.length > 0;
  const salario = tieneDatos ? num(D.perfil.salario) : 0;
  const pasivos = pasivosFuentes + pasivosOtros + pasivosMov;
  const activos = salario + activosMov;
  const ingresos = activos + pasivos;
  return {
    k, tieneDatos, deudas, hormiga, hormigaForm, hormigaMov, otros, otrosForm, otrosMov, gastos,
    pasivos, pasivosFuentes, pasivosOtros, pasivosMov, activos, activosMov, salario, ingresos,
    ahorro: ingresos - gastos, reg, g, i, movs, movG, movI,
  };
}
function patrimonioNeto() {
  return num(D.patrimonioInicial) + sum(mesesConDatos().map((k) => totalesMes(k).ahorro));
}
function hormigaPorTipo(k) {
  const t = totalesMes(k);
  const r = HORMIGA.map(([c, n]) => ({ label: n, value: num(t.g[c]) }));
  t.movG.filter((m) => m.cat === 'hormiga').forEach((m) => {
    const it = r.find((x) => x.label === m.sub);
    if (it) it.value += m.monto; else r.push({ label: m.sub || 'Otros', value: m.monto });
  });
  return r;
}
function gastoPorCategoria(k) {
  const t = totalesMes(k);
  const map = new Map();
  const add = (n, v) => map.set(n, (map.get(n) || 0) + num(v));
  Object.entries(CATS).forEach(([, c]) => map.set(c.nombre, 0));
  t.movG.forEach((m) => add(CATS[m.cat] ? CATS[m.cat].nombre : 'Otros', m.monto));
  (t.g.otros || []).forEach((o) => add(o.categoria || 'Otros', o.monto));
  add('Gastos Hormiga', t.hormigaForm);
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}
/** Tipo de gasto (id de CATS) al que pertenece un "otro gasto" del formulario mensual.
    Vivienda, Servicios y cualquier categoría sin página propia van a "Otros". */
function catDeExtra(categoria) {
  return Object.keys(CATS).find((id) => CATS[id].nombre === categoria) || 'otros';
}
/** Total del mes por tipo de gasto: movimientos puntuales + gastos del formulario mensual */
function totalPorTipo(k) {
  const t = totalesMes(k);
  const r = {};
  Object.keys(CATS).forEach((id) => { r[id] = 0; });
  t.movG.forEach((m) => { const id = CATS[m.cat] ? m.cat : 'otros'; r[id] += num(m.monto); });
  (t.g.otros || []).forEach((o) => { r[catDeExtra(o.categoria)] += num(o.monto); });
  r.hormiga += t.hormigaForm;
  return r;
}
/** Gastos del mes para la gráfica de torta: deudas + cada tipo de gasto */
function gastosParaGrafica(k) {
  const t = totalesMes(k);
  const tipos = totalPorTipo(k);
  return [{ label: 'Deudas', value: t.deudas }, ...Object.entries(CATS).map(([id, c]) => ({ label: c.nombre, value: tipos[id] }))]
    .map((x, i) => ({ ...x, color: COLORES_GASTOS[i % COLORES_GASTOS.length] })).filter((x) => x.value > 0);
}
/** Ingresos del mes para la gráfica de torta: salario, activos puntuales y cada fuente pasiva */
function ingresosParaGrafica(k) {
  const t = totalesMes(k);
  return [
    { label: 'Salario', value: t.salario },
    { label: 'Otros activos', value: t.activosMov },
    ...FUENTES.map(([c, n]) => ({ label: n, value: num(t.i[c]) })),
    ...(t.i.otros || []).map((o) => ({ label: o.nombre, value: num(o.monto) })),
    { label: 'Pasivos puntuales', value: t.pasivosMov },
  ].map((x, i) => ({ ...x, color: COLORES_INGRESOS[i % COLORES_INGRESOS.length] })).filter((x) => x.value > 0);
}

/* ---------------------------------------------------------------------
   4. Datos de ejemplo (botón "Cargar datos de ejemplo")
   Agosto 2026 replica las cifras del diseño; los otros meses son inventados.
   --------------------------------------------------------------------- */
function datosEjemplo() {
  const d = datosVacios();
  const p = D && D.perfil ? D.perfil : {};
  d.perfil = {
    nombre: p.nombre || 'Tomas', apellido: p.apellido || 'Ejemplo', trabajo: p.trabajo || 'Analista contable',
    salario: 3200000, fuente: 'Salario', gastaEn: ['Alimentación', 'Transporte'], otro: '',
    hormigaAprox: 300000, tieneDeudas: 'si', deudasMes: 4320000, ahorroMes: 280000,
    dificultad: 'Controlar los gastos pequeños', completo: true,
  };
  const tabla = {
    '2026-06': { t: 1800000, h: [45000, 95000, 60000, 50000], a: 40000, m: 650000, c: 280000 },
    '2026-07': { t: 2100000, h: [50000, 140000, 90000, 50000], a: 60000, m: 700000, c: 410000 },
    '2026-08': { t: 2500000, h: [50000, 120000, 80000, 50000], a: 50000, m: 700000, c: 350000 },
    '2026-09': { t: 1600000, h: [50000, 80000, 40000, 50000], a: 45000, m: 600000, c: 300000 },
    '2026-10': { t: 1900000, h: [50000, 110000, 70000, 50000], a: 55000, m: 700000, c: 380000 },
    '2026-11': { t: 1200000, h: [50000, 60000, 30000, 50000], a: 50000, m: 700000, c: 320000 },
  };
  Object.entries(tabla).forEach(([k, v]) => {
    d.meses[k] = {
      gastos: { prestamo: 1400000, hipotecario: 420000, tarjetas: v.t, streaming: v.h[0], comida: v.h[1], salidas: v.h[2], suscripciones: v.h[3], otros: [] },
      ingresos: { apartamento: 1200000, acciones: v.a, cdt: 200000, moto: v.m, comercio: v.c, otros: [] },
    };
  });
  let id = 1;
  const mov = (tipo, desc, fecha, monto, extra = {}) => d.movs.push({ id: 'e' + id++, tipo, desc, fecha, monto, ...extra });
  // Ingresos del frame "Historial Enero" / "Ingresos Mensual"
  mov('ingreso', 'Venta en redes', '2026-06-30', 50000, { clase: 'activo' });
  mov('ingreso', 'Reembolso de compra', '2026-06-27', 40000, { clase: 'activo' });
  mov('ingreso', 'Pago por trabajo freelance', '2026-06-24', 300000, { clase: 'activo' });
  mov('ingreso', 'Rendimiento de acciones', '2026-06-20', 24000, { clase: 'pasivo' });
  mov('ingreso', 'Venta de repuestos', '2026-06-16', 45600, { clase: 'activo' });
  mov('ingreso', 'Pago por tutoría', '2026-06-04', 90000, { clase: 'activo' });
  mov('ingreso', 'Venta mercadería', '2026-07-27', 120000, { clase: 'activo' });
  mov('ingreso', 'Recibo arrendamiento', '2026-09-09', 490000, { clase: 'pasivo' });
  mov('ingreso', 'Cobro servicios', '2026-09-29', 80000, { clase: 'activo' });
  mov('ingreso', 'Recibo alquiler', '2026-10-05', 50000, { clase: 'pasivo' });
  mov('ingreso', 'Cobro cliente', '2026-11-04', 50000, { clase: 'activo' });
  // Gastos del frame "Gastos Mensual" / "Historial General"
  mov('gasto', 'Mercado', '2026-06-29', 85000, { cat: 'comida', sub: 'Otros' });
  mov('gasto', 'Transporte', '2026-06-26', 12000, { cat: 'transporte', sub: 'Transporte' });
  mov('gasto', 'Servicios públicos', '2026-06-23', 150000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Almuerzo', '2026-06-19', 35000, { cat: 'comida', sub: 'Comidas por fuera' });
  mov('gasto', 'Salud', '2026-06-15', 60000, { cat: 'salud', sub: 'Citas Médicas' });
  mov('gasto', 'Gasolina', '2026-06-07', 120000, { cat: 'transporte', sub: 'Gasolina' });
  mov('gasto', 'Compra materiales', '2026-07-02', 230000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Servicios públicos', '2026-07-14', 30000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Mantenimiento equipo', '2026-09-21', 90000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Compra insumos', '2026-09-16', 130000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Pago proveedor', '2026-10-08', 300000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Gastos generales', '2026-10-10', 70000, { cat: 'otros', sub: 'Otros gastos' });
  mov('gasto', 'Gasolina', '2026-11-05', 110000, { cat: 'transporte', sub: 'Gasolina' });
  mov('gasto', 'Peaje Bogotá–Tunja', '2026-11-06', 18000, { cat: 'transporte', sub: 'Peajes u otros' });
  mov('gasto', 'Medicamentos', '2026-11-03', 45000, { cat: 'salud', sub: 'Medicamentos' });
  mov('gasto', 'Almuerzo', '2026-11-08', 28000, { cat: 'comida', sub: 'Comidas por fuera' });
  mov('gasto', 'Café de la tarde', '2026-11-09', 9000, { cat: 'hormiga', sub: 'Comida por fuera' });
  // Patrimonio inicial calculado para que el patrimonio neto sea $23.560.000 como en el diseño
  const prev = D; D = d;
  const ahorros = sum(mesesConDatos().map((k) => totalesMes(k).ahorro));
  D = prev;
  d.patrimonioInicial = 23560000 - ahorros;
  return d;
}

/* ---------------------------------------------------------------------
   5. Gráficas SVG (sin librerías)
   --------------------------------------------------------------------- */
function pasoBonito(x) {
  if (x <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= x) return m * p;
  return 10 * p;
}
/** Barras agrupadas. series: [{nombre,color,valores[]}] */
/* En pantallas angostas la gráfica usa un lienzo más pequeño para que el texto se lea */
const anchoGrafica = () => (window.innerWidth < 600 ? 400 : 640);
let anchoPrevio = anchoGrafica();
window.addEventListener('resize', () => { const a = anchoGrafica(); if (a !== anchoPrevio) { anchoPrevio = a; if (app.querySelector('svg.grafica')) render(); } });

function graficaBarras({ etiquetas, series, alto = 280, formato = fmtM, sufijoTitulo = fmt }) {
  const W = anchoGrafica(), H = alto, L = 52, R = 8, T = 14, B = 34;
  const todos = series.flatMap((s) => s.valores);
  const maxV = Math.max(...todos, 0);
  const minV = Math.min(...todos, 0);
  const paso = pasoBonito((maxV - minV || (formato === fmtM ? 5e6 : 5)) / 5);
  const top = Math.max(paso, Math.ceil(maxV / paso) * paso);
  const bot = Math.floor(minV / paso) * paso;
  const y = (v) => T + (H - T - B) * (1 - (v - bot) / (top - bot || 1));
  const gw = (W - L - R) / etiquetas.length;
  const bw = Math.min(16, gw / (series.length * 2));
  let s = `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de barras">`;
  for (let v = bot; v <= top + 1e-9; v += paso) {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#bdbdbd' : '#e5e5e5'}"/>`;
    s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="13" fill="#2a2a2a">${esc(formato(v))}</text>`;
  }
  etiquetas.forEach((et, i) => {
    const cx = L + gw * i + gw / 2;
    series.forEach((se, j) => {
      const v = se.valores[i];
      const x = cx + (j - series.length / 2) * (bw * 1.5) + bw * 0.25;
      const y1 = y(Math.max(v, 0)), y0 = y(Math.min(v, 0));
      const h = Math.max(y0 - y1, v ? 2 : 0);
      s += `<rect x="${x}" y="${y1}" width="${bw}" height="${h}" rx="${bw / 2}" fill="${se.color}"><title>${esc(se.nombre)} ${esc(et)}: ${esc(sufijoTitulo(v))}</title></rect>`;
    });
    s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="14" fill="#6b6b6b">${esc(et)}</text>`;
  });
  return s + '</svg>';
}
/** Torta para gastos hormiga */
function graficaTorta(items, colores, etiqueta = 'Distribución de gastos hormiga') {
  const total = sum(items.map((i) => i.value));
  const R = 90, C = 100;
  if (!total) return `<svg class="grafica" viewBox="0 0 200 200" style="max-width:220px"><circle cx="100" cy="100" r="90" fill="#eef1f6"/><text x="100" y="105" text-anchor="middle" font-size="14" fill="#8a8a8a">Sin registros</text></svg>`;
  let ang = -Math.PI / 2, s = `<svg class="grafica" viewBox="0 0 200 200" style="max-width:240px" role="img" aria-label="${esc(etiqueta)}">`;
  items.forEach((it, i) => {
    if (!it.value) return;
    const a = (it.value / total) * Math.PI * 2;
    if (a >= Math.PI * 2 - 1e-6) { s += `<circle cx="${C}" cy="${C}" r="${R}" fill="${colores[i % colores.length]}"><title>${esc(it.label)}: ${fmt(it.value)}</title></circle>`; return; }
    const x1 = C + R * Math.cos(ang), y1 = C + R * Math.sin(ang);
    ang += a;
    const x2 = C + R * Math.cos(ang), y2 = C + R * Math.sin(ang);
    s += `<path d="M${C},${C} L${x1},${y1} A${R},${R} 0 ${a > Math.PI ? 1 : 0} 1 ${x2},${y2} Z" fill="${colores[i % colores.length]}" stroke="#fff" stroke-width="1"><title>${esc(it.label)}: ${fmt(it.value)} (${Math.round((it.value / total) * 100)}%)</title></path>`;
  });
  return s + '</svg>';
}
/** Línea simple con puntos etiquetados */
function graficaLinea({ puntos, alto = 220, formato = (v) => v, color = '#002c81' }) {
  const W = anchoGrafica(), H = alto, L = 60, R = 30, T = 30, B = 32;
  const vals = puntos.map((p) => p.v).filter((v) => v != null);
  let min = Math.min(...vals), max = Math.max(...vals);
  const pad = (max - min) * 0.25 || max * 0.05 || 1; min -= pad; max += pad;
  const x = (i) => L + ((W - L - R) * i) / Math.max(1, puntos.length - 1);
  const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
  let s = `<svg class="grafica" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de línea">`;
  for (let k = 0; k <= 3; k++) { const v = min + ((max - min) * k) / 3; s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#eceff4"/><text x="${L - 8}" y="${y(v) + 4}" font-size="12" text-anchor="end" fill="#6b7280">${esc(formato(v))}</text>`; }
  const conV = puntos.map((p, i) => ({ ...p, i })).filter((p) => p.v != null);
  s += `<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${conV.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}"/>`;
  conV.forEach((p) => {
    s += `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="5" fill="#fff" stroke="${color}" stroke-width="2.5"><title>${esc(p.l)}: ${esc(formato(p.v))}</title></circle>`;
    if (p.etiqueta !== false) s += `<text x="${x(p.i)}" y="${y(p.v) - 10}" font-size="12.5" text-anchor="middle" fill="#2a2a2a" font-weight="600">${esc(p.txt || formato(p.v))}</text>`;
  });
  puntos.forEach((p, i) => { s += `<text x="${x(i)}" y="${H - 8}" font-size="12.5" text-anchor="middle" fill="#6b7280">${esc(p.l)}</text>`; });
  return s + '</svg>';
}

/* ---------------------------------------------------------------------
   6. UI común: modal, toast, menú, campos
   --------------------------------------------------------------------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
}
function abrirModal(html, alAbrir) {
  const m = $('#modal'); $('#modalBox').innerHTML = html; m.hidden = false;
  const f = $('#modalBox input, #modalBox select, #modalBox button'); if (f) f.focus();
  if (alAbrir) alAbrir($('#modalBox'));
}
function cerrarModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-cerrar]')) cerrarModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cerrarModal(); cerrarMenus(); } });
function confirmar(titulo, texto, ok, etiqueta = 'Confirmar', peligro = true) {
  abrirModal(`<h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="modal__acciones"><button class="btn btn--sec btn--chico" data-cerrar>Cancelar</button><button class="btn ${peligro ? 'btn--rojo' : ''} btn--chico" id="mOk">${esc(etiqueta)}</button></div>`,
    (b) => $('#mOk', b).addEventListener('click', () => { cerrarModal(); ok(); }));
}

const campoDinero = (id, label, valor = null, ph = 'Ingresa el importe', extra = '') => `
  <div class="campo"><label for="${id}">${esc(label)}</label>
  <div class="input-wrap"><span class="prefijo">$</span><input class="input" id="${id}" name="${id}" inputmode="numeric" autocomplete="off" data-dinero placeholder="${esc(ph)}" value="${valor == null ? '' : Number(valor).toLocaleString('es-CO')}" ${extra}></div></div>`;

/** Formatea montos con puntos de miles mientras se escribe */
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches && el.matches('[data-dinero]')) {
    const v = parseDinero(el.value);
    el.value = v == null ? '' : v.toLocaleString('es-CO');
  }
});

function selectorMes(extraClase = '') {
  const hoy = mesHoy();
  const set = new Set(mesesConDatos());
  const y = +hoy.slice(0, 4);
  for (let m = 1; m <= 12; m++) { set.add(`${y}-${String(m).padStart(2, '0')}`); set.add(`${y - 1}-${String(m).padStart(2, '0')}`); }
  set.add(mesSel);
  const ops = [...set].sort().reverse().map((k) => `<option value="${k}" ${k === mesSel ? 'selected' : ''}>${etiquetaMes(k)}${D.meses[k] || movsDelMes(k).length ? '' : ' · sin registros'}</option>`).join('');
  return `<label class="mes-selector ${extraClase}">Mes de <select data-mes-select aria-label="Cambiar mes">${ops}</select></label>`;
}

/* Lista de movimientos (estilo "Historial general") */
function movHTML(m, borrar = true) {
  const ing = m.tipo === 'ingreso';
  const detalle = ing ? (m.clase === 'pasivo' ? 'Pasivo' : 'Activo') : (CATS[m.cat] ? CATS[m.cat].nombre + (m.sub && m.sub !== CATS[m.cat].nombre ? ' · ' + m.sub : '') : '');
  return `<div class="mov"><span class="monto ${ing ? 'verde' : 'rojo'}">${fmt(m.monto)}</span>
    <span class="desc">${esc(m.desc)}${detalle ? ` <span class="muted">(${esc(detalle)})</span>` : ''}</span>
    <span class="fecha">${fmtFecha(m.fecha)}</span>
    <span class="chip ${ing ? 'chip--entrada' : 'chip--salida'}">${ing ? 'Entrada' : 'Salida'}</span>
    ${borrar ? `<button class="borrar" data-accion="borrar-mov" data-id="${esc(m.id)}" aria-label="Eliminar ${esc(m.desc)}" title="Eliminar">${IC.basura}</button>` : ''}</div>`;
}
const ordenarMovs = (arr) => arr.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

/** Modal para añadir un gasto o ingreso puntual */
function modalMovimiento({ tipo = 'gasto', cat = '', sub = '' } = {}) {
  const ing = tipo === 'ingreso';
  const hoy = hoyISO();
  const fechaDef = mesDe(hoy) === mesSel ? hoy : mesSel + '-01';
  const catOps = Object.entries(CATS).map(([id, c]) => `<option value="${id}" ${id === cat ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');
  abrirModal(`<h2>${ing ? 'Añadir ingreso' : 'Añadir gasto'}</h2>
    <p>${ing ? 'Registra un ingreso puntual. Se suma al mes de la fecha que elijas.' : 'Registra un gasto puntual. Se suma al mes de la fecha que elijas.'}</p>
    <form id="fMov" novalidate>
      <div class="form-error" id="mErr" hidden></div>
      <div class="campo"><label for="mDesc">Descripción</label><input class="input" id="mDesc" maxlength="80" placeholder="${ing ? 'Ej.: Pago por trabajo freelance' : 'Ej.: Almuerzo'}" required></div>
      <div class="campo"><label for="mFecha">Fecha</label><input class="input" type="date" id="mFecha" value="${fechaDef}" required></div>
      ${campoDinero('mMonto', 'Importe en pesos')}
      ${ing ? `<div class="campo"><label for="mClase">Tipo de ingreso</label><select class="input" id="mClase"><option value="activo">Activo (trabajo, ventas)</option><option value="pasivo">Pasivo (arriendos, rendimientos)</option></select></div>`
    : `<div class="campo"><label for="mCat">Tipo de gasto</label><select class="input" id="mCat">${catOps}</select></div>
         <div class="campo"><label for="mSub">Subcategoría</label><select class="input" id="mSub"></select></div>`}
      <div class="modal__acciones"><button type="button" class="btn btn--sec btn--chico" data-cerrar>Cancelar</button><button class="btn btn--chico ${ing ? 'btn--verde' : 'btn--rojo'}">Guardar</button></div>
    </form>`, (b) => {
    const llenarSubs = () => {
      const c = CATS[$('#mCat', b).value];
      $('#mSub', b).innerHTML = c.subs.map((s) => `<option ${s === sub ? 'selected' : ''}>${esc(s)}</option>`).join('');
    };
    if (!ing) { llenarSubs(); $('#mCat', b).addEventListener('change', () => { sub = ''; llenarSubs(); }); }
    $('#mDesc', b).focus();
    $('#fMov', b).addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = $('#mDesc', b).value.trim();
      const fecha = $('#mFecha', b).value;
      const monto = parseDinero($('#mMonto', b).value);
      const err = !desc ? 'Escribe una descripción.' : !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? 'Elige una fecha válida.' : !monto ? 'Escribe un importe mayor que $0.' : '';
      if (err) { const x = $('#mErr', b); x.textContent = err; x.hidden = false; return; }
      const m = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tipo, desc, fecha, monto };
      if (ing) m.clase = $('#mClase', b).value; else { m.cat = $('#mCat', b).value; m.sub = $('#mSub', b).value; }
      D.movs.push(m);
      if (!guardar()) { D.movs.pop(); const x = $('#mErr', b); x.textContent = 'No se pudo guardar en este navegador. Inténtalo de nuevo.'; x.hidden = false; return; }
      fijarMes(mesDe(fecha)); cerrarModal();
      toast(ing ? 'Ingreso añadido.' : 'Gasto añadido.'); render();
    });
  });
}

/* ---------------------------------------------------------------------
   7. Pantallas: Sesión / Crear cuenta / Encuesta
   --------------------------------------------------------------------- */
function heroAuth() {
  return `<div class="auth__hero" style="background-image:url('assets/hero.jpg')"><div class="auth__marca">Tu Web de finanzas<br>en un solo lugar</div></div>`;
}
function campoClave(id, ph, ayuda = '') {
  return `<div class="campo"><label for="${id}">Contraseña</label>
    <div class="input-wrap"><input class="input input--gris con-icono" type="password" id="${id}" name="${id}" placeholder="${ph}" autocomplete="${id === 'rClave' ? 'new-password' : 'current-password'}" minlength="8" required>
    <button type="button" class="icono-der" data-ver-clave="${id}" aria-label="Mostrar contraseña" aria-pressed="false">${IC.ojoCerrado}</button></div>
    ${ayuda}<span class="error" id="${id}Err"></span></div>`;
}
function campoCorreo(id) {
  return `<div class="campo"><label for="${id}">Correo electrónico</label>
    <div class="input-wrap"><input class="input input--gris con-icono" type="email" id="${id}" name="${id}" placeholder="Ingresa tu correo electrónico" autocomplete="email" required><span class="icono-der" aria-hidden="true">${IC.correo}</span></div>
    <span class="error" id="${id}Err"></span></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ver-clave]'); if (!b) return;
  const inp = document.getElementById(b.dataset.verClave);
  const ver = inp.type === 'password';
  inp.type = ver ? 'text' : 'password';
  b.innerHTML = ver ? IC.ojo : IC.ojoCerrado;
  b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
  b.setAttribute('aria-pressed', String(ver));
});
function marcarError(id, msg) {
  const el = document.getElementById(id + 'Err'); if (el) el.textContent = msg;
  const c = document.getElementById(id)?.closest('.campo'); if (c) c.classList.toggle('invalido', Boolean(msg));
  return !msg;
}

const vSesion = {
  html: () => `<div class="auth">${heroAuth()}
    <div class="auth__cuerpo">
      <div class="auth__intro">Para empezar, por favor ingresa tu usuario.<br>Si no tienes cuenta creada, te ayudamos a crearla.</div>
      <form id="fSesion" novalidate>
        <div class="form-error" id="sErr" hidden></div>
        ${campoCorreo('sCorreo')}
        ${campoClave('sClave', 'Ingresa tu contraseña')}
        <div style="text-align:right;margin:-8px 0 18px"><button type="button" class="link" id="olvido">¿Olvidaste tu contraseña?</button></div>
        <button class="btn btn--bloque">Continuar</button>
      </form>
      <div class="auth__pie">Si no tienes una sesión registrada<br><a class="grande" href="#/registro">Regístrate</a></div>
      <div class="o">o</div>
      <button class="btn-google" data-accion="google"><img src="assets/google.png" alt="">Regístrate con Google</button>
    </div></div>`,
  bind() {
    $('#fSesion').addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = $('#sCorreo').value.trim().toLowerCase();
      const clave = $('#sClave').value;
      const ok1 = marcarError('sCorreo', !correo ? 'Escribe tu correo electrónico.' : !EMAIL_RE.test(correo) ? 'Escribe un correo válido, por ejemplo nombre@correo.com.' : '');
      const ok2 = marcarError('sClave', !clave ? 'Escribe tu contraseña.' : clave.length < 8 ? 'La contraseña tiene mínimo 8 caracteres.' : '');
      if (!ok1 || !ok2) return;
      const us = store.get(K_USUARIOS, {});
      const u = us[correo];
      const err = $('#sErr');
      if (!u || (await hashClave(clave, u.sal)) !== u.hash) { err.textContent = 'Correo o contraseña incorrectos.'; err.hidden = false; return; }
      store.set(K_SESION, correo); cargarSesion();
      location.hash = D.perfil.completo ? '#/inicio' : '#/encuesta';
    });
    $('#olvido').addEventListener('click', modalOlvido);
  },
};
function modalOlvido() {
  abrirModal(`<h2>Restablecer contraseña</h2><p>Tus datos están guardados solo en este navegador, así que puedes crear una contraseña nueva para tu correo aquí mismo.</p>
    <form id="fOlv" novalidate><div class="form-error" id="oErr" hidden></div>
    <div class="campo"><label for="oCorreo">Correo electrónico</label><input class="input" type="email" id="oCorreo" autocomplete="email"></div>
    <div class="campo"><label for="oClave">Contraseña nueva</label><div class="input-wrap"><input class="input con-icono" type="password" id="oClave" autocomplete="new-password"><button type="button" class="icono-der" data-ver-clave="oClave" aria-label="Mostrar contraseña">${IC.ojoCerrado}</button></div><span class="ayuda">Mínimo 8 caracteres</span></div>
    <div class="modal__acciones"><button type="button" class="btn btn--sec btn--chico" data-cerrar>Cancelar</button><button class="btn btn--chico">Guardar contraseña</button></div></form>`, (b) => {
    $('#fOlv', b).addEventListener('submit', async (e) => {
      e.preventDefault();
      const c = $('#oCorreo', b).value.trim().toLowerCase(), k = $('#oClave', b).value;
      const us = store.get(K_USUARIOS, {});
      const msg = !EMAIL_RE.test(c) ? 'Escribe un correo válido.' : !us[c] ? 'No hay ninguna cuenta con ese correo en este navegador.' : k.length < 8 ? 'La contraseña debe tener mínimo 8 caracteres.' : '';
      if (msg) { $('#oErr', b).textContent = msg; $('#oErr', b).hidden = false; return; }
      const sal = nuevaSal(); us[c].sal = sal; us[c].hash = await hashClave(k, sal); store.set(K_USUARIOS, us);
      cerrarModal(); toast('Contraseña actualizada. Ya puedes iniciar sesión.');
    });
  });
}

const vRegistro = {
  html: () => `<div class="auth">${heroAuth()}
    <div class="auth__cuerpo">
      <h1 class="auth__titulo"><a href="#/sesion" class="boton-back" aria-label="Volver a iniciar sesión">${IC.flecha}</a>Registrarse</h1>
      <form id="fReg" novalidate>
        <div class="form-error" id="rErr" hidden></div>
        ${campoCorreo('rCorreo')}
        ${campoClave('rClave', 'Crea tu contraseña', '<span class="ayuda" id="rAyuda">Mínimo 8 caracteres</span>')}
        <button class="btn btn--bloque">Continuar</button>
      </form>
      <div class="o">o</div>
      <button class="btn-google" data-accion="google"><img src="assets/google.png" alt="">Regístrate con Google</button>
      <div class="auth__pie">¿Ya tienes una cuenta? <a class="link" href="#/sesion">Inicia sesión</a></div>
    </div></div>`,
  bind() {
    $('#rClave').addEventListener('input', (e) => {
      const n = e.target.value.length;
      $('#rAyuda').textContent = n >= 8 ? '✓ Mínimo 8 caracteres' : `Mínimo 8 caracteres (${n}/8)`;
      $('#rAyuda').style.color = n >= 8 ? 'var(--verde)' : '';
    });
    $('#fReg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = $('#rCorreo').value.trim().toLowerCase();
      const clave = $('#rClave').value;
      const us = store.get(K_USUARIOS, {});
      const ok1 = marcarError('rCorreo', !correo ? 'Escribe tu correo electrónico.' : !EMAIL_RE.test(correo) ? 'Escribe un correo válido, por ejemplo nombre@correo.com.' : us[correo] ? 'Ya existe una cuenta con este correo. Inicia sesión.' : '');
      const ok2 = marcarError('rClave', !clave ? 'Crea una contraseña.' : clave.length < 8 ? 'La contraseña debe tener mínimo 8 caracteres.' : /^\s|\s$/.test(clave) ? 'La contraseña no puede empezar ni terminar con espacios.' : '');
      if (!ok1 || !ok2) return;
      const sal = nuevaSal();
      us[correo] = { sal, hash: await hashClave(clave, sal), creado: Date.now() };
      if (!store.set(K_USUARIOS, us)) return;
      store.set(kDatos(correo), datosVacios());
      store.set(K_SESION, correo); cargarSesion();
      toast('Cuenta creada. Cuéntanos un poco sobre ti.');
      location.hash = '#/encuesta';
    });
  },
};

const vEncuesta = {
  html: () => {
    const p = D.perfil || {};
    const val = (k) => esc(p[k] ?? '');
    const din = (k) => (p[k] == null ? '' : Number(p[k]).toLocaleString('es-CO'));
    const opt = (n, ic, bg) => `<label class="opcion"><input type="checkbox" name="gastaEn" value="${n}" ${(p.gastaEn || []).includes(n) ? 'checked' : ''}><span class="ic" style="background:${bg}">${ic}</span>${n}</label>`;
    const editando = p.completo;
    return `<header class="encuesta__head"><h1>Queremos conocer más sobre ti</h1><p>Cuéntanos sobre ti para personalizar tu experiencia</p></header>
    <div class="pagina pagina--estrecha"><form id="fEnc" class="card" novalidate style="padding:28px">
      <div class="form-error" id="eErr" hidden></div>
      <div class="grid g2" style="gap:0 18px">
        <div class="campo"><label for="eNombre">Nombre</label><input class="input" id="eNombre" placeholder="Escribe tu nombre" value="${val('nombre')}" autocomplete="given-name" maxlength="40"><span class="error" id="eNombreErr"></span></div>
        <div class="campo"><label for="eApellido">Apellido</label><input class="input" id="eApellido" placeholder="Escribe tu apellido" value="${val('apellido')}" autocomplete="family-name" maxlength="40"><span class="error" id="eApellidoErr"></span></div>
      </div>
      <div class="campo"><label for="eTrabajo">¿A qué te dedicas?</label><input class="input" id="eTrabajo" placeholder="Ingresa tu trabajo" value="${val('trabajo')}" maxlength="60"></div>
      <div class="campo"><label for="eSalario">¿Qué salario recibes mensualmente?</label><div class="input-wrap"><span class="prefijo">$</span><input class="input" id="eSalario" data-dinero inputmode="numeric" placeholder="Ingresa tu salario" value="${din('salario')}"></div><span class="error" id="eSalarioErr"></span></div>
      <div class="campo"><label for="eFuente">¿Cuál es su principal fuente de ingresos?</label><input class="input" id="eFuente" placeholder="Ingresa tu principal fuente de ingresos" value="${val('fuente')}" maxlength="60"></div>
      <div class="campo"><span class="lbl">¿En qué gasta principalmente su dinero?</span>
        <div class="opciones">${opt('Alimentación', '🍕', '#fde7e2')}${opt('Vivienda', '🏠', '#dff3e4')}${opt('Transporte', '🚗', '#fdf3c8')}${opt('Servicios', '🧾', '#e7e6fb')}</div></div>
      <div class="campo"><label for="eOtro">Otro</label><input class="input" id="eOtro" placeholder="Ingresa qué otro gasto de su dinero" value="${val('otro')}" maxlength="60"></div>
      <div class="campo"><label for="eHormiga">¿Cuánto cree que se gasta en pequeños gastos?</label><div class="input-wrap"><span class="prefijo">$</span><input class="input" id="eHormiga" data-dinero inputmode="numeric" placeholder="Ingresa aproximadamente cuánto gastas" value="${din('hormigaAprox')}"></div></div>
      <div class="campo"><span class="lbl">¿Tiene actualmente deudas?</span>
        <div class="opciones" style="max-width:320px"><label class="opcion opcion--radio"><input type="radio" name="deudas" value="si" ${p.tieneDeudas === 'si' ? 'checked' : ''}><span class="circ"></span>Sí</label><label class="opcion opcion--radio"><input type="radio" name="deudas" value="no" ${p.tieneDeudas === 'no' ? 'checked' : ''}><span class="circ"></span>No</label></div></div>
      <p class="ayuda" style="margin-top:-6px">Si la respuesta es sí, responde:</p>
      <div class="campo"><label for="eDeudasMes">¿Cuánto paga aproximadamente al mes en deudas?</label><div class="input-wrap"><span class="prefijo">$</span><input class="input" id="eDeudasMes" data-dinero inputmode="numeric" placeholder="Ingresa tus deudas mensuales" value="${din('deudasMes')}"></div><span class="error" id="eDeudasMesErr"></span></div>
      <div class="campo"><label for="eAhorro">¿Cuánto dinero suele ahorrar al mes? - Aprox</label><div class="input-wrap"><span class="prefijo">$</span><input class="input" id="eAhorro" data-dinero inputmode="numeric" placeholder="Ingresa el ahorro mensual aproximado" value="${din('ahorroMes')}"></div></div>
      <div class="campo"><label for="eDificultad">¿Cuál es su principal dificultad con el manejo del dinero?</label><input class="input" id="eDificultad" placeholder="Ingresa la principal dificultad" value="${val('dificultad')}" maxlength="120"></div>
      <button class="btn btn--bloque" style="margin-top:8px">Enviar respuestas</button>
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px">
        ${editando ? '<a class="link" href="#/inicio">Cancelar</a>' : '<button type="button" class="link" id="volverReg">Regresar a página de registro</button>'}
        ${editando ? '' : '<button type="button" class="link" id="saltar">Ir a la página de inicio</button>'}
      </div>
    </form></div>`;
  },
  bind() {
    const radioDeudas = () => $$('input[name=deudas]').find((r) => r.checked)?.value || '';
    const actualizar = () => { const si = radioDeudas() === 'si'; $('#eDeudasMes').disabled = radioDeudas() === 'no'; if (!si && radioDeudas() === 'no') $('#eDeudasMes').value = ''; };
    $$('input[name=deudas]').forEach((r) => r.addEventListener('change', actualizar)); actualizar();
    $('#volverReg')?.addEventListener('click', () => { cerrarSesion('#/registro'); });
    $('#saltar')?.addEventListener('click', () => { location.hash = '#/inicio'; });
    $('#fEnc').addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = $('#eNombre').value.trim(), apellido = $('#eApellido').value.trim();
      const salario = parseDinero($('#eSalario').value);
      const deudas = radioDeudas();
      const deudasMes = parseDinero($('#eDeudasMes').value);
      const oks = [
        marcarError('eNombre', nombre ? '' : 'Escribe tu nombre.'),
        marcarError('eApellido', apellido ? '' : 'Escribe tu apellido.'),
        marcarError('eSalario', salario == null ? 'Escribe tu salario mensual (puede ser 0).' : ''),
        marcarError('eDeudasMes', deudas === 'si' && !deudasMes ? 'Si tienes deudas, escribe cuánto pagas al mes.' : ''),
      ];
      if (oks.includes(false)) { $('#eErr').textContent = 'Revisa los campos marcados.'; $('#eErr').hidden = false; $('#eErr').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      D.perfil = {
        nombre, apellido, trabajo: $('#eTrabajo').value.trim(), salario, fuente: $('#eFuente').value.trim(),
        gastaEn: $$('input[name=gastaEn]:checked').map((c) => c.value), otro: $('#eOtro').value.trim(),
        hormigaAprox: parseDinero($('#eHormiga').value), tieneDeudas: deudas, deudasMes: deudas === 'si' ? deudasMes : 0,
        ahorroMes: parseDinero($('#eAhorro').value), dificultad: $('#eDificultad').value.trim(), completo: true,
      };
      guardar(); toast('¡Gracias! Guardamos tus respuestas.'); location.hash = '#/inicio';
    });
  },
};

/* ---------------------------------------------------------------------
   8. Inicio (frame "Comienzo")
   --------------------------------------------------------------------- */
const COLORES_TORTA = ['#1b6b25', '#1597d4', '#e8732f', '#135f86', '#8a5cd1', '#9aa3b2'];
function kpiHTML({ titulo, valor, icono, clase, href, nota }) {
  return `<a class="kpi" href="${href}"><span>${titulo}</span>${nota ? `<small>${nota}</small>` : ''}<div class="val"><b>${fmt(valor)}</b><span class="ico ${clase}">${icono}</span></div></a>`;
}
function tablaFilas(filas) {
  return `<table class="tabla-lista"><tbody>${filas.map((f) => `<tr class="${f.clase || ''}"><td>${esc(f.l)}</td><td class="${f.color || ''}">${f.v == null ? '<span class="muted" style="font-weight:400">Sin registrar</span>' : fmt(f.v)}</td></tr>`).join('')}</tbody></table>`;
}
function ultimos6(k) { return Array.from({ length: 6 }, (_, i) => sumarMeses(k, i - 5)); }

/* Gráficas de las páginas de Historial de gastos e Historial de ingresos */
/** Tarjeta con barras de los últimos 6 meses. series: [{nombre, color, campo}] (campo de totalesMes) */
function tarjetaBarras6(titulo, series) {
  const meses6 = ultimos6(mesSel).map(totalesMes);
  return `<div class="card"><h3>${esc(titulo)}</h3>
    <div class="fila entre" style="flex-wrap:wrap;margin-bottom:6px"><span class="muted">Últimos 6 meses</span>
      <div class="leyenda">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.nombre)}</span>`).join('')}</div></div>
    ${graficaBarras({ etiquetas: meses6.map((m) => MES_CORTO[+m.k.slice(5) - 1].toUpperCase()), series: series.map((s) => ({ nombre: s.nombre, color: s.color, valores: meses6.map((m) => m[s.campo]) })) })}
  </div>`;
}
/** Tarjeta con la torta del mes seleccionado y su leyenda */
/** items: [{label, value, color}] */
function tarjetaTorta(titulo, items, vacio) {
  return `<div class="card pie-wrap"><h3 style="align-self:flex-start;margin-bottom:0">${esc(titulo)}</h3>
    ${graficaTorta(items, items.map((x) => x.color), titulo)}
    ${items.length ? `<div class="pie-leyenda">${items.map((x) => `<div>${esc(x.label)}<b>${fmt(x.value)}</b><i style="background:${x.color}"></i></div>`).join('')}</div>` : `<p class="vacio" style="margin:0">${esc(vacio)}</p>`}
  </div>`;
}

const vInicio = {
  html() {
    const t = totalesMes(mesSel);
    const p = D.perfil;
    const sinDatos = !mesesConDatos().length;
    const meses6 = ultimos6(mesSel).map(totalesMes);
    const torta = hormigaPorTipo(mesSel);
    const canasta = CANASTA.slice(0, 5);
    return `<div class="pagina">
      ${sinDatos ? `<div class="banner-datos"><p><b>Aún no tienes registros.</b> Registra tus gastos e ingresos del mes o carga datos de ejemplo para explorar la app.</p><div class="fila" style="flex-wrap:wrap"><a class="btn btn--chico" href="#/registrar-gastos">Registrar gastos</a><button class="btn btn--sec btn--chico" data-accion="ejemplo">Cargar datos de ejemplo</button></div></div>` : ''}
      <section class="bienvenida">
        <div><small>Tu perfil financiero</small><h1>Bienvenido ${esc(p.nombre || '')}</h1><p>Aquí podrás encontrar la información financiera</p>
          <div style="margin-top:14px">${selectorMes()}</div></div>
        <div class="patrimonio"><span>Patrimonio Neto <button class="icon-btn" data-accion="editar-patrimonio" aria-label="Editar patrimonio inicial" title="Editar patrimonio inicial">${IC.lapiz}</button></span><strong>${fmtSin(patrimonioNeto())}</strong></div>
      </section>
      <section class="grid g4">
        ${kpiHTML({ titulo: 'Ingreso mensual', valor: t.ingresos, icono: IC.tendencia, clase: 'ico--verde', href: '#/ingresos' })}
        ${kpiHTML({ titulo: 'Gastos fijos', valor: t.deudas, icono: IC.billetera, clase: 'ico--rojo', href: '#/gastos' })}
        ${kpiHTML({ titulo: 'Gastos hormiga', valor: t.hormiga, icono: IC.monedas, clase: 'ico--naranja', href: '#/categoria/hormiga', nota: 'Aprox..' })}
        ${kpiHTML({ titulo: 'Ahorro', valor: t.ahorro, icono: IC.alcancia, clase: 'ico--cian', href: '#/mes/' + mesSel })}
      </section>
      <section class="grid g2" style="margin-top:36px">
        <div class="card"><h3>Ingresos pasivos</h3>${tablaFilas([
          ...FUENTES.map(([c, n]) => ({ l: n, v: t.i[c] ?? null, color: 'verde' })),
          ...(t.i.otros || []).map((o) => ({ l: o.nombre, v: o.monto, color: 'verde' })),
          ...(t.pasivosMov ? [{ l: 'Otros ingresos pasivos', v: t.pasivosMov, color: 'verde' }] : []),
          { l: 'Total Pasivos =', v: t.pasivos, color: 'verde', clase: 'total' }])}
          <div style="margin-top:12px"><a class="link" href="#/registrar-ingresos?mes=${mesSel}">Registrar ingresos de ${nombreMes(mesSel)} →</a></div></div>
        <div class="card"><h3>Gastos mensuales</h3>${tablaFilas([
          ...DEUDAS.map(([c, n]) => ({ l: n, v: t.g[c] ?? null, color: 'rojo' })),
          { l: 'Total deudas', v: t.deudas, color: 'rojo', clase: 'fuerte' },
          { l: 'Gastos hormiga (aprox.)', v: t.hormiga, color: 'naranja' },
          { l: 'Otros gastos', v: t.otros, color: 'rojo' },
          { l: 'Total egresos =', v: t.gastos, color: 'rojo', clase: 'total' }])}
          <div style="margin-top:12px"><a class="link" href="#/registrar-gastos?mes=${mesSel}">Registrar gastos de ${nombreMes(mesSel)} →</a></div></div>
      </section>
      <section class="grid g2" style="margin-top:36px;align-items:start">
        <div>
          <a class="cta-historial" href="#/finanzas">Ir al historial de gastos e ingresos →</a>
          <h2 class="subtitulo">Ingresos vs Gastos</h2>
          <div class="card"><div class="fila entre" style="flex-wrap:wrap"><span class="muted">Últimos 6 meses</span>
            <div class="leyenda"><span><i style="background:#c94343"></i>Gastos</span><span><i style="background:#1fad1f"></i>Ingresos</span></div></div>
            ${graficaBarras({ etiquetas: meses6.map((m) => MES_CORTO[+m.k.slice(5) - 1].toUpperCase()), series: [{ nombre: 'Gastos', color: '#c94343', valores: meses6.map((m) => m.gastos) }, { nombre: 'Ingresos', color: '#1fad1f', valores: meses6.map((m) => m.ingresos) }] })}
          </div>
        </div>
        <div>
          <h2 class="subtitulo" style="margin-top:0">Gastos Hormiga - Mensual</h2>
          <a class="card pie-wrap" href="#/categoria/hormiga" style="text-decoration:none"><span class="muted" style="align-self:flex-start;font-size:20px">${cap(nombreMes(mesSel))}</span>
            ${graficaTorta(torta, COLORES_TORTA)}
            <div class="pie-leyenda">${torta.map((x, i) => `<div>${esc(x.label)}<b>${fmt(x.value)}</b><i style="background:${COLORES_TORTA[i % COLORES_TORTA.length]}"></i></div>`).join('')}</div>
          </a>
        </div>
      </section>
      <h2 class="subtitulo">Links sobre el cambio de productos del mercado:</h2>
      <section class="grid g2">
        <div class="card mercado-card"><h3>Precio de los productos más comprados</h3>
          ${tablaPrecios(canasta.map((c) => [c.n, fmtDec(c.p)]))}<a class="ver-mas" href="#/canasta">Ver más</a></div>
        <div class="card mercado-card"><h3>Precio de los combustibles</h3>
          ${tablaPrecios(GASOLINA.ciudades.slice(0, 4).map(([n, v]) => ['Gasolina corriente · ' + n, fmtSin(v) + ' /gal']))}<a class="ver-mas" href="#/transporte/gasolina">Ver más</a></div>
      </section>
      <div class="mercado-atajos">${ATAJOS_MERCADO.map((a) => `<a class="atajo" href="${a.href}"><span class="ico" style="background:${a.bg}">${a.ic}</span><span><b>${a.t}</b><small>${a.d}</small></span></a>`).join('')}</div>
    </div>`;
  },
};
function tablaPrecios(filas) { return `<table class="tabla-lista"><tbody>${filas.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`; }

/* ---------------------------------------------------------------------
   9. Finanzas: Historiales, historial general, mensual, ingresos/gastos
   --------------------------------------------------------------------- */
const vFinanzas = {
  html() {
    const movs = ordenarMovs(D.movs);
    const ing = movs.filter((m) => m.tipo === 'ingreso');
    const gas = movs.filter((m) => m.tipo === 'gasto');
    const anio = +mesSel.slice(0, 4);
    return `<div class="pagina">
      <h1 class="titulo-pagina">Historial de gastos e ingresos</h1>
      <div class="fila" style="flex-wrap:wrap;gap:12px;margin-bottom:8px">
        <a class="btn btn--rojo btn--chico" href="#/registrar-gastos?mes=${mesSel}">+ Registrar gastos</a>
        <a class="btn btn--verde btn--chico" href="#/registrar-ingresos?mes=${mesSel}">+ Registrar ingresos</a>
        <a class="btn btn--sec btn--chico" href="#/ingresos">Historial de ingresos</a>
        <a class="btn btn--sec btn--chico" href="#/gastos">Historial de gastos</a>
      </div>
      <h2 class="subtitulo">Historial general:</h2>
      ${movs.slice(0, 3).map((m) => movHTML(m)).join('') || '<p class="vacio">Todavía no hay movimientos. Añade un gasto o un ingreso puntual.</p>'}
      <a class="ver-mas-fila" href="#/historial-general">Ver más</a>
      <div class="grid g2" style="margin-top:12px">
        <div><h2 class="subtitulo">Ingresos:</h2>${ing.slice(0, 3).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin ingresos puntuales.</p>'}<a class="ver-mas-fila" href="#/ingresos-mes">Ver más</a></div>
        <div><h2 class="subtitulo">Gastos:</h2>${gas.slice(0, 3).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin gastos puntuales.</p>'}<a class="ver-mas-fila" href="#/gastos-mes">Ver más</a></div>
      </div>
      <div class="fila entre" style="flex-wrap:wrap"><h2 class="subtitulo">Historiales mensuales:</h2>
        <label class="mes-selector">Año <select id="anioSel">${[anio - 1, anio, anio + 1].map((y) => `<option ${y === anio ? 'selected' : ''}>${y}</option>`).join('')}</select></label></div>
      <div class="meses-grid">${MESES.map((m, i) => {
        const k = `${anio}-${String(i + 1).padStart(2, '0')}`; const t = totalesMes(k);
        return `<a class="mes-btn ${t.tieneDatos ? '' : 'vacio-mes'}" href="#/mes/${k}">${m.toUpperCase()}<small>${t.tieneDatos ? 'Balance ' + fmt(t.ahorro) : 'Sin registros'}</small></a>`;
      }).join('')}</div>
    </div>`;
  },
  bind() { $('#anioSel').addEventListener('change', (e) => { fijarMes(`${e.target.value}-${mesSel.slice(5)}`); render(); }); },
};

let filtroGeneral = '3s';
const vHistorialGeneral = {
  html() {
    const hoy = new Date(hoyISO());
    const hace21 = new Date(hoy); hace21.setDate(hoy.getDate() - 21);
    const lim = hace21.toISOString().slice(0, 10);
    let movs = ordenarMovs(D.movs);
    if (filtroGeneral === '3s') movs = movs.filter((m) => m.fecha >= lim);
    if (filtroGeneral === 'in') movs = movs.filter((m) => m.tipo === 'ingreso');
    if (filtroGeneral === 'out') movs = movs.filter((m) => m.tipo === 'gasto');
    const f = (id, t) => `<button class="filtro ${filtroGeneral === id ? 'activo' : ''}" data-filtro="${id}">${t}</button>`;
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">Historial general</h1>
      <div class="banner-azul"><small>TU RESUMEN</small><h2>Movimientos recientes</h2><p>Entradas y salidas de las últimas 3 semanas</p></div>
      <div class="filtros">${f('3s', 'Últimas 3 semanas')}${f('todo', 'Todo')}${f('in', 'Entradas')}${f('out', 'Salidas')}</div>
      <div class="fila entre" style="flex-wrap:wrap"><h2 class="subtitulo" style="margin-top:8px">${filtroGeneral === '3s' ? 'Últimas 3 semanas:' : 'Movimientos:'}</h2>
        <div class="fila"><button class="btn btn--verde btn--chico" data-accion="nuevo-mov" data-tipo="ingreso">+ Ingreso</button><button class="btn btn--rojo btn--chico" data-accion="nuevo-mov" data-tipo="gasto">+ Gasto</button></div></div>
      ${movs.map((m) => movHTML(m)).join('') || '<p class="vacio">No hay movimientos en este periodo.</p>'}
      <p class="muted" style="font-size:14px">Total entradas: <b class="verde">${fmt(sum(movs.filter((m) => m.tipo === 'ingreso').map((m) => m.monto)))}</b> · Total salidas: <b class="rojo">${fmt(sum(movs.filter((m) => m.tipo === 'gasto').map((m) => m.monto)))}</b></p>
    </div>`;
  },
  bind() { $$('[data-filtro]').forEach((b) => b.addEventListener('click', () => { filtroGeneral = b.dataset.filtro; render(); })); },
};

/* Historial mensual (frames "Historial Enero" … "Historial Diciembre") */
const vMes = {
  html(k) {
    if (!/^\d{4}-\d{2}$/.test(k)) return noEncontrado();
    const t = totalesMes(k);
    return `<div class="pagina"><h1 class="titulo-pagina">Historial mensual (${nombreMes(k).toUpperCase()} ${k.slice(0, 4)})</h1>
      <div class="fila entre" style="flex-wrap:wrap;margin-bottom:20px">
        <div class="fila"><a class="btn btn--sec btn--chico" href="#/mes/${sumarMeses(k, -1)}">← ${cap(nombreMes(sumarMeses(k, -1)))}</a><a class="btn btn--sec btn--chico" href="#/mes/${sumarMeses(k, 1)}">${cap(nombreMes(sumarMeses(k, 1)))} →</a></div>
        <div class="fila"><a class="btn btn--rojo btn--chico" href="#/registrar-gastos?mes=${k}">Editar gastos</a><a class="btn btn--verde btn--chico" href="#/registrar-ingresos?mes=${k}">Editar ingresos</a></div>
      </div>
      ${t.tieneDatos ? '' : `<div class="banner-datos"><p>Este mes no tiene registros. Los meses sin registros equivalen a $0.</p></div>`}
      <section class="grid g4">
        ${kpiHTML({ titulo: 'Ingreso mensual', valor: t.ingresos, icono: IC.tendencia, clase: 'ico--verde', href: '#/ingresos' })}
        ${kpiHTML({ titulo: 'Gastos fijos', valor: t.deudas, icono: IC.billetera, clase: 'ico--rojo', href: '#/gastos' })}
        ${kpiHTML({ titulo: 'Gastos hormiga', valor: t.hormiga, icono: IC.monedas, clase: 'ico--naranja', href: '#/categoria/hormiga', nota: 'Aprox.' })}
        ${kpiHTML({ titulo: 'Ahorro', valor: t.ahorro, icono: IC.alcancia, clase: 'ico--cian', href: '#/mes/' + k })}
      </section>
      <section class="grid g2" style="margin-top:32px">
        <div class="card"><h3>Ingresos pasivos</h3>${tablaFilas([...FUENTES.map(([c, n]) => ({ l: n, v: t.i[c] ?? null, color: 'verde' })), ...(t.i.otros || []).map((o) => ({ l: o.nombre, v: o.monto, color: 'verde' })), { l: 'Total Pasivos =', v: t.pasivosFuentes + t.pasivosOtros, color: 'verde', clase: 'total' }])}</div>
        <div class="card"><h3>Gastos mensuales</h3>${tablaFilas([...DEUDAS.map(([c, n]) => ({ l: n, v: t.g[c] ?? null, color: 'rojo' })), { l: 'Total deudas', v: t.deudas, color: 'rojo', clase: 'fuerte' }, ...HORMIGA.map(([c, n]) => ({ l: n + ' (hormiga)', v: t.g[c] ?? null, color: 'naranja' })), ...(t.g.otros || []).map((o) => ({ l: `${o.concepto} (${o.categoria})`, v: o.monto, color: 'rojo' })), { l: 'Total registrado =', v: t.deudas + t.hormigaForm + t.otrosForm, color: 'rojo', clase: 'total' }])}</div>
      </section>
      <section class="grid g2" style="margin-top:12px">
        <div><h2 class="subtitulo">Ingresos Mensuales:</h2>${ordenarMovs(t.movI).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin ingresos puntuales este mes.</p>'}
          <div class="anadir-fila"><button class="link-rojo verde" style="color:var(--verde)" data-accion="nuevo-mov" data-tipo="ingreso">+ Añadir Ingreso</button></div></div>
        <div><h2 class="subtitulo">Gastos Mensuales:</h2>${ordenarMovs(t.movG).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin gastos puntuales este mes.</p>'}
          <div class="anadir-fila"><button class="link-rojo" data-accion="nuevo-mov" data-tipo="gasto">+ Añadir Gasto</button></div></div>
      </section>
      <div class="card" style="margin-top:28px"><div class="fila entre" style="flex-wrap:wrap;gap:8px"><b>Total ingresos</b><b class="verde">${fmt(t.ingresos)}</b></div><div class="fila entre" style="flex-wrap:wrap;gap:8px;margin-top:6px"><b>Total egresos</b><b class="rojo">${fmt(t.gastos)}</b></div><div class="fila entre" style="flex-wrap:wrap;gap:8px;margin-top:6px;border-top:1px solid var(--borde);padding-top:8px"><b>Balance / Disponible</b><b class="azul">${fmt(t.ahorro)}</b></div></div>
    </div>`;
  },
};
const vMesRedirect = (k) => { fijarMes(k); return vMes.html(k); };

/* Historial de ingresos (frame "Historial Ingresos") */
const vIngresos = {
  html() {
    const t = totalesMes(mesSel);
    return `<div class="pagina"><h1 class="titulo-pagina">Historial de ingresos</h1>
      <div class="fila entre" style="flex-wrap:wrap;margin-bottom:22px">${selectorMes()}<a class="btn btn--verde btn--chico" href="#/registrar-ingresos?mes=${mesSel}">Registrar ingresos pasivos</a></div>
      <section class="grid g4">
        ${kpiHTML({ titulo: 'Ingreso mensual', valor: t.ingresos, icono: IC.tendencia, clase: 'ico--verde', href: '#/ingresos' })}
        ${kpiHTML({ titulo: 'Ingresos activos', valor: t.activos, icono: IC.billetera, clase: 'ico--verde', href: '#/ingresos-mes' })}
        ${kpiHTML({ titulo: 'Ingresos pasivos', valor: t.pasivos, icono: IC.monedas, clase: 'ico--naranja', href: '#/ingresos-mes' })}
        ${kpiHTML({ titulo: 'Ahorro', valor: t.ahorro, icono: IC.alcancia, clase: 'ico--cian', href: '#/mes/' + mesSel })}
      </section>
      <section class="grid g2" style="margin-top:32px;align-items:start">
        ${tarjetaBarras6('Ingresos por mes', [{ nombre: 'Activos', color: '#1fad1f', campo: 'activos' }, { nombre: 'Pasivos', color: '#135f86', campo: 'pasivos' }])}
        ${tarjetaTorta(`Ingresos de ${nombreMes(mesSel)} por fuente`, ingresosParaGrafica(mesSel), 'No hay ingresos registrados este mes.')}
      </section>
      <section class="grid g2" style="margin-top:32px">
        <div class="card"><h3>Ingresos pasivos</h3>${tablaFilas([...FUENTES.map(([c, n]) => ({ l: n, v: t.i[c] ?? null, color: 'verde' })), ...(t.i.otros || []).map((o) => ({ l: o.nombre, v: o.monto, color: 'verde' })), ...(t.pasivosMov ? [{ l: 'Ingresos pasivos puntuales', v: t.pasivosMov, color: 'verde' }] : []), { l: 'Total Pasivos =', v: t.pasivos, color: 'verde', clase: 'total' }])}</div>
        <div class="card"><h3>Resumen del mes</h3>${tablaFilas([{ l: 'Salario mensual', v: t.salario, color: 'verde' }, { l: 'Otros ingresos activos', v: t.activosMov, color: 'verde' }, { l: 'Ingresos pasivos', v: t.pasivos, color: 'verde' }, { l: 'Egresos (deudas + hormiga + otros)', v: t.gastos, color: 'rojo' }, { l: 'Balance disponible', v: t.ahorro, color: 'azul', clase: 'fuerte' }, { l: 'Total Ingresos =', v: t.ingresos, color: 'verde', clase: 'total' }])}</div>
      </section>
      <h2 class="subtitulo">Ingresos Mensuales:</h2>
      ${ordenarMovs(t.movI).map((m) => movHTML(m)).join('') || '<p class="vacio">No hay ingresos puntuales este mes.</p>'}
      <div class="anadir-fila"><button class="link-rojo" style="color:var(--verde)" data-accion="nuevo-mov" data-tipo="ingreso">+ Añadir Ingreso</button></div>
    </div>`;
  },
};

/* Ingresos mensual (frame "Ingresos Mensual") */
const vIngresosMes = {
  html() {
    const t = totalesMes(mesSel);
    return `<div class="pagina"><h1 class="titulo-pagina">Historial de ingresos mensual</h1>
      <div style="margin-bottom:12px">${selectorMes()}</div>
      <h2 class="subtitulo">Ingresos:</h2>
      ${ordenarMovs(t.movI).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin ingresos puntuales este mes.</p>'}
      <div class="anadir-fila"><button class="link-rojo" style="color:#000" data-accion="nuevo-mov" data-tipo="ingreso">Agregar Ingreso</button></div>
      <section class="grid g2" style="margin-top:12px">
        <div><h2 class="subtitulo">Procedente de:</h2><div class="card">${tablaFilas([...FUENTES.map(([c, n]) => ({ l: n, v: t.i[c] ?? null, color: 'verde' })), ...(t.i.otros || []).map((o) => ({ l: o.nombre, v: o.monto, color: 'verde' })), ...t.movI.filter((m) => m.clase === 'pasivo').map((m) => ({ l: `${m.desc} · ${fmtFecha(m.fecha)}`, v: m.monto, color: 'verde' })), { l: 'Total pasivos =', v: t.pasivos, color: 'verde', clase: 'total' }])}</div></div>
        <div><h2 class="subtitulo">Ingresos Activos:</h2><div class="card">${tablaFilas([{ l: 'Salario mensual', v: t.salario, color: 'verde' }, ...t.movI.filter((m) => m.clase !== 'pasivo').map((m) => ({ l: `${m.desc} · ${fmtFecha(m.fecha)}`, v: m.monto, color: 'verde' })), { l: 'Total activos =', v: t.activos, color: 'verde', clase: 'total' }])}</div></div>
      </section></div>`;
  },
};

/* Gastos mensual (frame "Gastos Mensual") */
const vGastosMes = {
  html() {
    const t = totalesMes(mesSel);
    const cats = gastoPorCategoria(mesSel).filter((c) => c.value);
    return `<div class="pagina"><h1 class="titulo-pagina">Historial de gastos mensual</h1>
      <div style="margin-bottom:12px">${selectorMes()}</div>
      <h2 class="subtitulo">Gastos:</h2>
      ${ordenarMovs(t.movG).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin gastos puntuales este mes.</p>'}
      <div class="anadir-fila"><button class="link-rojo" style="color:#000" data-accion="nuevo-mov" data-tipo="gasto">Agregar Gasto</button></div>
      <section class="grid g2" style="margin-top:12px">
        <div><h2 class="subtitulo">Gastado en:</h2><div class="card">${cats.length ? tablaFilas([...cats.map((c) => ({ l: c.label, v: c.value, color: 'rojo' })), { l: 'Total =', v: t.hormiga + t.otros, color: 'rojo', clase: 'total' }]) : '<p class="vacio">Sin gastos por categoría.</p>'}</div></div>
        <div><h2 class="subtitulo">Pagos Pendientes:</h2><div class="card">${tablaFilas([...DEUDAS.map(([c, n]) => ({ l: n, v: t.g[c] ?? null, color: 'rojo' })), { l: 'Total deudas =', v: t.deudas, color: 'rojo', clase: 'total' }])}</div></div>
      </section></div>`;
  },
};

/* ---------------------------------------------------------------------
   10. Gastos: historial y tipos de gasto
   --------------------------------------------------------------------- */
const vGastos = {
  html() {
    const t = totalesMes(mesSel);
    const cats = gastoPorCategoria(mesSel);
    const tipos = totalPorTipo(mesSel);
    const perdidas = sum(t.movG.filter((m) => m.cat === 'perdidas').map((m) => m.monto)) + sum((t.g.otros || []).filter((o) => o.categoria === 'Pérdidas').map((o) => o.monto));
    const sacado = Math.max(0, t.gastos - t.ingresos);
    return `<div class="pagina"><h1 class="titulo-pagina">Historial de gastos</h1>
      <div class="fila entre" style="flex-wrap:wrap;margin-bottom:22px">${selectorMes()}<a class="btn btn--rojo btn--chico" href="#/registrar-gastos?mes=${mesSel}">Registrar gastos</a></div>
      <section class="grid g4">
        ${kpiHTML({ titulo: 'Gasto mensual', valor: t.gastos, icono: IC.billetera, clase: 'ico--rojo', href: '#/gastos-mes' })}
        ${kpiHTML({ titulo: 'Total deudas', valor: t.deudas, icono: IC.billetera, clase: 'ico--rojo', href: '#/gastos-mes' })}
        ${kpiHTML({ titulo: 'Pérdidas inversiones', valor: perdidas, icono: IC.monedas, clase: 'ico--naranja', href: '#/categoria/perdidas' })}
        ${kpiHTML({ titulo: 'Sacado de ahorro', valor: sacado, icono: IC.alcancia, clase: 'ico--cian', href: '#/mes/' + mesSel })}
      </section>
      <section class="grid g2" style="margin-top:32px;align-items:start">
        ${tarjetaBarras6('Gastos por mes', [{ nombre: 'Deudas', color: '#c94343', campo: 'deudas' }, { nombre: 'Hormiga', color: '#e8732f', campo: 'hormiga' }, { nombre: 'Otros', color: '#8a5cd1', campo: 'otros' }])}
        ${tarjetaTorta(`Gastos de ${nombreMes(mesSel)} por tipo`, gastosParaGrafica(mesSel), 'No hay gastos registrados este mes.')}
      </section>
      <section class="grid g2" style="margin-top:32px">
        <div class="card"><h3>Gastos mensuales</h3>${tablaFilas([...cats.filter((c) => c.value).map((c) => ({ l: c.label, v: c.value, color: 'rojo' })), { l: 'Total Gastos =', v: t.hormiga + t.otros, color: 'rojo', clase: 'total' }])}</div>
        <div class="card"><h3>Deudas</h3>${tablaFilas([...DEUDAS.map(([c, n]) => ({ l: n, v: t.g[c] ?? null, color: 'rojo' })), { l: 'Total deudas', v: t.deudas, color: 'rojo', clase: 'fuerte' }, { l: 'Gastos hormiga (aprox.)', v: t.hormiga, color: 'naranja' }, { l: 'Total egresos =', v: t.gastos, color: 'rojo', clase: 'total' }])}</div>
      </section>
      <section class="grid g2" style="margin-top:12px">
        <div><h2 class="subtitulo">Gastos Fijos</h2>${ordenarMovs(t.movG).map((m) => movHTML(m)).join('') || '<p class="vacio">Sin gastos puntuales este mes.</p>'}
          <div class="anadir-fila"><button class="link-rojo" data-accion="nuevo-mov" data-tipo="gasto">+ Añadir Gasto</button></div></div>
        <div><h2 class="subtitulo">Tipos de Gastos</h2>${Object.entries(CATS).map(([id, c]) => `<a class="tipo-gasto" href="#/categoria/${id}">${esc(c.nombre)}<span>${fmt(tipos[id])}</span></a>`).join('')}</div>
      </section></div>`;
  },
};

const vCategoria = {
  html(id) {
    const c = CATS[id]; if (!c) return noEncontrado();
    const movs = ordenarMovs(movsDelMes(mesSel).filter((m) => m.tipo === 'gasto' && m.cat === id));
    const total = totalPorTipo(mesSel)[id];
    const delForm = (totalesMes(mesSel).g.otros || []).filter((o) => catDeExtra(o.categoria) === id);
    const lista = (sub, unaLista) => {
      const items = unaLista ? movs : movs.filter((m) => m.sub === sub);
      return `<div class="cat-lista">${items.map((m) => movHTML(m)).join('') || '<div class="mov sin-punto"><span class="muted">Sin gastos registrados</span><span class="desc">Descripción y fecha</span></div>'}
        <div class="anadir-fila"><button class="link-rojo" data-accion="nuevo-mov" data-tipo="gasto" data-cat="${id}" data-sub="${esc(unaLista ? c.subs[0] : sub)}">Añadir Gasto</button><span class="desc muted" style="margin-left:auto;font-size:14px">Descripción y fecha</span></div></div>`;
    };
    let cuerpo;
    if (c.unaLista) cuerpo = `<h2 class="subtitulo">${id === 'hormiga' ? 'Gastos hormiga puntuales' : esc(c.subs[0])}</h2>${lista(null, true)}`;
    else cuerpo = `<h2 class="subtitulo">${esc(c.subs[0])}</h2>${lista(c.subs[0])}
      <div class="grid g2">${c.subs.slice(1).map((s) => `<div><h2 class="subtitulo">${esc(s)}${s.endsWith('otros') ? ':' : ''}</h2>${lista(s)}</div>`).join('')}</div>`;
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">${esc(c.titulo)}</h1>
      <div class="fila entre" style="flex-wrap:wrap;margin-bottom:8px">${selectorMes()}<b>Total del mes: <span class="rojo">${fmt(total)}</span></b></div>
      ${c.texto ? `<h2 class="subtitulo">¿Qué es un gasto hormiga?</h2><p class="texto-grande">${esc(c.texto)}</p>
        <div class="card"><h3>Registrados en el formulario del mes</h3>${tablaFilas([...HORMIGA.map(([k, n]) => ({ l: n, v: totalesMes(mesSel).g[k] ?? null, color: 'naranja' })), { l: 'Total gastos hormiga =', v: total, color: 'naranja', clase: 'total' }])}
        <div style="margin-top:10px"><a class="link" href="#/registrar-gastos?mes=${mesSel}">Editar en Registrar gastos →</a></div></div>` : ''}
      ${delForm.length ? `<div class="card" style="margin-top:16px"><h3>Registrados en el formulario del mes</h3>${tablaFilas([...delForm.map((o) => ({ l: o.categoria && o.categoria !== c.nombre ? `${o.concepto} · ${o.categoria}` : o.concepto, v: o.monto, color: 'rojo' })), { l: 'Total del formulario =', v: sum(delForm.map((o) => o.monto)), color: 'rojo', clase: 'total' }])}
        <div style="margin-top:10px"><a class="link" href="#/registrar-gastos?mes=${mesSel}">Editar en Registrar gastos →</a></div></div>` : ''}
      ${cuerpo}</div>`;
  },
};

/* ---------------------------------------------------------------------
   11. Registrar gastos / ingresos (formularios mensuales)
   --------------------------------------------------------------------- */
function formMesAnio(k) {
  const y = +k.slice(0, 4), m = +k.slice(5, 7);
  const anios = [y - 1, y, y + 1];
  return `<div class="fila-mes"><div class="campo"><label for="fMes">Mes</label><select class="input" id="fMes"><option value="">Selecciona el mes</option>${MESES.map((n, i) => `<option value="${i + 1}" ${i + 1 === m ? 'selected' : ''}>${cap(n)}</option>`).join('')}</select><span class="error" id="fMesErr"></span></div>
    <div class="campo"><label for="fAnio">Año</label><select class="input" id="fAnio">${anios.map((a) => `<option ${a === y ? 'selected' : ''}>${a}</option>`).join('')}</select></div></div>`;
}
function claveForm() { const m = $('#fMes').value; return m ? `${$('#fAnio').value}-${String(m).padStart(2, '0')}` : null; }

function vRegistrar(tipo) {
  const esG = tipo === 'gastos';
  let extras = [];
  return {
    html(q) {
      const k = /^\d{4}-\d{2}$/.test(q.get('mes') || '') ? q.get('mes') : mesSel;
      return `<div class="pagina pagina--estrecha reg"><h1>${esG ? 'Registrar gastos' : 'Registrar Ingresos'}</h1>
      <form id="fReg" novalidate>
        <p class="intro">${esG ? 'Elige el mes de 2026 y completa sus gastos mensuales. Todos los importes están en pesos.' : 'Elige el mes de 2026 y registra los ingresos pasivos recibidos. Todos los importes están en pesos.'}</p>
        ${formMesAnio(k)}
        <p class="ayuda" id="yaReg" hidden></p>
        ${esG ? `
        <div class="reg-grupo"><div class="reg-grupo__t rojo"><span class="ico ico--rojo">${IC.billetera}</span>Deudas mensuales</div>
          <div class="reg-caja"><p class="ayuda">Registra lo que pagaste durante el mes.</p>${DEUDAS.map(([c, n]) => campoDinero('g_' + c, n)).join('')}</div></div>
        <div class="reg-grupo"><div class="reg-grupo__t" style="color:var(--naranja-2)"><span class="ico ico--naranja">${IC.bolsa}</span>Gastos hormiga</div>
          <div class="reg-caja"><p class="ayuda">Suma los pequeños gastos de cada categoría.</p>${HORMIGA.map(([c, n]) => campoDinero('g_' + c, n)).join('')}</div></div>
        <div class="reg-grupo"><div class="fila entre"><b>Añadir otro gasto</b><span class="ayuda">Opcional</span></div>
          <div class="reg-caja" style="margin-top:8px"><div id="listaExtras"></div>
            <div class="campo"><label for="xConcepto">Concepto</label><input class="input" id="xConcepto" placeholder="Escribe el concepto del gasto" maxlength="60"></div>
            <div class="campo"><label for="xCat">Categoría</label><select class="input" id="xCat"><option value="">Selecciona una categoría</option>${CAT_OTRO_GASTO.map((c) => `<option>${c}</option>`).join('')}</select></div>
            ${campoDinero('xMonto', 'Importe en pesos')}
            <span class="error" id="xErr" style="display:block;margin:-6px 0 8px"></span>
            <button type="button" class="btn-anadir azul" id="btnExtra">+ Añadir gasto</button></div></div>`
    : `
        <div class="reg-grupo"><div class="reg-grupo__t verde"><span class="ico ico--verde">${IC.tendencia}</span>Ingresos pasivos</div>
          <div class="reg-caja"><p class="ayuda">Registra lo que recibiste de cada fuente durante el mes.</p>${FUENTES.map(([c, n]) => campoDinero('i_' + c, n)).join('')}</div></div>
        <div class="reg-grupo"><div class="fila entre"><b>Añadir otra fuente de ingreso</b><span class="ayuda">Opcional</span></div>
          <div class="reg-caja" style="margin-top:8px"><div id="listaExtras"></div>
            <div class="campo"><label for="xConcepto">Nombre o concepto de la fuente</label><input class="input" id="xConcepto" placeholder="Escribe el nombre de la fuente" maxlength="60"></div>
            ${campoDinero('xMonto', 'Importe en pesos')}
            <span class="error" id="xErr" style="display:block;margin:-6px 0 8px"></span>
            <button type="button" class="btn-anadir verde" id="btnExtra">+ Añadir fuente</button></div></div>`}
        <div class="reg-grupo"><b>Resumen del mes</b><div class="resumen" style="margin-top:8px" id="resumen"></div></div>
        <p class="ayuda" style="margin-top:14px">${esG ? 'Los campos vacíos no equivalen a $0. Completa los importes para obtener el total del mes.' : 'Los campos vacíos no equivalen a $0. Registra 0 solo si no recibiste ingreso de una fuente durante el mes.'}</p>
        <div class="form-error" id="regErr" hidden></div>
        <button class="btn btn--bloque" style="margin-top:8px">${esG ? 'Guardar gastos' : 'Guardar ingresos'}</button>
        <div style="text-align:center;margin-top:14px"><button type="button" class="link" id="cancelar">Cancelar</button></div>
      </form></div>`;
    },
    bind() {
      const pref = esG ? 'g_' : 'i_';
      const campos = esG ? [...DEUDAS, ...HORMIGA] : FUENTES;
      const cargar = () => {
        const k = claveForm();
        const src = k && D.meses[k] ? (esG ? D.meses[k].gastos : D.meses[k].ingresos) || {} : {};
        campos.forEach(([c]) => { const v = src[c]; $('#' + pref + c).value = v == null ? '' : Number(v).toLocaleString('es-CO'); });
        extras = (src.otros || []).map((o) => ({ ...o }));
        const ya = $('#yaReg');
        ya.hidden = !(k && D.meses[k] && (esG ? D.meses[k].gastos : D.meses[k].ingresos));
        ya.textContent = 'Este mes ya tiene registros: puedes editarlos y volver a guardar.';
        pintarExtras(); resumen();
      };
      const pintarExtras = () => {
        $('#listaExtras').innerHTML = extras.map((x, i) => `<div class="extra-item"><span>${esc(esG ? x.concepto : x.nombre)}${esG ? ` <span class="muted">· ${esc(x.categoria)}</span>` : ''}</span><span class="fila"><b>${fmt(x.monto)}</b><button type="button" class="icon-btn" data-quitar="${i}" aria-label="Quitar">${IC.basura}</button></span></div>`).join('');
        $$('[data-quitar]').forEach((b) => b.addEventListener('click', () => { extras.splice(+b.dataset.quitar, 1); pintarExtras(); resumen(); }));
      };
      const valor = (c) => parseDinero($('#' + pref + c).value);
      const fila = (l, vals) => { const lleno = vals.some((v) => v != null); return `<div class="r"><span>${l}</span><b>${lleno ? fmt(sum(vals)) : 'Pendiente de completar'}</b></div>`; };
      const resumen = () => {
        let html, todos;
        if (esG) {
          const d = DEUDAS.map(([c]) => valor(c)), h = HORMIGA.map(([c]) => valor(c)), o = extras.map((x) => x.monto);
          todos = [...d, ...h, ...o];
          html = fila('Deudas', d) + fila('Gastos hormiga', h) + fila('Otros gastos', o);
        } else {
          const f = FUENTES.map(([c]) => valor(c)), o = extras.map((x) => x.monto);
          todos = [...f, ...o];
          html = fila('Fuentes existentes', f) + fila('Otras fuentes', o);
        }
        const lleno = todos.some((v) => v != null);
        html += `<div class="tot"><strong>${esG ? 'Total del mes' : 'Total de ingresos pasivos'}</strong><b class="${esG ? 'azul' : 'verde'}" style="font-size:16px">${lleno ? fmt(sum(todos)) : 'Pendiente de completar'}</b></div>`;
        $('#resumen').innerHTML = html;
      };
      $('#fReg').addEventListener('input', resumen);
      $('#fMes').addEventListener('change', cargar); $('#fAnio').addEventListener('change', cargar);
      /* ¿Quedó algo escrito en "Añadir otro gasto / fuente" sin pulsar el botón? */
      const extraPendiente = () => Boolean($('#xConcepto').value.trim() || parseDinero($('#xMonto').value) != null || (esG && $('#xCat').value));
      const anadirExtra = () => {
        const nombre = $('#xConcepto').value.trim(); const monto = parseDinero($('#xMonto').value); const cat = esG ? $('#xCat').value : '';
        const err = !nombre ? (esG ? 'Escribe el concepto del gasto.' : 'Escribe el nombre de la fuente.') : esG && !cat ? 'Selecciona una categoría.' : monto == null ? 'Escribe el importe.' : '';
        $('#xErr').textContent = err; if (err) return false;
        extras.push(esG ? { concepto: nombre, categoria: cat, monto } : { nombre, monto });
        $('#xConcepto').value = ''; $('#xMonto').value = ''; if (esG) $('#xCat').value = '';
        pintarExtras(); resumen();
        return true;
      };
      $('#btnExtra').addEventListener('click', anadirExtra);
      $('#cancelar').addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/finanzas'));
      $('#fReg').addEventListener('submit', (e) => {
        e.preventDefault();
        const k = claveForm();
        if (!marcarError('fMes', k ? '' : 'Selecciona el mes.')) { $('#fMes').focus(); return; }
        const er = $('#regErr');
        // Si el usuario escribió un gasto adicional pero no pulsó "+ Añadir", se añade ahora para no perderlo
        if (extraPendiente() && !anadirExtra()) {
          er.textContent = esG ? 'Completa el gasto adicional (concepto, categoría e importe) o bórralo antes de guardar.' : 'Completa la fuente adicional (nombre e importe) o bórrala antes de guardar.';
          er.hidden = false; $('#xErr').scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
        }
        const obj = {}; campos.forEach(([c]) => { obj[c] = valor(c); });
        const algo = Object.values(obj).some((v) => v != null) || extras.length;
        if (!algo) { er.textContent = 'Completa al menos un importe antes de guardar.'; er.hidden = false; return; }
        er.hidden = true;
        obj.otros = extras.map((x) => ({ ...x }));
        D.meses[k] = D.meses[k] || {};
        D.meses[k][esG ? 'gastos' : 'ingresos'] = obj;
        if (!guardar()) { er.textContent = 'No se pudieron guardar los datos en este navegador. Revisa que no estés en modo incógnito ni con el almacenamiento lleno e inténtalo de nuevo.'; er.hidden = false; return; }
        fijarMes(k);
        $('#fReg button.btn--bloque').disabled = true; // evita guardar dos veces mientras se redirige
        abrirModal(`<div style="text-align:center"><div class="check-ok">${IC.check}</div><h2>${esG ? '¡Gastos guardados!' : '¡Ingresos guardados!'}</h2><p>${esG ? 'Te estamos llevando a tu historial de gastos.' : 'Te estamos llevando a tu historial de ingresos pasivos.'}</p></div>`);
        setTimeout(() => { cerrarModal(); location.hash = esG ? '#/gastos' : '#/ingresos'; }, 1600);
      });
      cargar();
    },
  };
}
const vRegGastos = vRegistrar('gastos');
const vRegIngresos = vRegistrar('ingresos');

/* ---------------------------------------------------------------------
   12. Educación: conceptos, menú de cada concepto y calculadoras
   --------------------------------------------------------------------- */
const CONCEPTOS = [
  { id: 'interes', n: '01', color: '#0d54c7', titulo: 'Interés compuesto', grande: 'Interes compuesto', desc: 'Los intereses ganados se suman al capital y generan más intereses. Es la base del ahorro e inversión a largo plazo (y de las deudas que crecen rápido).', sim: 'Simulación del interes compuesto', real: 'Mostrar el interes compuesto de verdad' },
  { id: 'inflacion', n: '02', color: '#d9591a', titulo: 'Inflación', grande: 'Inflacion', desc: 'El aumento general de precios hace que con el mismo dinero compres menos con el tiempo. Una inversión que rinde 9% con inflación de 7% solo te da un 2% de ganancia real.', sim: 'Simulación de inflación', real: 'Mostrar la inflación en la realidad' },
  { id: 'fondo', n: '03', color: '#0d9487', titulo: 'Fondo de emergencias', grande: 'Fondos de emergencias', desc: 'Un colchón de dinero para imprevistos (pérdida de empleo, salud, reparaciones) que evita endeudarte o vender inversiones en mal momento. La regla común es 3 a 6 meses de gastos esenciales (más si el ingreso es variable).', sim: 'Simulación del fondo de emergencias', real: 'Crear tu fondo de emergencias' },
  { id: 'cdt', n: '04', color: '#7345d1', titulo: 'CDT', grande: 'CDT', desc: 'Un Certificado de Depósito a Término, dejas tu dinero inmovilizado en un banco por un plazo fijo y a cambio recibes una tasa pactada. Es de bajo riesgo, pero tiene poca liquidez: sacar el dinero antes suele implicar penalización o no es posible.', sim: 'Simulación del CDT', real: 'Hacer el CDT de verdad' },
  { id: 'credito', n: '05', color: '#cc334d', titulo: 'Crédito', grande: 'Credito', desc: 'La misma deuda puede costar muy distinto según cómo se exprese la tasa. La tasa nominal mensual vencida (NMV) no incluye la capitalización; la efectiva anual (EA) sí, y es la que permite comparar de verdad. Además, en un crédito con cuota fija, al inicio pagas mucho más interés que capital.', sim: 'Simulación del funcionamiento del credito', real: 'Ver como funcionaria el credito en tus finanzas' },
  { id: 'acciones', n: '06', color: '#1a8c40', titulo: 'Acciones', grande: 'Acciones', desc: 'Comprar una acción es adquirir una parte de una empresa. Su precio sube y baja (volatilidad), y puede dar ganancias por valorización y dividendos, pero también pérdidas. Diversificar (varias acciones, sectores, ETFs, renta fija) reduce el riesgo de que un solo activo te afecte demasiado.', sim: 'Simulación de acciones', real: 'Comprar acciones de verdad' },
];
const vEducacion = {
  html: () => `<div class="pagina"><h1 class="titulo-pagina normal">Conceptos financieros</h1>
    <div class="grid g2 conceptos">${CONCEPTOS.map((c) => `<article class="card"><span class="num" style="background:${c.color}">${c.n}</span><h2>${esc(c.titulo)}</h2><p>${esc(c.desc)}</p><a href="#/concepto/${c.id}" style="color:${c.color}">Ver más  →</a></article>`).join('')}</div></div>`,
};
const vConcepto = {
  html(id) {
    const c = CONCEPTOS.find((x) => x.id === id); if (!c) return noEncontrado();
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">${esc(c.grande)}</h1>
      <div class="card concepto-desc">${esc(c.desc)}</div>
      <p class="que-desea">¿Qué desea hacer?</p>
      <div class="grid g2 opciones-grandes"><a href="#/calc/${c.id}/simulacion">${esc(c.sim)}</a><a href="#/calc/${c.id}/real">${esc(c.real)}</a></div></div>`;
  },
};

/* Fórmulas de cada calculadora (textos del Figma) */
const CALC = {
  interes: {
    tSim: 'Simulación de interes compuesto', tReal: 'Como funciona el interes compuesto en la realidad',
    nombre: 'Interés compuesto', lema: 'Los intereses ganados también generan intereses: el ahorro crece cada vez más rápido.',
    quees: 'Cuando dejas tu dinero ganando intereses, esos intereses se suman al capital y desde ese momento también ganan. Entre más tiempo pase, mayor es el efecto.',
    como: 'Con aportes mensuales: valor final = capital × (1+i)^n + aporte × ((1+i)^n − 1) / i, donde i es la tasa mensual y n los meses.',
    tener: 'Empezar temprano pesa más que ahorrar mucho de golpe. Lo mismo pasa con las deudas: los intereses también se acumulan en tu contra.',
    revision: ['Confirma si la tasa es mensual o anual.', 'Revisa si el aporte es fijo cada mes.', 'Compara lo que pusiste con lo que ganaste.'],
    supuestos: ['La tasa mensual no cambia.', 'Aportas el mismo valor cada mes.', 'Los intereses se reinvierten.'],
    limites: ['No incluye impuestos distintos a los indicados ni comisiones.', 'Usa una tasa constante; en la vida real las tasas cambian.'],
    campos: [{ k: 'c', l: 'Capital inicial', d: true, ej: 1000000 }, { k: 'a', l: 'Aporte mensual (opcional)', d: true, ej: 200000, op: true }, { k: 't', l: 'Tasa mensual (%)', ej: 1 }, { k: 'n', l: 'Meses', ej: 12, entero: true }],
    calc({ c, a = 0, t, n }) {
      if (n <= 0) return { error: 'Los meses deben ser mayores que 0.' };
      const i = t / 100, f = Math.pow(1 + i, n);
      const vf = i === 0 ? c + a * n : c * f + a * ((f - 1) / i);
      const ap = c + a * n, g = vf - ap;
      return { filas: [['Valor final', fmtSin(vf)], ['Lo que aportaste', fmtSin(ap)], ['Intereses ganados', fmtSin(g)]],
        msg: vf > 0 ? [`De cada $100 al final, $${Math.round((g / vf) * 100)} los ganó el dinero solo.`, g >= 0 ? 'ok' : 'bad'] : null };
    },
  },
  inflacion: {
    tSim: 'Simulación de como funciona la inflación', tReal: 'Como funciona la inflacion en la realidad',
    nombre: 'Inflación', lema: 'Con el mismo dinero compras menos cada año. Lo que importa es cuánto ganas después de la inflación.',
    quees: 'La inflación es el aumento general de los precios. Un saldo que no crece pierde poder de compra aunque la cifra siga igual.',
    como: 'Poder de compra futuro = dinero hoy / (1 + inflación)^años. Rentabilidad real = (1 + tasa) / (1 + inflación) - 1.',
    tener: 'Una inversión que paga 9% con inflación de 7% deja una ganancia real de solo 1,87%.',
    revision: ['Usa la inflación anual del DANE o del Banco de la República.', 'Compara tasas e inflación del mismo periodo.', 'Mira la ganancia real, no solo la nominal.'],
    supuestos: ['La inflación es constante.', 'No hay impuestos sobre la inversión.', 'La tasa es anual y efectiva.'],
    limites: ['No incluye impuestos distintos a los indicados ni comisiones.', 'Usa una tasa constante; en la vida real las tasas cambian.'],
    campos: [{ k: 'd', l: 'Dinero hoy', d: true, ej: 1000000 }, { k: 'p', l: 'Inflación anual (%)', ej: 7 }, { k: 'y', l: 'Años', ej: 5 }, { k: 't', l: 'Tasa de tu inversión (%) (opcional)', ej: 9, op: true }],
    calc({ d, p, y, t }) {
      if (y <= 0) return { error: 'Los años deben ser mayores que 0.' };
      if (p <= -100) return { error: 'La inflación debe ser mayor que -100%.' };
      const fp = Math.pow(1 + p / 100, y);
      const filas = [['Poder de compra futuro (sin invertir)', fmtSin(d / fp)], ['Necesitarías para igualar tu dinero de hoy', fmtSin(d * fp)]];
      if (t == null) return { filas, msg: [`Sin invertir, en ${y} años pierdes ${fmtPct((1 - 1 / fp) * 100, 1)} de tu poder de compra.`, 'warn'] };
      const real = (1 + t / 100) / (1 + p / 100) - 1;
      filas.push(['Rentabilidad real anual', fmtPct(real * 100)], ['Tu inversión al final (pesos de hoy)', fmtSin(d * Math.pow(1 + real, y))]);
      return { filas, msg: real > 0 ? ['Tu inversión le gana a la inflación.', 'ok'] : real < 0 ? ['Tu inversión pierde contra la inflación: pierdes poder de compra.', 'bad'] : ['Tu inversión apenas iguala a la inflación.', 'warn'] };
    },
  },
  fondo: {
    tSim: 'Simulación de fondo de emergencias', tReal: 'Como hacer un fondo de emergencias',
    nombre: 'Fondo de emergencia', lema: 'Un colchón de dinero disponible para imprevistos, para no endeudarte ni vender inversiones a destiempo.',
    quees: 'Es dinero líquido para perder el empleo, una urgencia médica o una reparación. La regla común es de 3 a 6 meses de gastos esenciales.',
    como: 'Meta = gastos esenciales × meses objetivo. Meses para lograrlo = (meta − ahorro) / aporte. Meses que resistes = ahorro / gastos.',
    tener: 'Si tus ingresos cambian mucho de un mes a otro, apunta a más meses.',
    revision: ['Cuenta solo gastos esenciales.', 'Guárdalo donde puedas sacarlo rápido.', 'No lo mezcles con tus inversiones.'],
    supuestos: ['Tus gastos esenciales no cambian.', 'El aporte es constante.', 'El fondo no genera intereses.'],
    limites: ['No incluye impuestos distintos a los indicados ni comisiones.', 'Usa una tasa constante; en la vida real las tasas cambian.'],
    campos: [{ k: 'g', l: 'Gastos esenciales al mes', d: true, ej: 1800000 }, { k: 'm', l: 'Meses objetivo', ej: 6 }, { k: 's', l: 'Ahorrado hasta hoy', d: true, ej: 2000000 }, { k: 'a', l: 'Aporte mensual', d: true, ej: 400000 }],
    calc({ g, m, s, a }) {
      if (g <= 0) return { error: 'Los gastos esenciales deben ser mayores que $0.' };
      if (m <= 0) return { error: 'Los meses objetivo deben ser mayores que 0.' };
      const meta = g * m, falta = Math.max(0, meta - s), res = s / g;
      const meses = falta === 0 ? 'Ya lo lograste' : a > 0 ? `${Math.ceil(falta / a)} meses` : 'Sin aporte no se alcanza';
      const filas = [['Meta del fondo', fmtSin(meta)], ['Te falta', fmtSin(falta)], ['Meses para lograrlo', meses], ['Hoy resistes', `${res.toLocaleString('es-CO', { maximumFractionDigits: 1 })} meses`]];
      return { filas, msg: falta === 0 ? ['Verde: ya completaste tu fondo de emergencia.', 'ok'] : res >= 1 ? ['Amarillo: tienes colchón, pero aún no llegas a la meta.', 'warn'] : ['Rojo: tu ahorro aún no cubre un mes de gastos esenciales.', 'bad'] };
    },
  },
  cdt: {
    tSim: 'Simular un CDT', tReal: 'Hacer un CDT de verdad',
    nombre: 'CDT', lema: 'Prestas tu dinero al banco por un plazo fijo y recibes una tasa conocida desde el primer día.',
    quees: 'Un CDT inmoviliza tu dinero por un tiempo (90, 180, 360 días...). Es de bajo riesgo, pero sacar el dinero antes suele implicar perder parte de la ganancia.',
    como: 'Tasa del plazo = (1 + EA)^(días/365) - 1. Ganancia bruta = capital × tasa del plazo. Ganancia neta = bruta − retención en la fuente.',
    tener: 'La tasa que anuncia el banco es anual (EA). Un CDT a 180 días no paga la tasa completa, solo la proporción del plazo.',
    revision: ['Verifica que la tasa sea EA.', 'Pregunta por la penalización si retiras antes.', 'Revisa el porcentaje de retención vigente.'],
    supuestos: ['La tasa queda fija todo el plazo.', 'La retención se aplica sobre la ganancia.', 'No renuevas ni retiras antes.'],
    limites: ['No incluye impuestos distintos a los indicados ni comisiones.', 'Usa una tasa constante; en la vida real las tasas cambian.'],
    campos: [{ k: 'c', l: 'Capital', d: true, ej: 10000000 }, { k: 'ea', l: 'Tasa EA (%)', ej: 10 }, { k: 'dias', l: 'Plazo (días)', ej: 180, entero: true }, { k: 'r', l: 'Retención en la fuente (%)', ej: 4 }],
    calc({ c, ea, dias, r }) {
      if (dias <= 0) return { error: 'El plazo debe ser mayor que 0 días.' };
      if (r < 0 || r > 100) return { error: 'La retención debe estar entre 0% y 100%.' };
      const tp = Math.pow(1 + ea / 100, dias / 365) - 1, bruta = c * tp, ret = bruta * (r / 100), neta = bruta - ret;
      return { filas: [['Tasa del plazo', fmtPct(tp * 100)], ['Ganancia bruta', fmtSin(bruta)], ['Retención', fmtSin(ret)], ['Ganancia neta', fmtSin(neta)], ['Recibirás al final', fmtSin(c + neta)]], msg: ['La ganancia neta es lo que de verdad llega a tu bolsillo.', 'ok'] };
    },
  },
  credito: {
    tSim: 'Simulación de un credito', tReal: 'Como funciona el credito de verdad',
    nombre: 'Crédito', lema: 'La misma deuda cuesta distinto según cómo se exprese la tasa. Compara siempre en EA.',
    quees: 'La tasa nominal no incluye que los intereses se acumulan; la EA sí. Con cuota fija, al inicio pagas mucho más interés que capital.',
    como: 'EA = (1 + nominal/12)^12 − 1. Cuota = P × i / (1 − (1+i)^−n). Cada mes: interés = saldo × i, abono a capital = cuota − interés.',
    tener: 'Un abono extra reduce el saldo y, con él, los intereses de todos los meses siguientes.',
    revision: ['Convierte todas las tasas a EA.', 'Mira el costo total, no solo la cuota.', 'Pregunta si hay penalización por abonar.'],
    supuestos: ['La tasa es fija.', 'La cuota es fija y se paga a fin de mes.', 'El abono extra va a capital.'],
    limites: ['No incluye impuestos distintos a los indicados ni comisiones.', 'Usa una tasa constante; en la vida real las tasas cambian.'],
    campos: [{ k: 'p', l: 'Valor del crédito', d: true, ej: 10000000 }, { k: 'nom', l: 'Tasa nominal anual (%)', ej: 18 }, { k: 'n', l: 'Cuotas (meses)', ej: 12, entero: true }, { k: 'x', l: 'Abono extra mensual (opcional)', d: true, ej: 100000, op: true }],
    calc({ p, nom, n, x = 0 }, real) {
      if (p <= 0) return { error: 'El valor del crédito debe ser mayor que $0.' };
      if (n <= 0) return { error: 'El número de cuotas debe ser mayor que 0.' };
      const i = nom / 100 / 12, ea = Math.pow(1 + i, 12) - 1;
      const cuota = i === 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n));
      const intTot = cuota * n - p;
      let saldo = p, meses = 0, intExtra = 0;
      while (saldo > 0.5 && meses < 1200) { const it = saldo * i; intExtra += it; saldo = saldo + it - Math.min(cuota + x, saldo + it); meses++; }
      const filas = [['Tasa mensual', fmtPct(i * 100)], ['Tasa EA', fmtPct(ea * 100)], ['Cuota mensual', fmtSin(cuota)], ['Interés del 1.er mes', fmtSin(p * i)], ['Abono a capital del 1.er mes', fmtSin(cuota - p * i)], ['Intereses totales sin abono', fmtSin(intTot)]];
      if (x > 0) filas.push(['Con abono extra: cuotas', `${meses} de ${n}`], ['Intereses que te ahorras', fmtSin(intTot - intExtra)]);
      if (real) { const ing = totalesMes(mesSel).ingresos || num(D.perfil.salario); if (ing > 0) filas.push([`La cuota frente a tus ingresos de ${nombreMes(mesSel)}`, fmtPct(((cuota + x) / ing) * 100, 1)]); }
      return { filas, msg: x > 0 && meses < n ? [`Con el abono extra terminas ${n - meses} cuotas antes.`, 'ok'] : x > 0 ? ['El abono extra reduce los intereses, aunque no alcanza a quitar una cuota completa.', 'info'] : ['Prueba con un abono extra mensual para ver cuánto te ahorras.', 'info'] };
    },
  },
  acciones: {
    tSim: 'Simulación de acciones', tReal: 'Como comprar acciones de verdad',
    nombre: 'Acciones', lema: 'Compras una parte de una empresa: si le va bien ganas, si le va mal puedes perder.',
    quees: 'Una acción es una parte de una empresa. Si el precio sube y vendes, ganas; si baja, pierdes. Algunas empresas además reparten dividendos.',
    como: 'Acciones = dinero / precio por acción. Ganancia neta = acciones × (venta − compra) − comisiones. Rentabilidad = ganancia / total pagado.',
    tener: 'El precio sube y baja todos los días (volatilidad). Diversificar en varias acciones y sectores reduce el riesgo de que una sola te afecte demasiado.',
    revision: ['Compra solo empresas que entiendes.', 'Diversifica en varias acciones y sectores.', 'Invierte dinero que no necesites pronto.'],
    supuestos: ['El precio de venta es el que escribes.', 'La comisión se cobra al comprar y al vender.', 'No hay dividendos en este ejemplo.'],
    limites: ['No incluye impuestos sobre las ganancias.', 'El precio real cambia todos los días; aquí es un solo valor.'],
    campos: [{ k: 'd', l: 'Dinero a invertir', d: true, ej: 5000000 }, { k: 'pc', l: 'Precio por acción', d: true, ej: 20000 }, { k: 'pv', l: 'Precio de venta', d: true, ej: 24000 }, { k: 'c', l: 'Comisión (%)', ej: 1 }],
    calc({ d, pc, pv, c }) {
      if (pc <= 0) return { error: 'El precio por acción debe ser mayor que $0.' };
      if (c < 0 || c >= 100) return { error: 'La comisión debe estar entre 0% y 100%.' };
      const n = Math.floor(d / pc);
      if (n < 1) return { error: 'Con ese dinero no alcanzas a comprar ni una acción.' };
      const pagado = n * pc * (1 + c / 100), recibe = n * pv * (1 - c / 100), g = recibe - pagado;
      return { filas: [['Acciones compradas', n.toLocaleString('es-CO')], ['Total pagado (con comisión)', fmtSin(pagado)], ['Recibes al vender (neto)', fmtSin(recibe)], ['Ganancia neta', fmtSin(g)], ['Rentabilidad', fmtPct((g / pagado) * 100)]],
        msg: g > 0 ? ['Con estos precios ganas, pero el precio real puede bajar: no inviertas lo que no puedes perder.', 'warn'] : g < 0 ? ['Con estos precios pierdes dinero después de comisiones.', 'bad'] : ['Con estos precios quedas igual después de comisiones.', 'info'] };
    },
  },
};
const vCalc = {
  html(id, modo) {
    const c = CALC[id]; if (!c || !['simulacion', 'real'].includes(modo)) return noEncontrado();
    const sim = modo === 'simulacion';
    const lista = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<div class="pagina calc"><h1 class="titulo-pagina">${esc(sim ? c.tSim : c.tReal)}</h1>
      <div class="card" style="margin-bottom:16px"><h4 style="font-size:17px">${esc(c.nombre)}</h4><p>${esc(c.lema)}</p></div>
      <div class="grid g3" style="gap:16px">
        <div class="card"><h4>Qué es</h4><p>${esc(c.quees)}</p></div>
        <div class="card"><h4>Cómo se calcula</h4><p class="formula">${esc(c.como)}</p></div>
        <div class="card"><h4>Ten en cuenta</h4><p>${esc(c.tener)}</p></div>
        <div class="card"><h4>Lista de revisión</h4>${lista(c.revision)}</div>
        <div class="card"><h4>Supuestos</h4>${lista(c.supuestos)}</div>
        <div class="card"><h4>Límites del modelo</h4>${lista(c.limites)}</div>
      </div>
      <form class="card" id="fCalc" style="margin-top:22px" novalidate>
        <h4 style="font-size:17px;margin-bottom:14px">${sim ? 'Simula con datos de ejemplo' : 'Escribe tu dinero y calculamos'}</h4>
        <div class="calc-form">${c.campos.map((f) => `<div class="campo"><label for="c_${f.k}">${esc(f.l)}</label>${f.d
          ? `<div class="input-wrap"><span class="prefijo">$</span><input class="input" id="c_${f.k}" data-dinero inputmode="numeric" autocomplete="off" placeholder="Escribe el valor" value="${sim ? Number(f.ej).toLocaleString('es-CO') : ''}"></div>`
          : `<input class="input" id="c_${f.k}" inputmode="decimal" autocomplete="off" placeholder="Escribe el valor" value="${sim ? String(f.ej).replace('.', ',') : ''}">`}</div>`).join('')}</div>
        <div class="fila" style="margin-top:16px;flex-wrap:wrap"><button class="btn btn--chico">Calcular</button>${sim ? `<a class="link" href="#/calc/${id}/real">Probar con mis datos →</a>` : `<a class="link" href="#/calc/${id}/simulacion">Ver el ejemplo →</a>`}</div>
        <div class="resultado" id="res"></div>
      </form></div>`;
  },
  bind(id, modo) {
    const c = CALC[id]; if (!c) return;
    const calcular = () => {
      const v = {}; let falta = null, mal = null;
      c.campos.forEach((f) => {
        const raw = $('#c_' + f.k).value;
        const x = f.d ? parseDinero(raw) : parseNum(raw);
        if (x == null) { if (!f.op && !falta) falta = f.l; return; }
        if (Number.isNaN(x)) { if (!mal) mal = f.l; return; }
        if (f.entero && !Number.isInteger(x)) { if (!mal) mal = f.l + ' (debe ser un número entero)'; return; }
        v[f.k] = x;
      });
      const res = $('#res');
      if (falta) { res.innerHTML = `<div class="msg msg--bad">Completa el campo «${esc(falta)}».</div>`; return; }
      if (mal) { res.innerHTML = `<div class="msg msg--bad">Revisa el campo «${esc(mal)}»: escribe solo números.</div>`; return; }
      const r = c.calc(v, modo === 'real');
      if (r.error) { res.innerHTML = `<div class="msg msg--bad">${esc(r.error)}</div>`; return; }
      res.innerHTML = r.filas.map(([l, x]) => `<div class="r"><span>${esc(l)}</span><b>${esc(x)}</b></div>`).join('') + (r.msg ? `<div class="msg msg--${r.msg[1]}">${esc(r.msg[0])}</div>` : '');
    };
    $('#fCalc').addEventListener('submit', (e) => { e.preventDefault(); calcular(); });
    if (modo === 'simulacion') calcular();
    else $('#res').innerHTML = '<div class="msg msg--info">Completa los campos y pulsa Calcular.</div>';
  },
};

/* ---------------------------------------------------------------------
   13. Mercado (datos del archivo Figma: SIPSA-DANE, PropFound, CREG, etc.)
   --------------------------------------------------------------------- */
const CANASTA = [
  ['arroz', 'Arroz de primera', 3510.61, 3586.25], ['papa', 'Papa pastusa', 2516.07, 2885.0], ['yuca', 'Yuca', 2510.3, 2490.36],
  ['platano-verde', 'Plátano hartón verde', 2599.4, 2131.4], ['tomate', 'Tomate chonto', 4356.0, 3292.73], ['cebolla', 'Cebolla cabezona blanca', 2308.08, 2241.79],
  ['zanahoria', 'Zanahoria', 1391.15, 1200.89], ['frijol', 'Fríjol', 8471.46, 8528.36], ['pollo', 'Pechuga de pollo', 15550.76, 15480.17],
  ['feijoa', 'Feijoa', 11348.5, 5909.0], ['platano-maduro', 'Plátano dominico hartón maduro', 1383.5, 2196.0],
].map(([id, n, p, prev]) => ({ id, n, p, prev, ch: p - prev, pct: ((p - prev) / prev) * 100 }));
const FECHA_SIPSA = '26 oct 2026';

const VIVIENDA = {
  medellin: { n: 'Medellín', med: 7719298, zonas: '8 de 13 zonas', z: '13 zonas', sec: [['El Poblado', 8750000], ['Villa Hermosa', 8700000], ['Envigado', 8250000], ['Belén', 7236842], ['Laureles-Estadio', 6575342], ['La Candelaria', 5623024], ['Robledo', 4893617], ['Manrique', 4383562]], va: [9.53, 15.94, 10.11, 8.29, 5.58] },
  bogota: { n: 'Bogotá', med: 7625000, zonas: '8 de 14 zonas', z: '14 zonas', sec: [['Chapinero', 9591326], ['Santa Fe', 7782112], ['Teusaquillo', 7601185], ['Usaquén', 7352941], ['Suba', 7012987], ['Kennedy', 6785714], ['Engativá', 5921053], ['Bosa', 4166667]], va: [9.02, 6.41, 5.71, 9.11, 8.64] },
  cali: { n: 'Cali', med: 4366667, zonas: '5 zonas', z: '5 zonas', sec: [['Valle del Lili', 7155172], ['Granada', 4347826], ['Ciudad Jardín', 4191384], ['San Fernando', 4160590], ['El Ingenio', 3825758]], va: [6.59, 16.72, 7.6, 14.1, 6.99] },
  barranquilla: { n: 'Barranquilla', med: 4047619, zonas: '5 zonas', z: '5 zonas', sec: [['Villa Country', 4134615], ['Alto Prado', 4125000], ['Ciudad Jardín', 4102364], ['El Prado', 4037267], ['Riomar', 3861004]], va: [5.81, 13.88, 17.87, 9.22, 11.7] },
};
const GASOLINA = {
  ciudades: [['Cali', 16339], ['Bogotá', 16331], ['Medellín', 16251], ['Barranquilla', 15964], ['Promedio 13 ciudades', 15886]],
  serie: [['Ene', 16491], ['Feb', null], ['Mar', null], ['Abr', 15491], ['May', null], ['Jun', null], ['Jul', null], ['Ago', null], ['Sep', null], ['Oct', 16331], ['Nov', 16331]],
};
const TRANSPORTE = {
  publico: { sub: 'Pasaje del transporte masivo · 2026', t: 'Pasaje por ciudad', d: 'Tarifa plena · por viaje', filas: [['Medellín', 'Metro · tarifa frecuente', '$3.820', 'Eventual: $4.400'], ['Barranquilla', 'Transmetro', '$3.600', 'Dom. y festivos: $3.700'], ['Bogotá', 'TransMilenio / SITP', '$3.550', 'TransMiPass: $160.000/mes'], ['Cali', 'MIO', '$3.500', 'Bus básico: $3.000'], ['Bucaramanga', 'Metrolínea', '$3.000', 'Ruta larga: $3.600']], fuente: 'Fuente: Asocapitales y alcaldías · enero 2026' },
  taxi: { sub: 'Carrera mínima de taxi · 2026', t: 'Carrera mínima', d: 'Tarifa oficial · 2026', filas: [['Medellín', 'Banderazo $5.900', '$8.300', 'Eléctrico: $9.500'], ['Bogotá', 'Banderazo $4.500', '$8.000', 'Con app: $8.100 – $8.300'], ['Cali', 'Banderazo $3.700', '$7.100', 'Taxi de lujo: $9.100'], ['Barranquilla', 'Sin taxímetro', 'Se acuerda', 'Valor pactado con el conductor']], nota: ['¿Qué incluye?', 'La carrera mínima cubre el trayecto más corto. Los recargos nocturnos, de festivos y de aeropuerto se suman al valor.'], fuente: 'Fuente: Decreto 042 de 2026 (Bogotá) y alcaldías' },
  vehiculos: { sub: 'Los vehículos más baratos · 2026', bloques: [['Carros nuevos', 'Precio de lista · jul 2026', [['FAW Bestune Xiaoma', 'eléctrico', '$45.000.000'], ['Opel Rocks-e', 'cuadriciclo eléctrico', '$48.990.000'], ['JMEV 2', 'eléctrico', '$51.990.000'], ['CEVO C SE', 'cuadriciclo eléctrico', '$54.990.000'], ['Renault Kwid Intens', 'gasolina', '$55.990.000'], ['Kia Picanto Vibrant MT', 'gasolina', '$57.990.000']]], ['Motos nuevas', 'Referencia · 2026', [['AKT NKD 125', '125 cc', '$4.890.000'], ['Hero Eco 100', '100 cc', '$4.990.000'], ['Bajaj Boxer CT100', '100 cc', '$5.299.000 – $5.899.000']]]], fuente: 'Los precios son de lista y cambian según la ciudad, la versión y los descuentos del concesionario.' },
};
const TECNOLOGIA = {
  movil: { sub: 'Planes de datos móviles · 2026', t: 'Planes por operador', d: 'Por mes · pospago', filas: [['WOM', 'Pospago desde · 60 GB', '$44.990', 'Prepago desde $5.000'], ['Movistar', 'Pospago desde', '$52.990', 'Prepago desde $6.000'], ['Claro', 'Pospago desde · 65 GB', '$53.900', 'Prepago desde $2.500'], ['Tigo', 'Pospago desde · 60 GB', '$53.900', 'Prepago desde $10.000']], nota: ['Datos ilimitados desde', 'WOM $54.990 · Tigo $69.900 · Claro $99.900 al mes. Los planes y promociones cambian con frecuencia.'], fuente: 'Fuente: Selectra y Comparatodo · 2026' },
  internet: { sub: 'Internet en el hogar · 2026', t: 'Internet de fibra en el hogar', d: 'Por mes · sin promoción', filas: [['ETB', 'Hasta 910 Mb', '$41.930', 'Desde $18.260 en promoción'], ['Claro', 'Hasta 900 Mb', '$79.900', 'Mayor cobertura nacional'], ['Tigo', 'Hasta 500 Mb', '$84.900', 'Planes de internet hogar'], ['Movistar', 'Hasta 900 Mb', '$94.990', 'Fibra simétrica']], nota: ['¿Por qué varían los precios?', 'Cambian según la ciudad, el estrato, la velocidad y la promoción vigente. Confirma la cobertura con tu dirección.'], fuente: 'Fuente: Selectra · actualizado 13 ago 2026' },
  celulares: { sub: 'Los más caros y los más baratos', bloques: [['Los más caros', 'Precio de lista · 2025-2026', [['Galaxy Z Fold7', '1 TB', '$12.299.900'], ['iPhone 17 Pro Max', '2 TB', '$11.699.000'], ['Galaxy Z Fold7', '512 GB', '$11.099.900'], ['Galaxy S26 Ultra', '1 TB', '$9.499.990'], ['iPhone 17 Pro Max', '1 TB', '$9.399.000']]], ['Los más baratos', 'Precio aproximado · 2026', [['Xiaomi Redmi A5', '', '$399.900'], ['Samsung Galaxy A06 5G', '', '$405.999'], ['Motorola Moto G05', '', '$412.900'], ['Motorola Moto G15', '', '$450.000'], ['Samsung Galaxy A15', '', '$500.000']]]] },
};
const ATAJOS_MERCADO = [
  { href: '#/vivienda', t: 'Vivienda', d: 'Vivienda, servicios y mantenimiento del hogar.', bg: '#e0e9ff', ic: '🏠' },
  { href: '#/canasta', t: 'Canasta familiar', d: 'Alimentos y productos de la canasta familiar básica.', bg: '#dcf5e0', ic: '🛒' },
  { href: '#/transporte/publico', t: 'Transporte', d: 'Combustible, transporte público y repuestos.', bg: '#fdf3c8', ic: '🚗' },
  { href: '#/tecnologia/movil', t: 'Tecnología y comunicación', d: 'Comunicación y servicios digitales.', bg: '#ffe6d5', ic: '📱' },
];
const colorPct = (p) => (p > 0 ? 'rojo' : p < 0 ? 'verde' : '');
const pctTxt = (p) => (p > 0 ? '+' : p < 0 ? '−' : '') + fmtPct(Math.abs(p));

const vMercado = {
  html: () => `<div class="pagina"><h1 class="titulo-pagina">Cambios de los productos en el mercado</h1>
    <p class="muted" style="text-align:center;margin-top:-24px">Presiona alguno de los siguientes recuadros para navegar sobre los diferentes cambios en el mercado</p>
    <div class="mercado-atajos">${ATAJOS_MERCADO.map((a) => `<a class="atajo" href="${a.href}"><span class="ico" style="background:${a.bg}">${a.ic}</span><span><b>${a.t}</b><small>${a.d}</small></span></a>`).join('')}</div></div>`,
};
const vCanasta = {
  html() {
    const orden = CANASTA.slice().sort((a, b) => b.pct - a.pct);
    const sube = orden[0], baja = orden[orden.length - 1];
    const dest = (x, t) => `<a class="destacado" href="#/canasta/${x.id}"><small>${t}</small><b>${esc(x.n)}</b><span class="pct ${colorPct(x.pct)}">${pctTxt(x.pct)}</span> <span class="muted">${fmtDec(x.p)} /kg</span></a>`;
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">Canasta familiar</h1>
      <p class="muted" style="text-align:center;margin-top:-24px">Precios promedio nacionales · SIPSA-DANE</p>
      <div class="destacados">${dest(sube, 'Producto que más subió')}${dest(baja, 'Producto que más bajó')}</div>
      <p class="muted" style="text-align:right;font-size:14px">Registro del ${FECHA_SIPSA}</p>
      ${CANASTA.filter((x) => x !== sube && x !== baja).map((x) => `<a class="fila-precio" href="#/canasta/${x.id}"><span>${esc(x.n)}<span class="sub">Precio por kilo</span></span><span class="precio">${fmtDec(x.p)}</span><span class="pct ${colorPct(x.pct)}">${pctTxt(x.pct)}</span></a>`).join('')}
      <p class="fuente">Fuente: SIPSA (DANE). Toca un producto para ver su detalle.</p></div>`;
  },
};
const vDetalle = {
  html(id) {
    const x = CANASTA.find((c) => c.id === id); if (!x) return noEncontrado();
    const s = (n) => (n > 0 ? '+' : '-');
    return `<div class="pagina pagina--estrecha detalle-precio"><h1 class="titulo-pagina">Detalle de precio</h1>
      <p class="muted" style="text-align:center;margin-top:-24px">Canasta Familiar · SIPSA-DANE</p>
      <div class="card"><div class="fila entre" style="flex-wrap:wrap"><span class="etiqueta">CANASTA FAMILIAR</span><span class="muted">Fecha: ${FECHA_SIPSA}</span></div>
        <h2 style="margin-top:12px;font-size:24px">${esc(x.n)}</h2><div class="grande">${fmtDec(x.p)}</div>
        <p class="${colorPct(x.pct)}" style="font-weight:700;margin:6px 0">${s(x.ch)}${fmtDec(Math.abs(x.ch))} · ${pctTxt(x.pct)}</p>
        <p class="muted" style="margin:0">Precio por kilo · Precio promedio en Colombia</p></div>
      <div class="card" style="margin-top:18px"><h3>COMPORTAMIENTO DEL PRECIO</h3>
        ${graficaLinea({ puntos: [{ l: 'Registro anterior', v: x.prev }, { l: FECHA_SIPSA, v: x.p }], formato: (v) => '$ ' + Math.round(v).toLocaleString('es-CO'), color: x.pct > 0 ? '#c94343' : '#006e11' })}
        <div class="grid g3" style="gap:10px;margin-top:10px;text-align:center"><div><small class="muted">Precio anterior</small><br><b>${fmtDec(x.prev)}</b></div><div><small class="muted">Cambio</small><br><b class="${colorPct(x.pct)}">${s(x.ch)}${fmtDec(Math.abs(x.ch))}</b></div><div><small class="muted">Variación</small><br><b class="${colorPct(x.pct)}">${pctTxt(x.pct)}</b></div></div></div>
      <div class="fila entre" style="flex-wrap:wrap;margin-top:14px"><span class="fuente" style="margin:0">Fuente: SIPSA (DANE)</span><a class="link" href="https://www.agronegocios.co/" target="_blank" rel="noopener">Ver en Agronegocios.co</a></div></div>`;
  },
};
const vVivienda = {
  html() {
    const arr = Object.entries(VIVIENDA).sort((a, b) => b[1].med - a[1].med);
    const max = arr[0][1].med;
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">Vivienda</h1>
      <p class="muted" style="text-align:center;margin-top:-24px">Precio del m² en las principales ciudades</p>
      <div class="destacados"><a class="destacado" href="#/vivienda/${arr[0][0]}"><small>Ciudad más cara</small><b>${arr[0][1].n}</b><span class="pct">${fmtSin(arr[0][1].med)}</span> <span class="muted">/m²</span></a>
        <a class="destacado" href="#/vivienda/${arr[arr.length - 1][0]}"><small>Ciudad más económica</small><b>${arr[arr.length - 1][1].n}</b><span class="pct">${fmtSin(arr[arr.length - 1][1].med)}</span> <span class="muted">/m²</span></a></div>
      <div class="fila entre"><h2 class="subtitulo" style="margin:10px 0">Principales ciudades</h2><span class="muted" style="font-size:14px">Apartamentos usados · 31 oct 2026</span></div>
      ${arr.map(([id, c]) => `<a class="fila-precio" href="#/vivienda/${id}" style="grid-template-columns:1fr auto"><span>${c.n}<span class="sub">${c.z} · mediana por m²</span><span class="barra-h"><i style="width:${(c.med / max) * 100}%"></i></span></span><span class="precio">${fmtSin(c.med)}<span class="sub">por m²</span></span></a>`).join('')}
      <p class="fuente">Medianas de precio de oferta de apartamentos usados, no son precios de cierre. Toca una ciudad para ver sus sectores.</p></div>`;
  },
};
const vCiudad = {
  html(id) {
    const c = VIVIENDA[id]; if (!c) return noEncontrado();
    const max = c.sec[0][1];
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">${c.n}</h1>
      <p class="muted" style="text-align:center;margin-top:-24px">Mediana ${fmtSin(c.med)}/m² · apartamentos usados</p>
      <div class="destacados"><div class="destacado"><small>Sector más caro</small><b>${c.sec[0][0]}</b><span class="pct">${fmtSin(c.sec[0][1])}</span> <span class="muted">/m²</span></div>
        <div class="destacado"><small>Sector más económico</small><b>${c.sec[c.sec.length - 1][0]}</b><span class="pct">${fmtSin(c.sec[c.sec.length - 1][1])}</span> <span class="muted">/m²</span></div></div>
      <div class="card"><div class="fila entre"><h3 style="margin:0">Precio por m² según el sector</h3><span class="muted" style="font-size:14px">${c.zonas}</span></div>
        ${c.sec.map(([n, v]) => `<div style="margin-top:12px"><div class="fila entre"><span>${n}</span><b>${fmtSin(v)}</b></div><div class="barra-h"><i style="width:${(v / max) * 100}%"></i></div></div>`).join('')}
        <p class="fuente" style="text-align:right">Precios por sector: PropFound</p></div>
      <div class="card" style="margin-top:18px"><h3>Variación anual · vivienda nueva</h3>
        ${graficaBarras({ etiquetas: ['2022', '2023', '2024', '2025', '2026*'], series: [{ nombre: 'Variación', color: '#002c81', valores: c.va }], alto: 240, formato: (v) => v + '%', sufijoTitulo: (v) => fmtPct(v) })}
        <p class="fuente">IV trim. de cada año · *II trim. 2026 · Fuente: DANE (IPVN)</p></div>
      <p style="margin-top:16px"><a class="link" href="#/vivienda">← Ver todas las ciudades</a></p></div>`;
  },
};
function tabsHTML(base, tabs, activa) { return `<nav class="tabs">${tabs.map(([id, n]) => `<a href="#/${base}/${id}" class="${id === activa ? 'activo' : ''}">${n}</a>`).join('')}</nav>`; }
function bloqueTarifas(d) {
  if (d.bloques) return d.bloques.map(([t, s, filas]) => `<div class="fila entre"><h2 class="subtitulo" style="margin:16px 0 10px">${t}</h2><span class="muted" style="font-size:14px">${s}</span></div>${filas.map(([a, b, c]) => `<div class="fila-precio" style="grid-template-columns:1fr auto"><span>${esc(a)}${b ? `<span class="sub">${esc(b)}</span>` : ''}</span><span class="precio">${esc(c)}</span></div>`).join('')}`).join('') + (d.fuente ? `<p class="fuente">${esc(d.fuente)}</p>` : '');
  return `<div class="fila entre"><h2 class="subtitulo" style="margin:4px 0 10px">${d.t}</h2><span class="muted" style="font-size:14px">${d.d}</span></div>
    ${d.filas.map(([a, b, c, e]) => `<div class="fila-precio" style="grid-template-columns:1fr auto"><span>${esc(a)}<span class="sub">${esc(b)}</span></span><span class="precio">${esc(c)}<span class="sub">${esc(e)}</span></span></div>`).join('')}
    ${d.nota ? `<div class="card" style="margin-top:14px"><h4 style="margin-bottom:6px">${esc(d.nota[0])}</h4><p class="muted" style="margin:0">${esc(d.nota[1])}</p></div>` : ''}<p class="fuente">${esc(d.fuente)}</p>`;
}
const vTransporte = {
  html(tab) {
    const tabs = [['publico', 'Público'], ['taxi', 'Taxi'], ['vehiculos', 'Vehículos'], ['gasolina', 'Gasolina']];
    if (!tabs.some(([id]) => id === tab)) return noEncontrado();
    let cuerpo, sub;
    if (tab === 'gasolina') {
      sub = 'Gasolina corriente · 2026';
      cuerpo = `<div class="destacados"><div class="destacado"><small>Precio actual · Bogotá</small><b>$16.331 /gal</b><span class="muted">Noviembre 2026</span></div><div class="destacado"><small>Cambio frente a octubre</small><b>$0 · 0,0%</b><span class="muted">Desde enero: −$160 (−1,0%)</span></div></div>
        <div class="card"><div class="fila entre"><h3 style="margin:0">Precio por galón · Bogotá</h3><span class="muted" style="font-size:14px">Fuente: CREG</span></div>
        ${graficaLinea({ puntos: GASOLINA.serie.map(([l, v]) => ({ l, v, txt: v === 15491 ? '$15.491 · mínimo' : undefined })), formato: (v) => '$' + Math.round(v).toLocaleString('es-CO'), color: '#e8750a' })}
        <p class="fuente">Precio de referencia de la gasolina corriente en Bogotá, por galón. Solo se grafican los meses con dato en el diseño.</p></div>
        <div class="fila entre"><h2 class="subtitulo" style="margin:22px 0 10px">Hoy por ciudad</h2><span class="muted" style="font-size:14px">Noviembre 2026</span></div>
        ${GASOLINA.ciudades.map(([n, v]) => `<div class="fila-precio" style="grid-template-columns:1fr auto"><span>${n}</span><span class="precio">${fmtSin(v)}</span></div>`).join('')}`;
    } else { sub = TRANSPORTE[tab].sub; cuerpo = bloqueTarifas(TRANSPORTE[tab]); }
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">Transporte</h1><p class="muted" style="text-align:center;margin-top:-24px">${sub}</p>${tabsHTML('transporte', tabs, tab)}${cuerpo}</div>`;
  },
};
const vTecnologia = {
  html(tab) {
    const tabs = [['movil', 'Móvil'], ['internet', 'Internet'], ['celulares', 'Celulares'], ['historial', 'Historial']];
    if (!tabs.some(([id]) => id === tab)) return noEncontrado();
    let cuerpo, sub;
    if (tab === 'historial') {
      sub = 'Cómo han cambiado los precios';
      cuerpo = `<div class="card"><div class="fila entre"><h3 style="margin:0">Comunicaciones vs. inflación</h3><span class="muted" style="font-size:14px">Fuente: DANE</span></div>
        <div class="leyenda" style="justify-content:flex-start;margin:10px 0"><span><i style="background:#0b4cc9"></i>Información y comunicación</span><span><i style="background:#e8750a"></i>IPC total (variación anual, %)</span></div>
        ${graficaBarras({ etiquetas: ['2022', '2023', '2024', '2025'], series: [{ nombre: 'Información y comunicación', color: '#0b4cc9', valores: [0.3, 0.1, -0.9, 1.2] }, { nombre: 'IPC total', color: '#e8750a', valores: [13.1, 9.3, 5.2, 5.1] }], alto: 250, formato: (v) => v + '%', sufijoTitulo: (v) => fmtPct(v, 1) })}</div>
        <div class="card" style="margin-top:18px"><h3>iPhone Pro Max (256 GB) en Colombia</h3>
        ${graficaLinea({ puntos: [['2022', 7.55], ['2023', 6.9], ['2024', 6.88], ['2025', 7.0], ['2026*', 6.8]].map(([l, v]) => ({ l, v })), formato: (v) => v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M' })}
        <p class="fuente">Precio de lanzamiento del Pro Max de 256 GB. *2026: precio actual del 17 Pro Max.</p></div>
        <div class="card" style="margin-top:18px"><h4 style="margin-bottom:6px">Equipos y servicios (DANE)</h4><p class="muted" style="margin:0">Los equipos celulares cambiaron de precio +3,8 % (2022), +1,1 % (2023), −23,5 % (2024) y −23,7 % (2025). Los servicios de comunicación e internet subieron 2,6 % en 2025, menos que la inflación total (5,1 %).</p></div>`;
    } else { sub = TECNOLOGIA[tab].sub; cuerpo = bloqueTarifas(TECNOLOGIA[tab]); }
    return `<div class="pagina pagina--estrecha"><h1 class="titulo-pagina">Tecnología</h1><p class="muted" style="text-align:center;margin-top:-24px">${sub}</p>${tabsHTML('tecnologia', tabs, tab)}${cuerpo}</div>`;
  },
};

/* ---------------------------------------------------------------------
   14. Router
   --------------------------------------------------------------------- */
function noEncontrado() { return `<div class="pagina"><h1 class="titulo-pagina">Página no encontrada</h1><p style="text-align:center"><a class="btn" href="#/inicio">Ir al inicio</a></p></div>`; }
const RUTAS = [
  [/^sesion$/, vSesion, { publica: true }],
  [/^registro$/, vRegistro, { publica: true }],
  [/^encuesta$/, vEncuesta, { sinBarra: true }],
  [/^inicio$/, vInicio, { tab: 'inicio', raiz: true }],
  [/^finanzas$/, vFinanzas, { tab: 'finanzas', raiz: true }],
  [/^historial-general$/, vHistorialGeneral, { tab: 'finanzas' }],
  [/^ingresos-mes$/, vIngresosMes, { tab: 'finanzas' }],
  [/^gastos-mes$/, vGastosMes, { tab: 'finanzas' }],
  [/^mes\/(\d{4}-\d{2})$/, { html: vMesRedirect }, { tab: 'finanzas' }],
  [/^registrar-gastos$/, vRegGastos, { tab: 'finanzas', q: true }],
  [/^registrar-ingresos$/, vRegIngresos, { tab: 'finanzas', q: true }],
  [/^ingresos$/, vIngresos, { tab: 'finanzas' }],
  [/^gastos$/, vGastos, { tab: 'gastos', raiz: true }],
  [/^categoria\/([a-z]+)$/, vCategoria, { tab: 'gastos' }],
  [/^educacion$/, vEducacion, { tab: 'educacion', raiz: true }],
  [/^concepto\/([a-z]+)$/, vConcepto, { tab: 'educacion' }],
  [/^calc\/([a-z]+)\/([a-z]+)$/, vCalc, { tab: 'educacion' }],
  [/^mercado$/, vMercado, { tab: 'inicio' }],
  [/^canasta$/, vCanasta, { tab: 'inicio' }],
  [/^canasta\/([a-z-]+)$/, vDetalle, { tab: 'inicio' }],
  [/^vivienda$/, vVivienda, { tab: 'inicio' }],
  [/^vivienda\/([a-z]+)$/, vCiudad, { tab: 'inicio' }],
  [/^transporte\/([a-z]+)$/, vTransporte, { tab: 'inicio' }],
  [/^tecnologia\/([a-z]+)$/, vTecnologia, { tab: 'inicio' }],
];
let rutaPrevia = '';
function render() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const q = new URLSearchParams(qs || '');
  if (!usuario) { if (!/^(sesion|registro)$/.test(path)) { location.replace('#/sesion'); return; } }
  else if (!path || /^(sesion|registro)$/.test(path)) { location.replace(D.perfil.completo ? '#/inicio' : '#/encuesta'); return; }
  let vista = null, args = [], opts = {};
  for (const [re, v, o] of RUTAS) { const m = path.match(re); if (m) { vista = v; args = m.slice(1); opts = o; break; } }
  if (!vista) { vista = { html: noEncontrado }; opts = {}; }
  if (opts.q) args = [q];
  cerrarMenus();
  const barra = Boolean(usuario) && !opts.publica && !opts.sinBarra;
  $('#topbar').hidden = !barra;
  document.body.style.paddingBottom = barra ? '' : '0';
  if (barra) {
    $$('.topbar__nav a').forEach((a) => a.classList.toggle('activo', a.dataset.tab === opts.tab));
    const esInicio = path === 'inicio';
    $('#btnAvatar').hidden = !esInicio; $('#btnBack').hidden = esInicio;
    $('#avatarInitial').textContent = (D.perfil.nombre || usuario.email).charAt(0).toUpperCase();
    $('#bellDot').hidden = !avisos().length;
  }
  app.innerHTML = vista.html(...args);
  if (vista.bind) vista.bind(...args);
  const titulo = app.querySelector('h1');
  document.title = (titulo ? titulo.textContent.trim().replace(/\s+/g, ' ') + ' · ' : '') + 'Proyecto financiero';
  if (path !== rutaPrevia) { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
  rutaPrevia = path;
}
window.addEventListener('hashchange', render);

/* Acciones globales (delegación de eventos) */
app.addEventListener('change', (e) => {
  if (e.target.matches('[data-mes-select]')) { fijarMes(e.target.value); render(); }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-accion]'); if (!b) return;
  const a = b.dataset.accion;
  if (a === 'google') toast('El registro con Google necesita un servidor. Por ahora crea tu cuenta con correo y contraseña.');
  if (a === 'nuevo-mov') modalMovimiento({ tipo: b.dataset.tipo, cat: b.dataset.cat, sub: b.dataset.sub });
  if (a === 'borrar-mov') {
    const m = D.movs.find((x) => x.id === b.dataset.id); if (!m) return;
    confirmar('Eliminar movimiento', `¿Eliminar «${m.desc}» por ${fmt(m.monto)}? No se puede deshacer.`, () => { D.movs = D.movs.filter((x) => x.id !== m.id); guardar(); toast('Movimiento eliminado.'); render(); }, 'Eliminar');
  }
  if (a === 'ejemplo') cargarEjemplo();
  if (a === 'editar-patrimonio') editarPatrimonio();
});
function cargarEjemplo() {
  const hay = mesesConDatos().length > 0;
  const hacer = () => { D = datosEjemplo(); guardar(); fijarMes(mesPorDefecto()); toast('Datos de ejemplo cargados.'); if (location.hash !== '#/inicio') location.hash = '#/inicio'; else render(); };
  if (hay) confirmar('Cargar datos de ejemplo', 'Se reemplazarán tus registros actuales (meses, movimientos y patrimonio) por datos de ejemplo de junio a noviembre de 2026.', hacer, 'Reemplazar');
  else hacer();
}
function editarPatrimonio() {
  const otros = patrimonioNeto() - num(D.patrimonioInicial);
  abrirModal(`<h2>Patrimonio neto</h2><p>Tu patrimonio neto = lo que tenías antes de usar la app (patrimonio inicial) + el ahorro de cada mes registrado (${fmt(otros)}).</p>
    <form id="fPat" novalidate><div class="campo"><label for="pIni">Patrimonio inicial</label><div class="input-wrap"><span class="prefijo">$</span><input class="input" id="pIni" data-dinero inputmode="numeric" value="${Math.max(0, num(D.patrimonioInicial)).toLocaleString('es-CO')}"></div><span class="ayuda">Suma de tus ahorros, inversiones y bienes, menos lo que debes.</span></div>
    <div class="modal__acciones"><button type="button" class="btn btn--sec btn--chico" data-cerrar>Cancelar</button><button class="btn btn--chico">Guardar</button></div></form>`, (b) => {
    $('#fPat', b).addEventListener('submit', (e) => { e.preventDefault(); D.patrimonioInicial = parseDinero($('#pIni', b).value) || 0; guardar(); cerrarModal(); render(); });
  });
}

/* Menú de perfil y avisos */
function cerrarMenus() { $('#menuPerfil').hidden = true; $('#menuAvisos').hidden = true; }
function avisos() {
  if (!D) return [];
  const r = [], t = totalesMes(mesSel);
  if (!D.perfil.completo) r.push(['Completa la encuesta para personalizar tu experiencia.', '#/encuesta']);
  if (!t.tieneDatos) r.push([`${etiquetaMes(mesSel)} no tiene registros todavía.`, '#/registrar-gastos?mes=' + mesSel]);
  if (t.tieneDatos && t.gastos > t.ingresos) r.push([`En ${nombreMes(mesSel)} gastaste ${fmt(t.gastos - t.ingresos)} más de lo que ingresó.`, '#/mes/' + mesSel]);
  if (t.ingresos > 0 && t.hormiga / t.ingresos > 0.1) r.push([`Tus gastos hormiga son el ${Math.round((t.hormiga / t.ingresos) * 100)}% de tus ingresos de ${nombreMes(mesSel)}.`, '#/categoria/hormiga']);
  return r;
}
$('#btnBell').addEventListener('click', (e) => {
  e.stopPropagation(); const m = $('#menuAvisos'); const abierto = !m.hidden; cerrarMenus(); if (abierto) return;
  const av = avisos();
  m.innerHTML = `<div class="dropdown__head"><strong>Notificaciones</strong></div>${av.length ? av.map(([t, h]) => `<a class="item aviso" href="${h}">${esc(t)}</a>`).join('') : '<div class="aviso muted">No tienes notificaciones.</div>'}`;
  m.hidden = false;
});
$('#btnAvatar').addEventListener('click', (e) => {
  e.stopPropagation(); const m = $('#menuPerfil'); const abierto = !m.hidden; cerrarMenus(); if (abierto) return;
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  m.innerHTML = `<div class="dropdown__head"><strong>${esc([D.perfil.nombre, D.perfil.apellido].filter(Boolean).join(' ') || 'Tu perfil')}</strong><small>${esc(usuario.email)}</small></div>
    <a class="item" href="#/encuesta">Editar mis datos (encuesta)</a>
    <a class="item" href="#/mercado">Cambios en el mercado</a>
    <button data-menu="ejemplo">Cargar datos de ejemplo</button>
    <button data-menu="exportar">Descargar copia de mis datos</button>
    ${instalarEvt ? '<button data-menu="instalar">Instalar app</button>' : esIOS ? '<button data-menu="ios">Instalar app en iPhone</button>' : ''}
    <button data-menu="borrar" class="peligro">Borrar todos mis registros</button>
    <button data-menu="salir">Cerrar sesión</button>`;
  m.hidden = false;
});
$('#menuPerfil').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-menu]'); if (!b) return; cerrarMenus();
  const a = b.dataset.menu;
  if (a === 'ejemplo') cargarEjemplo();
  if (a === 'salir') cerrarSesion('#/sesion');
  if (a === 'borrar') confirmar('Borrar todos mis registros', 'Se eliminarán tus meses, movimientos y patrimonio guardados en este navegador. Tu cuenta y la encuesta se conservan. No se puede deshacer.', () => { const p = D.perfil; D = datosVacios(); D.perfil = p; guardar(); fijarMes(mesHoy()); toast('Registros borrados.'); render(); }, 'Borrar');
  if (a === 'exportar') {
    const blob = new Blob([JSON.stringify({ email: usuario.email, datos: D }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = url; l.download = 'mis-finanzas.json'; l.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (a === 'instalar' && instalarEvt) { instalarEvt.prompt(); await instalarEvt.userChoice; instalarEvt = null; }
  if (a === 'ios') abrirModal('<h2>Instalar en iPhone o iPad</h2><p>En Safari toca el botón Compartir y luego «Agregar a pantalla de inicio».</p><div class="modal__acciones"><button class="btn btn--chico" data-cerrar>Entendido</button></div>');
});
document.addEventListener('click', (e) => { if (!e.target.closest('.dropdown, #btnAvatar, #btnBell')) cerrarMenus(); });
$('#btnBack').addEventListener('click', () => { if (history.length > 1) history.back(); else location.hash = '#/inicio'; });
function cerrarSesion(destino) { store.del(K_SESION); usuario = null; D = null; location.hash = destino; render(); }

/* ---------------------------------------------------------------------
   15. PWA: service worker, instalación y modo sin conexión
   --------------------------------------------------------------------- */
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalarEvt = e; });
window.addEventListener('appinstalled', () => { instalarEvt = null; toast('App instalada.'); });
const pintarConexion = () => { $('#offlineBadge').hidden = navigator.onLine; };
window.addEventListener('online', pintarConexion); window.addEventListener('offline', pintarConexion);
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* sin SW, la app funciona igual */ }));
}

/* Inicio */
cargarSesion();
pintarConexion();
render();
