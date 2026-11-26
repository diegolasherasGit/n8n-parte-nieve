// Nodo "Generar parte" (Code, Run Once for All Items)
// Siempre devuelve datos: en directo si la API responde; si falla, el ultimo dato real guardado.
const memoria = $getWorkflowStaticData('global');
const entrada = $input.first().json;
// Control de calidad: la respuesta debe tener todas las series, mismo largo y valores plausibles.
function validar(daily) {
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) return false;
  const rangos = {
    temperature_2m_max: [-50, 45], temperature_2m_min: [-50, 45],
    snowfall_sum: [0, 300], wind_gusts_10m_max: [0, 300],
  };
  return Object.entries(rangos).every(([k, [min, max]]) =>
    Array.isArray(daily[k]) && daily[k].length === daily.time.length &&
    daily[k].every(v => typeof v === 'number' && v >= min && v <= max));
}
let d = validar(entrada.daily) ? entrada.daily : null;
let origen = 'en directo';
let actualizado = new Date().toISOString();
if (d) {
  memoria.ultimo = { daily: d, actualizado };
} else if (memoria.ultimo) {
  d = memoria.ultimo.daily;
  actualizado = memoria.ultimo.actualizado;
  origen = entrada.daily ? 'ultimo dato conocido (la API devolvio datos no validos)' : 'ultimo dato conocido (la API no respondio)';
} else {
  throw new Error('Open-Meteo no responde y todavia no hay datos guardados');
}
const dias = d.time.map((fecha, i) => {
  const nieve = d.snowfall_sum[i];
  const racha = d.wind_gusts_10m_max[i];
  const alertas = [];
  if (nieve >= 10) alertas.push('NEVADA FUERTE (>= 10 cm)');
  if (racha >= 70) alertas.push('VIENTO FUERTE: posible cierre de remontes (rachas >= 70 km/h)');
  if (d.temperature_2m_min[i] <= -10) alertas.push('FRIO INTENSO (<= -10 C)');
  return {
    fecha,
    tmin: d.temperature_2m_min[i],
    tmax: d.temperature_2m_max[i],
    nieve_cm: nieve,
    racha_kmh: racha,
    alertas,
  };
});
const hayAlertas = dias.some(x => x.alertas.length > 0);
const resumen = dias.map(x =>
  `${x.fecha}: ${x.tmin}/${x.tmax} C, nieve ${x.nieve_cm} cm, rachas ${x.racha_kmh} km/h` +
  (x.alertas.length ? ` -> ${x.alertas.join('; ')}` : '')
).join('\n');
return [{ json: { estacion: 'Formigal-Panticosa', origen, actualizado, hayAlertas, resumen, dias } }];
