jest.mock('../../../../services/firebase/firestore')

import {
  fetchLiveStream,
  fetchUpcomingStreams,
  fetchLatestSermons,
  fetchFeaturedVideo,
  fetchVideo,
  fetchAllSeries,
  fetchSeries,
  fetchSeriesEpisodes,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const videoBase = {
  youtubeVideoId: 'abc123',
  title: 'EL DIA DE MI RESURRECCIÓN',
  rawTitle: '138/EL DIA DE MI RESURRECCIÓN - CAP 1',
  contentType: 'sermon',
  isLive: false,
  isUpcoming: false,
  seriesSlug: 'el-dia-de-mi-resurreccion',
  episodeNumber: 1,
  internalOrder: 138,
}

const seriesBase = {
  slug: 'el-dia-de-mi-resurreccion',
  name: 'EL DIA DE MI RESURRECCIÓN',
  episodeCount: 3,
}

describe('videos repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchLiveStream', () => {
    it('queries for isLive == true and returns first result', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([videoBase] as never)

      const result = await fetchLiveStream()

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'youtube_videos',
        expect.anything(), // where isLive == true
        expect.anything(), // limit(1)
      )
      expect(result).toEqual(videoBase)
    })

    it('returns null when no live stream exists', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])

      expect(await fetchLiveStream()).toBeNull()
    })
  })

  describe('fetchUpcomingStreams', () => {
    it('queries for isUpcoming == true', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])

      await fetchUpcomingStreams()

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'youtube_videos',
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
    })
  })

  describe('fetchLatestSermons', () => {
    it('queries youtube_videos by contentType sermon', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([videoBase] as never)

      const result = await fetchLatestSermons()

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'youtube_videos',
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
      expect(result).toEqual([videoBase])
    })
  })

  describe('fetchFeaturedVideo', () => {
    it('returns null when no featured video', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])
      expect(await fetchFeaturedVideo()).toBeNull()
    })

    it('returns the first featured video', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([videoBase] as never)
      expect(await fetchFeaturedVideo()).toEqual(videoBase)
    })
  })

  describe('fetchVideo', () => {
    it('retrieves a video by id and merges the id field', async () => {
      const { youtubeVideoId: _ignored, ...stored } = videoBase
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(stored as never)

      const result = await fetchVideo('abc123')

      expect(firestoreService.getDocument).toHaveBeenCalledWith('youtube_videos/abc123')
      expect(result?.id).toBe('abc123')
    })

    it('returns null when video does not exist', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)
      expect(await fetchVideo('nonexistent')).toBeNull()
    })
  })

  describe('fetchAllSeries', () => {
    it('queries sermon_series collection', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([seriesBase] as never)

      const result = await fetchAllSeries()

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'sermon_series',
        expect.anything(),
        expect.anything(),
      )
      expect(result).toEqual([seriesBase])
    })
  })

  describe('fetchSeries', () => {
    it('retrieves a series by slug', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(seriesBase as never)

      const result = await fetchSeries('el-dia-de-mi-resurreccion')

      expect(firestoreService.getDocument).toHaveBeenCalledWith(
        'sermon_series/el-dia-de-mi-resurreccion',
      )
      expect(result?.id).toBe('el-dia-de-mi-resurreccion')
    })

    it('returns null when series does not exist', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)
      expect(await fetchSeries('nonexistent')).toBeNull()
    })
  })

  describe('fetchSeriesEpisodes', () => {
    it('queries youtube_videos by seriesSlug', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([videoBase] as never)

      const result = await fetchSeriesEpisodes('el-dia-de-mi-resurreccion')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'youtube_videos',
        expect.anything(), // where seriesSlug == ...
        expect.anything(), // orderBy episodeNumber
      )
      expect(result).toEqual([videoBase])
    })
  })
})
