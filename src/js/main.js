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
        console.log(`${endpoint}`);
        console.log(JSON.parse(localData));
        return JSON.parse(localData);
    }
    else {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`Error al obtener ${endpoint}`);
            const data = await response.json();

            localStorage.setItem(key, JSON.stringify(data));
            console.log(`Datos de ${endpoint} desde API:`);
            console.log(data);
            return data;
        } catch (error) {
            console.error(`Error al obtener ${endpoint}:`, error);
        }
    }
}

async function loadAllData() {
    for (const endpoint of endpoints) {
        await getOrFetchData(endpoint);
    }
}

async function llenarSelect(id, endpoint, agregarOpcionTodas = false) {
    const data = await getOrFetchData(endpoint);
    const select = document.getElementById(id);
    select.innerHTML = ''; 

    if (agregarOpcionTodas) {
        const opcionTodas = document.createElement('option');
        opcionTodas.value = '';
        opcionTodas.textContent = 'Todas las razas';
        select.appendChild(opcionTodas);
    } else {
        const placeholder = document.createElement('option');
        placeholder.textContent = 'Seleccione...';
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.value = '';
        select.appendChild(placeholder);
    }

    data.results.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.name;
        option.textContent = opt.name;
        select.appendChild(option);
    });
}


llenarSelect('filtroRaza', 'races', true); 


document.getElementById('btnCrearPersonaje').addEventListener('click', async () => {
    document.getElementById('modal').classList.remove('hidden');
    await llenarSelect('selectRaza', 'races');
    await llenarSelect('selectClase', 'classes');
    await llenarSelect('selectFondo', 'backgrounds');
    await llenarSelect('selectAlineamiento', 'alignments');
    await llenarSelect('selectIdioma', 'languages');
});

const habilidades = ['Fuerza', 'Destreza', 'Constitución', 'Inteligencia', 'Sabiduría', 'Carisma'];
let habilidadActualIndex = 0;
let intentosRestantes = 3;
let resultadosTemporales = [];
let abilityScoresFinales = {};

function tirarDados() {
    if (habilidadActualIndex >= habilidades.length || intentosRestantes <= 0) return;

    const dados = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6 + 1));
    dados.sort((a, b) => b - a);
    const total = dados[0] + dados[1] + dados[2];
    resultadosTemporales.push(total);
    intentosRestantes--;

    const nombreHabilidad = habilidades[habilidadActualIndex];
    document.getElementById('resultadosDados').innerHTML = `
        <p>Asignando: <strong>${nombreHabilidad}</strong></p>
        <p>Tirada actual: <strong>${total}</strong></p>
        <p>Intentos restantes: ${intentosRestantes}</p>
    `;
    document.getElementById('botonesEleccion').classList.remove('hidden');

    if (intentosRestantes === 0) {
        document.getElementById('reTirar').disabled = true;
    }
}

document.getElementById('tirarDados').addEventListener('click', tirarDados);

document.getElementById('elegirStats').addEventListener('click', () => {
    if (resultadosTemporales.length === 0) {
        alert("Primero debes lanzar los dados.");
        return;
    }

    const nombreHabilidad = habilidades[habilidadActualIndex];
    const mejorResultado = Math.max(...resultadosTemporales);
    abilityScoresFinales[nombreHabilidad] = mejorResultado;

    habilidadActualIndex++;
    intentosRestantes = 3;
    resultadosTemporales = [];

    document.getElementById('reTirar').disabled = false;
    document.getElementById('botonesEleccion').classList.add('hidden');
    document.getElementById('resultadosDados').innerHTML = '';

    if (habilidadActualIndex < habilidades.length) {
        document.getElementById('resultadosDados').innerHTML = `<p>Siguiente habilidad: <strong>${habilidades[habilidadActualIndex]}</strong></p>`;
    } else {
        document.getElementById('resultadosDados').innerHTML = `<p><strong>¡Todas las habilidades han sido asignadas!</strong></p>`;
        document.getElementById('tirarDados').disabled = true;
        document.getElementById('botonesEleccion').classList.add('hidden');
        document.getElementById('abilityScoreSection').dataset.stats = JSON.stringify(abilityScoresFinales);

        document.getElementById('abilityScoreSection').style.display = 'none';

        const resumen = document.createElement('div');
        resumen.id = 'abilityScoreResumen';
        resumen.style.cssText = 'border: 1px solid #ccc; padding: 1rem; border-radius: 8px; background-color: #e6ffe6; margin-top: 1rem; margin-bottom: 1rem;';
        resumen.innerHTML = `<p style="font-weight: bold; font-size: 1.1rem;">Resumen de Habilidades Asignadas</p>`;

        Object.entries(abilityScoresFinales).forEach(([habilidad, valor]) => {
            const statItem = document.createElement('p');
            statItem.textContent = `${habilidad}: ${valor}`;
            resumen.appendChild(statItem);
        });

        document.getElementById('abilityScoreSection').after(resumen);
    }
});


document.getElementById('reTirar').addEventListener('click', () => {
    tirarDados();
});

document.getElementById('guardarPersonaje').addEventListener('click', () => {
    const nombre = document.getElementById('nombrePersonaje').value.trim();
    const raza = document.getElementById('selectRaza').value;
    const clase = document.getElementById('selectClase').value;
    const background = document.getElementById('selectFondo').value;
    const alineamiento = document.getElementById('selectAlineamiento').value;
    const idioma = document.getElementById('selectIdioma').value;
    const stats = JSON.parse(document.getElementById('abilityScoreSection').dataset.stats || '{}');
    const skin = `Gato${skinIndex}.png`;

    const camposFaltantes = [];

    if (!nombre) camposFaltantes.push("Nombre");
    if (!raza) camposFaltantes.push("Raza");
    if (!clase) camposFaltantes.push("Clase");
    if (!background) camposFaltantes.push("Background");
    if (!alineamiento) camposFaltantes.push("Alineamiento");
    if (!idioma) camposFaltantes.push("Idioma");
    if (Object.keys(stats).length !== 6) camposFaltantes.push("Estadísticas (Ability Scores)");

    if (camposFaltantes.length > 0) {
        alert(`⚠️ No se pudo guardar el personaje.\nFaltan los siguientes campos:\n- ${camposFaltantes.join('\n- ')}`);
        return;
    }

    const personaje = { nombre, raza, clase, background, alineamiento, idioma, stats, skin };

    const personajes = JSON.parse(localStorage.getItem('personajes')) || [];
    personajes.push(personaje);
    localStorage.setItem('personajes', JSON.stringify(personajes));

    renderizarPersonajes(); 
    cerrarModalYResetear();
});

function renderizarPersonajes() {
    const contenedor = document.getElementById('personajesContainer');
    contenedor.innerHTML = '';
    const personajes = JSON.parse(localStorage.getItem('personajes')) || [];

    personajes.forEach((p, index) => { // Añadimos el índice para eliminar personajes
        const card = document.createElement('div');
        card.className = 'card-personaje';
        card.innerHTML = `
            <div class="card-inner">
                <img src="../../assets/imgs/${p.skin}" alt="Skin" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${p.nombre}</h3>
                    <p><strong>Raza:</strong> ${p.raza}</p>
                    <p><strong>Clase:</strong> ${p.clase}</p>
                    <p><strong>Fondo:</strong> ${p.background}</p>
                </div>
                <div class="card-buttons">
                    <button class="delete-btn" onclick="eliminarPersonaje(${index})">Eliminar</button>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function filtrarPorRaza(razaSeleccionada) {
    const contenedor = document.getElementById('personajesContainer');
    contenedor.innerHTML = '';
    const personajes = JSON.parse(localStorage.getItem('personajes')) || [];

    const filtrados = razaSeleccionada
        ? personajes.filter(p => p.raza === razaSeleccionada)
        : personajes;

    filtrados.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'card-personaje';
        card.innerHTML = `
            <div class="card-inner">
                <img src="../../assets/imgs/${p.skin}" alt="Skin" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${p.nombre}</h3>
                    <p><strong>Raza:</strong> ${p.raza}</p>
                    <p><strong>Clase:</strong> ${p.clase}</p>
                    <p><strong>Fondo:</strong> ${p.background}</p>
                </div>
                <div class="card-buttons">
                    <button class="delete-btn" onclick="eliminarPersonaje(${index})">Eliminar</button>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

filtroRaza.addEventListener('change', (e) => {
    const razaSeleccionada = e.target.value;
    filtrarPorRaza(razaSeleccionada);
});



document.getElementById('btnCrearPersonaje').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('hidden');
    document.body.classList.add('no-scroll');
});

document.getElementById('cerrarModal').addEventListener('click', () => {
    const resumen = document.getElementById('abilityScoreResumen');
    if (resumen) {
        resumen.remove();
    }

    habilidadActualIndex = 0;
    intentosRestantes = 3;
    resultadosTemporales = [];
    abilityScoresFinales = {};
    document.getElementById('tirarDados').disabled = false;
    document.getElementById('resultadosDados').innerHTML = '';
    document.getElementById('botonesEleccion').classList.add('hidden');
    document.getElementById('abilityScoreSection').dataset.stats = '';
    
    document.getElementById('abilityScoreSection').style.display = 'block';

    document.getElementById('modal').classList.add('hidden');
    document.body.classList.remove('no-scroll');
});



function cerrarModalYResetear() {
    document.getElementById('modal').classList.add('hidden');
    document.body.classList.remove('no-scroll');

    document.getElementById('nombrePersonaje').value = '';
    ['selectRaza', 'selectClase', 'selectFondo', 'selectAlineamiento', 'selectIdioma'].forEach(id => {
        document.getElementById(id).selectedIndex = 0;
    });

    habilidadActualIndex = 0;
    intentosRestantes = 3;
    resultadosTemporales = [];
    abilityScoresFinales = {};
    document.getElementById('tirarDados').disabled = false;
    document.getElementById('resultadosDados').innerHTML = '';
    document.getElementById('botonesEleccion').classList.add('hidden');
    document.getElementById('abilityScoreSection').dataset.stats = '';

    skinIndex = 1;
    actualizarSkin();

    const resumen = document.getElementById('abilityScoreResumen');
    if (resumen) {
        resumen.remove();
    }

    document.getElementById('abilityScoreSection').style.display = 'block';
}



function eliminarPersonaje(index) {
    const personajes = JSON.parse(localStorage.getItem('personajes')) || [];
    personajes.splice(index, 1);
    localStorage.setItem('personajes', JSON.stringify(personajes));

    const razaSeleccionada = document.getElementById('filtroRaza').value;
    filtrarPorRaza(razaSeleccionada);
}


const totalSkins = 10;
let skinIndex = 1;

const skinImg = document.getElementById('skinPreview');
const nextBtn = document.getElementById('nextSkin');
const prevBtn = document.getElementById('prevSkin');

function actualizarSkin() {
    skinImg.src = `../../assets/imgs/Gato${skinIndex}.png`;
}

nextBtn.addEventListener('click', () => {
    skinIndex = (skinIndex % totalSkins) + 1;
    actualizarSkin();
});

prevBtn.addEventListener('click', () => {
    skinIndex = (skinIndex - 2 + totalSkins) % totalSkins + 1;
    actualizarSkin();
});

loadAllData().then(() => {
    renderizarPersonajes();
});

loadAllData();
