const API_BASE = 'https://www.dnd5eapi.co/api/2014/';
const endpoints = [
  'races',
  'classes',
  'backgrounds',
  'ability-scores',
  'skills',
  'alignments',
  'languages'
];

async function getOrFetchData(endpoint) {
  const key = `dnd_${endpoint}`;
  const localData = localStorage.getItem(key);

  if (localData) {
    console.log(JSON.parse(localData));
    return JSON.parse(localData);
  } else {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) throw new Error(`Error al obtener ${endpoint}`);
      const data = await response.json();

      localStorage.setItem(key, JSON.stringify(data));
      console.log(`🌐 Datos de ${endpoint} desde API:`);
      console.log(data);
      return data;
    } catch (error) {
      console.error(`❌ Error al obtener ${endpoint}:`, error);
    }
  }
}

async function loadAllData() {
  for (const endpoint of endpoints) {
    await getOrFetchData(endpoint);
  }
}

loadAllData();
