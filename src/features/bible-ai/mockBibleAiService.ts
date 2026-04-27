import type { BibleAiRequest, BibleAiInsight } from './types'
import { getOriginalLanguage } from './utils'

/**
 * Mock Bible AI Service
 * Returns structured mock responses for Context and Original Language insights.
 * In production, this will be replaced with real AI provider (Gemini/OpenRouter/backend).
 */

export async function getMockContextInsight(request: BibleAiRequest): Promise<BibleAiInsight> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const reference = `${request.book} ${request.chapter}:${request.verseStart}`
  const hasContext = request.surroundingText && request.surroundingText.length > 0

  return {
    title: 'Contexto del pasaje',
    subtitle: reference,
    type: 'context',
    sections: [
      {
        title: 'Resumen del pasaje',
        body: hasContext
          ? `Analizando "${reference}" y los versículos cercanos, este pasaje forma parte de un mensaje de esperanza y confianza en Dios. El autor expresa la certeza de que Dios guía y sustenta a quienes confían en Él.`
          : 'Este versículo forma parte de un mensaje de esperanza y confianza en Dios. El autor expresa la certeza de que Dios guía y sustenta a quienes confían en Él.',
      },
      {
        title: 'Contexto histórico',
        body: 'Este pasaje fue escrito en un período de dificultad para el pueblo de Israel. La comunidad enfrentaba desafíos espirituales y necesitaba recordar la fidelidad de Dios a través de las generaciones.',
      },
      {
        title: 'Contexto cultural',
        body: 'En la cultura hebrea, la palabra escrita tenía un peso sagrado. Las metáforas de luz y guía divina eran comunes, especialmente en textos poéticos y sapienciales.',
      },
      {
        title: 'Contexto espiritual',
        body: 'Este versículo invita a la dependencia total de Dios. La Palabra no solo informa, sino que transforma y dirige cada paso del creyente.',
      },
      {
        title: 'Aplicación para hoy',
        body: 'En un mundo lleno de ruido y decisiones difíciles, este pasaje nos recuerda que la Biblia es nuestra brújula moral y espiritual. Leerla diariamente ilumina nuestro camino.',
      },
    ],
    disclaimer:
      'Esta explicación es una ayuda devocional y contextual. No reemplaza el acompañamiento pastoral ni el estudio bíblico profundo.',
  }
}

export async function getMockOriginalLanguageInsight(request: BibleAiRequest): Promise<BibleAiInsight> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const reference = `${request.book} ${request.chapter}:${request.verseStart}`
  const originalLang = getOriginalLanguage(request.book)

  return {
    title: 'Texto en idioma original',
    subtitle: reference,
    type: 'original_language',
    sections: [
      {
        title: 'Idioma original',
        body: originalLang,
      },
      {
        title: 'Nota de implementación',
        body: 'En una integración real, esta sección consultará léxicos bíblicos (Strong\'s Concordance, BDB, BDAG) y textos fuente para mostrar palabras originales específicas del versículo seleccionado.',
      },
      {
        title: 'Ejemplo de análisis léxico (mock)',
        body: 'Palabra clave de ejemplo:\n\nנֵר (ner) = lámpara\n• Raíz: נ-ר\n• Uso: Fuente de luz pequeña y portátil\n• Contexto: Guía inmediata para el camino\n\nEn una conexión real con IA, esta sección mostrará las palabras exactas del versículo consultado.',
      },
      {
        title: 'Matiz que puede perderse en español',
        body: 'Las traducciones al español condensan matices semánticos del texto original. Una IA con acceso a léxicos identificará distinciones entre sinónimos, tiempos verbales y partículas gramaticales que enriquecen la comprensión del pasaje.',
      },
      {
        title: 'Aplicación del matiz al pasaje',
        body: 'Comprender el idioma original nos ayuda a leer con mayor precisión y evitar interpretaciones forzadas. Sin embargo, la mayoría de traducciones confiables ya capturan el sentido esencial del texto.',
      },
    ],
    disclaimer:
      'Los matices del idioma original deben leerse con prudencia, usando fuentes bíblicas confiables y considerando el contexto completo del pasaje.',
  }
}
