const aprobadas = new Set();
let materias = [];

function guardarAprobadas() {
  localStorage.setItem('materiasAprobadas', JSON.stringify(Array.from(aprobadas)));
}

async function cargarMaterias() {
  try {
    const res = await fetch('data/materias.json');
    if (!res.ok) throw new Error('No se pudo cargar el JSON');
    materias = await res.json();
    // Recuperar materias aprobadas guardadas en LS
    const guardadas = localStorage.getItem('materiasAprobadas');
    if (guardadas) {
      const cods = JSON.parse(guardadas);
      cods.forEach((cod) => aprobadas.add(cod));
    }

    // Agrupar por año
    const años = {};
    materias.forEach((m) => {
      if (!años[m.año]) años[m.año] = [];
      años[m.año].push(m);
    });

    const contenedorAños = document.getElementById('contenedor-años');
    contenedorAños.innerHTML = '';

    const numerosAños = Object.keys(años).sort((a, b) => a - b);

    for (const año of numerosAños) {
      const divAño = document.createElement('div');
      divAño.className = 'año';
      divAño.innerHTML = `<h2>${año}° Año</h2>`;

      const divMalla = document.createElement('div');
      divMalla.className = 'malla';

      años[año].forEach((materia) => {
        const div = document.createElement('div');
        div.className = 'materia bloqueada';
        div.textContent = materia.nombre;

        // Estado según aprobadas y correlativas
        if (aprobadas.has(materia.cod)) {
          div.classList.remove('bloqueada');
          div.classList.add('aprobada');
        } else if (
          materia.correlativas.length === 0 ||
          materia.correlativas.every((c) => aprobadas.has(c))
        ) {
          div.classList.remove('bloqueada');
          div.classList.add('activa');
        }

        div.onclick = () => aprobarMateria(materia, div);
        divMalla.appendChild(div);
      });

      divAño.appendChild(divMalla);
      contenedorAños.appendChild(divAño);
    }
  } catch (error) {
    console.error('Error al cargar materias:', error);
    document.getElementById('contenedor-semestres').innerHTML =
      "<p style='color:red;'>Error: no se pudo cargar el archivo materias.json</p>";
  }
}

// Desplazamiento horizontal con botones
document.getElementById('btn-left').onclick = () => {
  document.getElementById('contenedor-años').scrollBy({
    left: -300,
    behavior: 'smooth',
  });
};

document.getElementById('btn-right').onclick = () => {
  document.getElementById('contenedor-años').scrollBy({
    left: 300,
    behavior: 'smooth',
  });
};

function aprobarMateria(materia, div) {
  if (div.classList.contains('bloqueada')) return;

  if (div.classList.contains('aprobada')) {
    // Desmarcar aprobada, vuelve a activa
    aprobadas.delete(materia.cod);
    div.classList.remove('aprobada');
    div.classList.add('activa');
  } else if (div.classList.contains('activa')) {
    // Marcar aprobada
    aprobadas.add(materia.cod);
    div.classList.remove('activa');
    div.classList.add('aprobada');
  }

  // Actualizar estados de todas las materias según correlativas
  document.querySelectorAll('.materia').forEach((btn) => {
    const m = materias.find((x) => x.nombre === btn.textContent);
    if (!aprobadas.has(m.cod)) {
      const todasCumplidas = m.correlativas.every((cod) => aprobadas.has(cod));
      if (todasCumplidas) {
        btn.classList.remove('bloqueada');
        btn.classList.add('activa');
        btn.classList.remove('aprobada');
      } else {
        btn.classList.add('bloqueada');
        btn.classList.remove('activa');
        btn.classList.remove('aprobada');
      }
    }
  });

  guardarAprobadas();
}

cargarMaterias();
