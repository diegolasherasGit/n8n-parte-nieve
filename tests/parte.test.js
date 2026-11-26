// Ejecutar: node --test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function ejecutarNodo(nombre, json, memoria = {}) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', nombre), 'utf8');
  const $input = { first: () => ({ json }) };
  const $getWorkflowStaticData = () => memoria;
  return new Function('$input', '$getWorkflowStaticData', code)($input, $getWorkflowStaticData)[0].json;
}

const datos = (nieve, racha, tmin) => ({
  daily: {
    time: ['2026-11-26'],
    temperature_2m_max: [2],
    temperature_2m_min: [tmin],
    snowfall_sum: [nieve],
    wind_gusts_10m_max: [racha],
  },
});

test('dia tranquilo: sin alertas', () => {
  const r = ejecutarNodo('generar_parte.js', datos(0, 30, -3));
  assert.strictEqual(r.hayAlertas, false);
  assert.deepStrictEqual(r.dias[0].alertas, []);
});

test('nevada fuerte (>= 10 cm)', () => {
  const r = ejecutarNodo('generar_parte.js', datos(10, 30, -3));
  assert.strictEqual(r.hayAlertas, true);
  assert.ok(r.dias[0].alertas[0].startsWith('NEVADA'));
});

test('viento fuerte (>= 70 km/h)', () => {
  const r = ejecutarNodo('generar_parte.js', datos(0, 70, -3));
  assert.ok(r.dias[0].alertas.some(a => a.startsWith('VIENTO')));
});

test('frio intenso (<= -10 C)', () => {
  const r = ejecutarNodo('generar_parte.js', datos(0, 30, -10));
  assert.ok(r.dias[0].alertas.some(a => a.startsWith('FRIO')));
});

test('limites: 9 cm, 69 km/h y -9 C no disparan alerta', () => {
  const r = ejecutarNodo('generar_parte.js', datos(9, 69, -9));
  assert.strictEqual(r.hayAlertas, false);
});

test('varias alertas el mismo dia', () => {
  const r = ejecutarNodo('generar_parte.js', datos(14, 85, -12));
  assert.strictEqual(r.dias[0].alertas.length, 3);
});

test('el HTML se genera y marca las alertas', () => {
  const parte = ejecutarNodo('generar_parte.js', datos(14, 85, -12));
  const h = ejecutarNodo('generar_html.js', parte).html;
  assert.ok(h.includes('HAY ALERTAS'));
  assert.ok(h.includes('Formigal-Panticosa'));
});

test('si la API responde, guarda el dato y lo marca en directo', () => {
  const memoria = {};
  const r = ejecutarNodo('generar_parte.js', datos(5, 30, -3), memoria);
  assert.strictEqual(r.origen, 'en directo');
  assert.ok(memoria.ultimo);
});

test('si la API falla, usa el ultimo dato guardado', () => {
  const memoria = {};
  ejecutarNodo('generar_parte.js', datos(14, 85, -12), memoria);
  const r = ejecutarNodo('generar_parte.js', { error: 'timeout' }, memoria);
  assert.ok(r.origen.startsWith('ultimo dato conocido'));
  assert.strictEqual(r.hayAlertas, true);
});

test('si la API falla y no hay datos guardados, avisa con un error claro', () => {
  assert.throws(() => ejecutarNodo('generar_parte.js', { error: 'timeout' }, {}), /no hay datos guardados/);
});

test('calidad de datos: valores imposibles se rechazan y se usa el ultimo dato valido', () => {
  const memoria = {};
  ejecutarNodo('generar_parte.js', datos(5, 30, -3), memoria);
  const r = ejecutarNodo('generar_parte.js', datos(5, 30, -99), memoria); // -99 C no es plausible
  assert.ok(r.origen.includes('no validos'));
  assert.strictEqual(r.dias[0].tmin, -3);
});

test('calidad de datos: series de distinta longitud se rechazan', () => {
  const memoria = {};
  ejecutarNodo('generar_parte.js', datos(5, 30, -3), memoria);
  const malos = datos(5, 30, -3);
  malos.daily.snowfall_sum = [];
  const r = ejecutarNodo('generar_parte.js', malos, memoria);
  assert.ok(r.origen.includes('no validos'));
});

test('calidad de datos: valores nulos se rechazan', () => {
  const memoria = {};
  ejecutarNodo('generar_parte.js', datos(5, 30, -3), memoria);
  const r = ejecutarNodo('generar_parte.js', datos(null, 30, -3), memoria);
  assert.ok(r.origen.includes('no validos'));
});
