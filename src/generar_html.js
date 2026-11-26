// Nodo "Generar HTML" (Code, Run Once for All Items)
const p = $input.first().json;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tarjetas = p.dias.map(x => `
  <div class="card ${x.alertas.length ? 'alerta' : 'ok'}">
    <h2>${esc(x.fecha)}</h2>
    <p class="temp">${esc(x.tmin)}&deg; / ${esc(x.tmax)}&deg;C</p>
    <p>Nieve: <b>${esc(x.nieve_cm)} cm</b></p>
    <p>Rachas: <b>${esc(x.racha_kmh)} km/h</b></p>
    ${x.alertas.length ? '<ul>' + x.alertas.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '<p class="sin">Sin alertas</p>'}
  </div>`).join('');
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Parte de nieve - ${esc(p.estacion)}</title>
<style>
body{font-family:system-ui,sans-serif;background:#eef3f8;margin:0;padding:24px;color:#1b2a3a}
h1{margin:0 0 4px} .sub{color:#5b6b7c;margin:0 0 20px}
.estado{display:inline-block;padding:6px 14px;border-radius:20px;font-weight:600;margin-bottom:20px;color:#fff;background:${p.hayAlertas ? '#c0392b' : '#27ae60'}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.08);border-top:6px solid #27ae60}
.card.alerta{border-top-color:#c0392b}
.card h2{margin:0 0 8px;font-size:1rem;color:#5b6b7c}
.temp{font-size:1.6rem;font-weight:700;margin:4px 0 10px}
.card p{margin:4px 0} .card ul{margin:8px 0 0;padding-left:18px;color:#c0392b;font-weight:600}
.sin{color:#27ae60}
</style></head><body>
<h1>Parte de nieve - ${esc(p.estacion)}</h1>
<p class="sub">Datos: Open-Meteo &middot; ${esc(p.origen)} &middot; actualizado ${esc(p.actualizado)}</p>
<div class="estado">${p.hayAlertas ? 'HAY ALERTAS' : 'SIN ALERTAS'}</div>
<div class="grid">${tarjetas}</div>
</body></html>`;
return [{ json: { html } }];
