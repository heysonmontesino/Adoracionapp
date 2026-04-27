// ─── Frases motivacionales diarias ───────────────────────────────────────────
// Rotan por día del año. Sin backend. Determinísticas y fáciles de testear.

export const MOTIVATIONAL_PHRASES: string[] = [
  'Cada día que oras es un día que avanzas.',
  'La disciplina espiritual de hoy es la fortaleza de mañana.',
  'No te rindas — el fruto del Espíritu crece con el tiempo.',
  'Dios ve cada pequeño paso que das en fe.',
  'La constancia en lo pequeño prepara para lo grande.',
  'Hoy es una nueva oportunidad de crecer espiritualmente.',
  'El hombre que ora es el hombre que avanza.',
  'Tu carrera espiritual se gana un día a la vez.',
  'Persevera — la raíz crece antes que la flor.',
  'El crecimiento espiritual no se detiene cuando sigues fiel.',
  'Cada capítulo que lees es semilla plantada en tu corazón.',
  'No compares tu etapa — avanza en la tuya.',
  'La fe que actúa transforma más que la fe que espera.',
  'Hoy puedes dar ese paso que te acerca a la siguiente etapa.',
  'El camino espiritual no es velocidad, es dirección.',
  'Lo que cultivas hoy cosecharás mañana.',
  'Dios honra a quienes lo buscan con constancia.',
  'Un día de fidelidad vale más que mil de intención.',
  'El que persevera hasta el fin es el que llega.',
  'Tu etapa de hoy fue algún día la meta de otro.',
  'Avanza. Aunque sea despacio, no te detengas.',
]

// Retorna una frase que rota diariamente (determinística, testeable)
export function getDailyMotivationalPhrase(now: Date = new Date()): string {
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return MOTIVATIONAL_PHRASES[dayOfYear % MOTIVATIONAL_PHRASES.length]
}
