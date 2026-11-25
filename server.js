const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables de entorno protegidas en Render
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAPS_API_KEY = process.env.MAPS_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Endpoint seguro para entregar configuración pública al frontend
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
    mapsApiKey: MAPS_API_KEY
  });
});

// Endpoint del Asistente Inteligente Gemini conectado a Supabase
app.post('/api/chat', async (req, res) => {
  try {
    const { pregunta } = req.body;
    if (!pregunta) {
      return res.status(400).json({ error: 'Falta la pregunta del usuario.' });
    }

    // 1. Consultar los registros reales actuales desde Supabase
    const { data: locales, error } = await supabase
      .from('establecimientos')
      .select('*');

    if (error) throw error;

    // 2. Construir el contexto para Gemini
    const contextoBaseDatos = JSON.stringify(locales, null, 2);
    const promptSistema = `
Eres el asistente inteligente de "PetCare AI", una plataforma de veterinarias, peluquerías caninas y tiendas de mascotas en Asunción.
Reglas obligatorias:
1. Responde de forma amable, clara y directa en español.
2. Cuando te pregunten por locales, servicios, horarios o precios, usa ÚNICAMENTE los datos reales de esta base de datos actualizada:
${contextoBaseDatos}
3. Si te hacen preguntas generales sobre cuidados de cachorros, accesorios para gatos o salud de mascotas, brinda una orientación general útil, pero SIEMPRE aclara al final que tus consejos son orientativos y no sustituyen la consulta con un médico veterinario.
4. No inventes establecimientos que no estén en la lista.

Pregunta del usuario: ${pregunta}
`;

    // 3. Llamar a la API de Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptSistema }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Gemini:', data);
      return res.status(500).json({ error: 'Error al comunicarse con Gemini AI.' });
    }

    const respuestaIA =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Lo siento, no pude generar una respuesta en este momento.';

    res.json({ respuesta: respuestaIA });
  } catch (err) {
    console.error('Error en /api/chat:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor PetCare AI corriendo en puerto ${PORT}`);
});
