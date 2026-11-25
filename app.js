// Configuración de Supabase
const SUPABASE_URL = 'https://wcuulhecexsrnxwkotzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EyLbho4AdiX37snfP7b2oA_czzvuHUN';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referencias del DOM
const form = document.getElementById('form-programa');
const tituloForm = document.getElementById('titulo-formulario');
const inputId = document.getElementById('programa-id');
const inputPrograma = document.getElementById('programa');
const inputGenero = document.getElementById('genero');
const inputAlias = document.getElementById('alias');
const inputFecha = document.getElementById('fecha');
const inputDuracion = document.getElementById('duracion');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const filtroGenero = document.getElementById('filtro-genero');
const listaProgramas = document.getElementById('lista-programas');

// Cargar registros al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  obtenerProgramas();
});

// Evento para filtrar por género
filtroGenero.addEventListener('change', () => {
  obtenerProgramas();
});

// Evento para guardar (Crear o Actualizar)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    programa: inputPrograma.value.trim(),
    genero: inputGenero.value,
    alias_conductor: inputAlias.value.trim(),
    fecha: inputFecha.value,
    duracion_minutos: parseInt(inputDuracion.value)
  };

  const idEdicion = inputId.value;

  if (idEdicion) {
    // Modificar registro existente
    const { error } = await supabaseClient
      .from('agenda_radio')
      .update(datos)
      .eq('id', idEdicion);

    if (error) {
      alert('Error al modificar: ' + error.message);
      return;
    }
  } else {
    // Crear nuevo registro
    const { error } = await supabaseClient
      .from('agenda_radio')
      .insert([datos]);

    if (error) {
      alert('Error al guardar: ' + error.message);
      return;
    }
  }

  limpiarFormulario();
  obtenerProgramas();
});

// Cancelar edición
btnCancelar.addEventListener('click', limpiarFormulario);

// Listar y filtrar registros desde Supabase
async function obtenerProgramas() {
  const generoSeleccionado = filtroGenero.value;

  let consulta = supabaseClient
    .from('agenda_radio')
    .select('*')
    .order('fecha', { ascending: true });

  if (generoSeleccionado !== 'todos') {
    consulta = consulta.eq('genero', generoSeleccionado);
  }

  const { data, error } = await consulta;

  if (error) {
    console.error('Error al cargar:', error.message);
    return;
  }

  renderizarTabla(data);
}

// Dibujar filas en la tabla HTML
function renderizarTabla(programas) {
  listaProgramas.innerHTML = '';

  if (programas.length === 0) {
    listaProgramas.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#777;">No hay programas registrados para este filtro.</td>
      </tr>
    `;
    return;
  }

  programas.forEach((item) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${item.programa}</strong></td>
      <td><span class="badge">${item.genero}</span></td>
      <td>${item.alias_conductor}</td>
      <td>${item.fecha}</td>
      <td>${item.duracion_minutos} min</td>
      <td>
        <button class="btn-editar" onclick="prepararEdicion(${item.id}, '${item.programa.replace(/'/g, "\\'")}', '${item.genero}', '${item.alias_conductor.replace(/'/g, "\\'")}', '${item.fecha}', ${item.duracion_minutos})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarPrograma(${item.id})">Eliminar</button>
      </td>
    `;
    listaProgramas.appendChild(fila);
  });
}

// Cargar datos en el formulario para modificar
window.prepararEdicion = function(id, programa, genero, alias, fecha, duracion) {
  inputId.value = id;
  inputPrograma.value = programa;
  inputGenero.value = genero;
  inputAlias.value = alias;
  inputFecha.value = fecha;
  inputDuracion.value = duracion;

  tituloForm.textContent = 'Modificar programa seleccionado';
  btnGuardar.textContent = 'Actualizar Cambios';
  btnCancelar.classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Eliminar registro
window.eliminarPrograma = async function(id) {
  const confirmar = confirm('¿Seguro que querés eliminar este programa de la agenda?');
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from('agenda_radio')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar: ' + error.message);
    return;
  }

  obtenerProgramas();
};

// Resetear formulario
function limpiarFormulario() {
  form.reset();
  inputId.value = '';
  tituloForm.textContent = 'Registrar nuevo programa';
  btnGuardar.textContent = 'Guardar Programa';
  btnCancelar.classList.add('oculto');
}