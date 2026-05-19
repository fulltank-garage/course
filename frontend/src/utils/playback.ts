export const playbackStoragePrefix = 'mycourse_video_playback'
export const playbackProgressStoragePrefix = 'mycourse_video_playback_progress'

const authStorageKey = 'mycourse_auth'

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem(authStorageKey)
    const session = raw ? JSON.parse(raw) : null
    return typeof session?.user?.id === 'string' ? session.user.id : 'guest'
  } catch {
    return 'guest'
  }
}

export const getPlaybackStorageKey = (lessonId: string) => `${playbackStoragePrefix}:${getCurrentUserId()}:${lessonId}`
export const getPlaybackProgressStorageKey = (lessonId: string) => `${playbackProgressStoragePrefix}:${getCurrentUserId()}:${lessonId}`

export const getStoredPlaybackTime = (lessonId: string) => {
  const value = Number(localStorage.getItem(getPlaybackStorageKey(lessonId)) ?? 0)
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const getStoredPlaybackProgressTime = (lessonId: string) => {
  const value = Number(localStorage.getItem(getPlaybackProgressStorageKey(lessonId)) ?? 0)
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const savePlaybackTime = (lessonId: string, currentTime: number, duration: number) => {
  if (!Number.isFinite(currentTime) || currentTime < 1) return

  if (Number.isFinite(duration) && duration > 0 && currentTime >= duration - 3) {
    localStorage.removeItem(getPlaybackStorageKey(lessonId))
    return
  }

  localStorage.setItem(getPlaybackStorageKey(lessonId), String(Math.floor(currentTime)))
}

export const savePlaybackProgressTime = (lessonId: string, currentTime: number, duration: number) => {
  if (!Number.isFinite(currentTime) || currentTime < 1) return

  const progressTime = Number.isFinite(duration) && duration > 0 ? Math.min(currentTime, duration) : currentTime
  localStorage.setItem(getPlaybackProgressStorageKey(lessonId), String(Math.floor(progressTime)))
}

export const formatPlaybackTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export const getPlaybackPercent = (currentTime: number, duration: number) => {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return 0
  const percent = (currentTime / duration) * 100

  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10))
}

export const formatPlaybackPercent = (percent: number) => {
  const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0

  if (safePercent > 0 && safePercent < 1) return `${safePercent.toFixed(1)}%`
  if (safePercent % 1 !== 0) return `${safePercent.toFixed(1)}%`
  return `${Math.round(safePercent)}%`
}

export const parseDurationToSeconds = (duration: string) => {
  const parts = duration
    .split(':')
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part))

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  const minutes = Number(duration.match(/(\d+)\s*(?:นาที|min|m)/i)?.[1] ?? 0)
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 0
}
