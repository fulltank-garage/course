import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AlertCircle, PlayCircle } from 'lucide-react'
import type { Lesson } from '../types/course'
import {
  formatPlaybackTime,
  getPlaybackPercent,
  getPlaybackStorageKey,
  getStoredPlaybackTime,
  savePlaybackProgressTime,
  savePlaybackTime,
} from '../utils/playback'
import { resolveVideoSource } from '../utils/video'

const MuxPlayer = lazy(() => import('@mux/mux-player-react'))

interface VideoPlayerProps {
  lesson: Lesson
  poster?: string
  courseTitle: string
  compact?: boolean
  onPlaybackProgress?: (progress: { currentTime: number; duration: number; percent: number }) => void
}

type PlaybackTarget = {
  currentTime: number
  duration: number
}

export default function VideoPlayer({ lesson, poster, courseTitle, compact = false, onPlaybackProgress }: VideoPlayerProps) {
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [savedPlaybackTime, setSavedPlaybackTime] = useState(() => getStoredPlaybackTime(lesson.id))
  const lastSavedSecondRef = useRef(0)
  const restoredLessonRef = useRef<string | null>(null)
  const videoSource = resolveVideoSource(lesson.videoUrl)

  useEffect(() => {
    queueMicrotask(() => {
      setPlaybackError(null)
      setSavedPlaybackTime(getStoredPlaybackTime(lesson.id))
      lastSavedSecondRef.current = 0
      restoredLessonRef.current = null
    })
  }, [lesson.id, lesson.videoUrl])

  const restorePlaybackPosition = (target: PlaybackTarget) => {
    setPlaybackError(null)

    const storedTime = getStoredPlaybackTime(lesson.id)
    const canRestoreStoredTime =
      storedTime > 3 &&
      Number.isFinite(target.duration) &&
      target.duration > storedTime + 3 &&
      restoredLessonRef.current !== lesson.id

    if (canRestoreStoredTime) {
      target.currentTime = storedTime
      restoredLessonRef.current = lesson.id
      setSavedPlaybackTime(storedTime)
      onPlaybackProgress?.({
        currentTime: storedTime,
        duration: target.duration,
        percent: getPlaybackPercent(storedTime, target.duration),
      })
      return
    }

    if (target.duration > 0.2 && target.currentTime < 0.05 && restoredLessonRef.current !== lesson.id) {
      target.currentTime = 0.1
      restoredLessonRef.current = lesson.id
    }
  }

  const showFirstVideoFrame = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    restorePlaybackPosition(event.currentTarget)
  }

  const restoreMuxPlaybackPosition = (event: Event) => {
    restorePlaybackPosition(event.currentTarget as unknown as PlaybackTarget)
  }

  const rememberPlaybackTargetTime = (target: PlaybackTarget) => {
    const currentSecond = Math.floor(target.currentTime)

    if (currentSecond < 1) return

    setSavedPlaybackTime(currentSecond)
    onPlaybackProgress?.({
      currentTime: target.currentTime,
      duration: target.duration,
      percent: getPlaybackPercent(target.currentTime, target.duration),
    })
    savePlaybackProgressTime(lesson.id, target.currentTime, target.duration)

    if (lastSavedSecondRef.current > 0 && Math.abs(currentSecond - lastSavedSecondRef.current) < 5) return

    lastSavedSecondRef.current = currentSecond
    savePlaybackTime(lesson.id, target.currentTime, target.duration)
  }

  const rememberPlaybackTime = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    rememberPlaybackTargetTime(event.currentTarget)
  }

  const rememberMuxPlaybackTime = (event: Event) => {
    rememberPlaybackTargetTime(event.currentTarget as unknown as PlaybackTarget)
  }

  const clearFinishedPlayback = (target?: PlaybackTarget) => {
    const duration = target?.duration ?? 0
    const currentTime = duration > 0 ? duration : target?.currentTime ?? 0

    savePlaybackProgressTime(lesson.id, currentTime, duration)
    localStorage.removeItem(getPlaybackStorageKey(lesson.id))
    setSavedPlaybackTime(0)
    lastSavedSecondRef.current = 0
    onPlaybackProgress?.({ currentTime, duration, percent: 100 })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-lg shadow-slate-950/20">
      {videoSource ? (
        <>
          {videoSource.kind === 'youtube' ? (
            <iframe
              className="aspect-video max-h-[68vh] w-full bg-slate-950"
              src={videoSource.embedUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : videoSource.kind === 'mux' ? (
            <Suspense
              fallback={
                <div className="flex aspect-video max-h-[68vh] w-full items-center justify-center bg-slate-950 text-sm text-slate-300">
                  กำลังโหลดวิดีโอ...
                </div>
              }
            >
              <MuxPlayer
                className="aspect-video max-h-[68vh] w-full bg-slate-950"
                playbackId={videoSource.playbackId}
                streamType="on-demand"
                poster={poster}
                onLoadedMetadata={restoreMuxPlaybackPosition}
                onLoadedData={() => setPlaybackError(null)}
                onTimeUpdate={rememberMuxPlaybackTime}
                onPause={rememberMuxPlaybackTime}
                onSeeked={rememberMuxPlaybackTime}
                onEnded={(event) => clearFinishedPlayback(event.currentTarget as unknown as PlaybackTarget)}
                onError={() => setPlaybackError('วิดีโอนี้เปิดไม่ได้ในเบราว์เซอร์ กรุณาตรวจสอบ Mux playback ID หรือสถานะวิดีโอ')}
              />
            </Suspense>
          ) : (
            <video
              key={videoSource.src}
              className="aspect-video max-h-[68vh] w-full bg-slate-950 object-contain"
              controls
              playsInline
              preload="auto"
              poster={poster}
              src={videoSource.src}
              onLoadedMetadata={showFirstVideoFrame}
              onLoadedData={() => setPlaybackError(null)}
              onTimeUpdate={rememberPlaybackTime}
              onPause={rememberPlaybackTime}
              onSeeked={rememberPlaybackTime}
              onEnded={(event) => clearFinishedPlayback(event.currentTarget)}
              onError={() =>
                setPlaybackError('วิดีโอนี้เปิดไม่ได้ในเบราว์เซอร์ กรุณาตรวจสอบ URL หรือใช้ลิงก์ MP4 ที่เข้าถึงได้โดยตรง')
              }
            >
              เบราว์เซอร์นี้ไม่รองรับวิดีโอ
            </video>
          )}
          {playbackError ? (
            <div className="border-t border-amber-400/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{playbackError}</p>
              </div>
            </div>
          ) : null}
          {(videoSource.kind === 'direct' || videoSource.kind === 'mux') && savedPlaybackTime > 3 && !playbackError ? (
            <div className="border-t border-white/10 bg-slate-950 px-4 py-2 text-xs text-slate-300">
              เรียนค้างไว้ที่ {formatPlaybackTime(savedPlaybackTime)}
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,#1e293b_0,#020617_60%)] text-white">
          <div className="text-center">
            <PlayCircle size={54} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-300">เพิ่มลิงก์วิดีโอของบทเรียนเพื่อแสดงตัวเล่นตรงนี้</p>
          </div>
        </div>
      )}
      {!compact ? (
        <div className="border-t border-white/10 bg-slate-950 p-4 text-white">
          <p className="text-xs uppercase text-slate-400">{courseTitle}</p>
          <h1 className="mt-1 text-lg font-semibold">{lesson.title}</h1>
        </div>
      ) : null}
    </div>
  )
}
