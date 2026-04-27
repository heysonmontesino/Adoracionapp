export const MOCK_DATA = {
  home: {
    // liveVideoId: YouTube video ID del live/servicio actual.
    // Reemplazar con el ID real del live del canal de la iglesia.
    liveVideoId: 'K4TOrB7at0Y',
    featuredSermon: {
      // id debe ser el YouTube videoId real cuando el API esté conectado
      id: 'H-rhlLpOjm4',
      title: 'Caminando sobre las Aguas',
      description: 'Una reflexión profunda sobre la fe en medio de las tormentas de la vida, basada en Mateo 14.',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500',
    },
    latestMessage: {
      id: 'msg-1',
      title: 'Palabra del Pastor',
      body: 'Esta semana nos enfocamos en el servicio. La verdadera grandeza se encuentra en servir a los demás con amor y humildad.',
    },
    pinnedAnnouncement: {
      id: 'ann-1',
      title: 'Campamento de Jóvenes 2024',
      body: 'Inscripciones abiertas para nuestro encuentro anual "Corazón Valiente". ¡No te lo pierdas!',
    }
  },
  content: {
    series: [
      { id: 'ser-1', title: 'Fundamentos de la Fe', items: 12 },
      { id: 'ser-2', title: 'Relaciones Saludables', items: 8 },
      { id: 'ser-3', title: 'Liderazgo Bíblico', items: 15 },
    ]
  },
  community: {
    groups: [
      { id: 'g1', name: 'Hombres de Valor', members: 45 },
      { id: 'g2', name: 'Círculo de Oración', members: 120 },
    ],
    prayers: [
      { id: 'p1', author: 'María L.', request: 'Por la salud de mi abuela Petronila.', votes: 24 },
    ]
  },
  progress: {
    // XP raw — el engine deriva todo lo demás (stage, next, thresholds)
    xp: 450,
    streakDays: 7,
    stats: {
      sermonsWatched: 24,
      studyHours: 12,
      communityPoints: 150,
    },
    // Estado de retos demo (en producción vendrá de Firestore)
    dailyCompleted: {
      'daily-bible': true,
      'daily-pray': true,
      'daily-gratitude': false,
    },
    weeklyCompleted: [] as string[],
    monthlyCompleted: false,
  },
  profile: {
    name: 'Usuario Demo',
    email: 'demo@adoracion.app',
    avatar: 'https://i.pravatar.cc/150?u=demo',
    membershipDate: 'Enero 2024',
  }
} as const;
