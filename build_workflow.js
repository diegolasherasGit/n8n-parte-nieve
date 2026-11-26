// Genera workflow_parte_nieve.json a partir del codigo de src/. Uso: node build_workflow.js
const fs = require('fs');
const parte = fs.readFileSync('src/generar_parte.js', 'utf8');
const html = fs.readFileSync('src/generar_html.js', 'utf8');
const api = (id, name, pos) => ({
  parameters: {
    url: 'https://api.open-meteo.com/v1/forecast', sendQuery: true,
    queryParameters: { parameters: [
      { name: 'latitude', value: '42.7656' }, { name: 'longitude', value: '-0.3694' },
      { name: 'elevation', value: '1800' },
      { name: 'daily', value: 'temperature_2m_max,temperature_2m_min,snowfall_sum,wind_gusts_10m_max' },
      { name: 'timezone', value: 'Europe/Madrid' }, { name: 'forecast_days', value: '3' } ] },
    options: {} },
  id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos,
  retryOnFail: true, maxTries: 3, waitBetweenTries: 2000, onError: 'continueRegularOutput' });
const code = (id, name, jsCode, pos) => ({ parameters: { jsCode }, id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos });
const wf = {
  name: 'Parte de nieve Formigal-Panticosa',
  nodes: [
    { parameters: { rule: { interval: [{ triggerAtHour: 7, triggerAtMinute: 30 }] } }, id: 'a1', name: 'Cada dia 07:30', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 0] },
    { parameters: { httpMethod: 'GET', path: 'parte-nieve', responseMode: 'lastNode', options: {} }, id: 'a2', name: 'Webhook JSON', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 200] },
    api('a3', 'Open-Meteo API (JSON)', [260, 100]),
    code('a4', 'Generar parte', parte, [520, 100]),
    { parameters: { httpMethod: 'GET', path: 'parte-nieve-web', responseMode: 'responseNode', options: {} }, id: 'b1', name: 'Webhook pagina web', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 420] },
    api('b2', 'Open-Meteo API (web)', [260, 420]),
    code('b3', 'Generar parte (web)', parte, [520, 420]),
    code('b4', 'Generar HTML', html, [780, 420]),
    { parameters: { respondWith: 'text', responseBody: '={{ $json.html }}', options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }] } } }, id: 'b5', name: 'Responder pagina', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [1040, 420] },
  ],
  connections: {
    'Cada dia 07:30': { main: [[{ node: 'Open-Meteo API (JSON)', type: 'main', index: 0 }]] },
    'Webhook JSON': { main: [[{ node: 'Open-Meteo API (JSON)', type: 'main', index: 0 }]] },
    'Open-Meteo API (JSON)': { main: [[{ node: 'Generar parte', type: 'main', index: 0 }]] },
    'Webhook pagina web': { main: [[{ node: 'Open-Meteo API (web)', type: 'main', index: 0 }]] },
    'Open-Meteo API (web)': { main: [[{ node: 'Generar parte (web)', type: 'main', index: 0 }]] },
    'Generar parte (web)': { main: [[{ node: 'Generar HTML', type: 'main', index: 0 }]] },
    'Generar HTML': { main: [[{ node: 'Responder pagina', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
};
fs.writeFileSync('workflow_parte_nieve.json', JSON.stringify(wf, null, 2));
console.log('workflow_parte_nieve.json generado');
