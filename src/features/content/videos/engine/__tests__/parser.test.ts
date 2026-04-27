import {
  parseTitle,
  parseInternalOrder,
  parseSeriesFromTitle,
  parseEpisodeNumber,
  classifyContentType,
  extractPreacherName,
  slugify,
  buildSeriesSlug,
} from '../parser'

// ─── parseTitle ───────────────────────────────────────────────────────────────

describe('parseTitle', () => {
  it('parses a series episode with internal order', () => {
    const result = parseTitle('138/EL DIA DE MI RESURRECCIÓN - CAP 1')
    expect(result.internalOrder).toBe(138)
    expect(result.cleanTitle).toBe('EL DIA DE MI RESURRECCIÓN')
    expect(result.seriesName).toBe('EL DIA DE MI RESURRECCIÓN')
    expect(result.episodeNumber).toBe(1)
    expect(result.isStandalone).toBe(false)
  })

  it('parses a standalone sermon (no CAP suffix)', () => {
    const result = parseTitle('137/QUIEN ENTRA HOY EN TU VIDA ?')
    expect(result.internalOrder).toBe(137)
    expect(result.cleanTitle).toBe('QUIEN ENTRA HOY EN TU VIDA ?')
    expect(result.seriesName).toBeNull()
    expect(result.episodeNumber).toBeNull()
    expect(result.isStandalone).toBe(true)
  })

  it('parses a series episode with zero-padded episode number', () => {
    const result = parseTitle('135/NO TODO EL QUE TE SIGUE ES TU AMIGO - CAP 02')
    expect(result.internalOrder).toBe(135)
    expect(result.cleanTitle).toBe('NO TODO EL QUE TE SIGUE ES TU AMIGO')
    expect(result.seriesName).toBe('NO TODO EL QUE TE SIGUE ES TU AMIGO')
    expect(result.episodeNumber).toBe(2)
    expect(result.isStandalone).toBe(false)
  })

  it('parses a series episode with episode number > 1', () => {
    const result = parseTitle('133/LA VANIDAD DE LA RELIGION - CAP 4')
    expect(result.internalOrder).toBe(133)
    expect(result.cleanTitle).toBe('LA VANIDAD DE LA RELIGION')
    expect(result.seriesName).toBe('LA VANIDAD DE LA RELIGION')
    expect(result.episodeNumber).toBe(4)
    expect(result.isStandalone).toBe(false)
  })

  it('returns nulls for a non-channel-format title (worship video)', () => {
    const result = parseTitle('Worship en Español 2026 | BUENO ES ALABARTE – Iglesia Adoración...')
    expect(result.internalOrder).toBeNull()
    expect(result.seriesName).toBeNull()
    expect(result.episodeNumber).toBeNull()
    expect(result.isStandalone).toBe(false)
    expect(result.cleanTitle).toBe('Worship en Español 2026 | BUENO ES ALABARTE – Iglesia Adoración...')
  })

  it('handles case-insensitive CAP keyword', () => {
    const result = parseTitle('140/TÍTULO DE SERIE - cap 5')
    expect(result.episodeNumber).toBe(5)
    expect(result.seriesName).toBe('TÍTULO DE SERIE')
  })

  it('handles en-dash separator in CAP pattern', () => {
    const result = parseTitle('141/OTRA SERIE – CAP 3')
    expect(result.episodeNumber).toBe(3)
    expect(result.seriesName).toBe('OTRA SERIE')
  })
})

// ─── Convenience accessors ────────────────────────────────────────────────────

describe('parseInternalOrder', () => {
  it('extracts the order number from a valid title', () => {
    expect(parseInternalOrder('138/EL DIA DE MI RESURRECCIÓN - CAP 1')).toBe(138)
  })

  it('returns null for non-channel titles', () => {
    expect(parseInternalOrder('Worship en Español 2026')).toBeNull()
  })
})

describe('parseSeriesFromTitle', () => {
  it('returns the series name for multi-episode series', () => {
    expect(parseSeriesFromTitle('135/NO TODO EL QUE TE SIGUE ES TU AMIGO - CAP 02')).toBe(
      'NO TODO EL QUE TE SIGUE ES TU AMIGO',
    )
  })

  it('returns null for standalone sermons', () => {
    expect(parseSeriesFromTitle('137/QUIEN ENTRA HOY EN TU VIDA ?')).toBeNull()
  })

  it('returns null for worship titles', () => {
    expect(parseSeriesFromTitle('Worship en Español 2026 | BUENO ES ALABARTE')).toBeNull()
  })
})

describe('parseEpisodeNumber', () => {
  it('extracts episode number 1', () => {
    expect(parseEpisodeNumber('138/EL DIA DE MI RESURRECCIÓN - CAP 1')).toBe(1)
  })

  it('extracts zero-padded episode number', () => {
    expect(parseEpisodeNumber('135/NO TODO EL QUE TE SIGUE ES TU AMIGO - CAP 02')).toBe(2)
  })

  it('returns null for standalone sermon', () => {
    expect(parseEpisodeNumber('137/QUIEN ENTRA HOY EN TU VIDA ?')).toBeNull()
  })
})

// ─── classifyContentType ──────────────────────────────────────────────────────

describe('classifyContentType', () => {
  it('classifies live broadcast as live', () => {
    expect(
      classifyContentType({ title: '138/SERMÓN - CAP 1', liveBroadcastContent: 'live' }),
    ).toBe('live')
  })

  it('classifies upcoming broadcast as upcoming', () => {
    expect(
      classifyContentType({ title: '138/SERMÓN - CAP 1', liveBroadcastContent: 'upcoming' }),
    ).toBe('upcoming')
  })

  it('classifies NNN/ prefix titles as sermon', () => {
    expect(classifyContentType({ title: '138/EL DIA DE MI RESURRECCIÓN - CAP 1' })).toBe('sermon')
    expect(classifyContentType({ title: '137/QUIEN ENTRA HOY EN TU VIDA ?' })).toBe('sermon')
    expect(classifyContentType({ title: '135/NO TODO EL QUE TE SIGUE ES TU AMIGO - CAP 02' })).toBe('sermon')
    expect(classifyContentType({ title: '133/LA VANIDAD DE LA RELIGION - CAP 4' })).toBe('sermon')
  })

  it('classifies Worship title as worship', () => {
    expect(
      classifyContentType({
        title: 'Worship en Español 2026 | BUENO ES ALABARTE – Iglesia Adoración...',
      }),
    ).toBe('worship')
  })

  it('classifies worship by description keyword when title is neutral', () => {
    expect(
      classifyContentType({
        title: 'Servicio especial',
        description: 'Una noche de alabanza y adoración.',
      }),
    ).toBe('worship')
  })

  it('classifies unrecognized titles as misc', () => {
    expect(classifyContentType({ title: 'Bienvenidos a Iglesia Adoración' })).toBe('misc')
  })

  it('sermon takes priority over worship keywords in description', () => {
    expect(
      classifyContentType({
        title: '130/MENSAJE ESPECIAL - CAP 1',
        description: 'Servicio de alabanza',
      }),
    ).toBe('sermon')
  })

  it('live takes priority over sermon format in title', () => {
    expect(
      classifyContentType({ title: '138/TRANSMISIÓN EN VIVO - CAP 1', liveBroadcastContent: 'live' }),
    ).toBe('live')
  })
})

// ─── extractPreacherName ──────────────────────────────────────────────────────

describe('extractPreacherName', () => {
  it('extracts full name after "Pastor"', () => {
    expect(extractPreacherName('Predicado por Pastor Carlos Rodríguez')).toBe('Carlos Rodríguez')
  })

  it('extracts full name after "Pr."', () => {
    expect(extractPreacherName('Pr. Juan Torres — Iglesia Adoración')).toBe('Juan Torres')
  })

  it('extracts full name after "Predicador:"', () => {
    expect(extractPreacherName('Predicador: Ana González')).toBe('Ana González')
  })

  it('returns null when no pattern matches', () => {
    expect(extractPreacherName('Transmisión en vivo de nuestra iglesia')).toBeNull()
  })
})

// ─── slugify / buildSeriesSlug ────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('EL DIA DE MI RESURRECCIÓN')).toBe('el-dia-de-mi-resurreccion')
  })

  it('strips diacritics', () => {
    expect(slugify('LA VANIDAD DE LA RELIGIÓN')).toBe('la-vanidad-de-la-religion')
  })

  it('removes non-alphanumeric characters', () => {
    expect(slugify('QUIEN ENTRA HOY EN TU VIDA ?')).toBe('quien-entra-hoy-en-tu-vida')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('NO  TODO  EL  QUE')).toBe('no-todo-el-que')
  })
})

describe('buildSeriesSlug', () => {
  it('builds a slug from a series name', () => {
    expect(buildSeriesSlug('NO TODO EL QUE TE SIGUE ES TU AMIGO')).toBe(
      'no-todo-el-que-te-sigue-es-tu-amigo',
    )
  })
})
