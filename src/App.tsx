import { useEffect, useRef, useState } from 'react'

const POMODORO_TIME = 10
const MAX_DISTANCE = 50

const calculateDistance = (
  initialLatitude: number,
  newLatitude: number,
  initialLongitude: number,
  newLongitude: number
) => {
  const earthRadius = 6371000 // 地球の半径（メートル）

  const latitudeDiffRad = ((newLatitude - initialLatitude) * Math.PI) / 180
  const longitudeDiffRad = ((newLongitude - initialLongitude) * Math.PI) / 180

  const a =
    Math.sin(latitudeDiffRad / 2) * Math.sin(latitudeDiffRad / 2) +
    Math.cos((initialLatitude * Math.PI) / 180) *
      Math.cos((newLatitude * Math.PI) / 180) *
      Math.sin(longitudeDiffRad / 2) *
      Math.sin(longitudeDiffRad / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = earthRadius * c
  return distance
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  let formattedMinutes
  if (minutes < 10) {
    formattedMinutes = `0${minutes}`
  } else {
    formattedMinutes = minutes
  }

  let seconds = time % 60
  let formattedSeconds
  if (seconds < 10) {
    formattedSeconds = `0${seconds}`
  } else {
    formattedSeconds = seconds
  }
  return `${formattedMinutes}:${formattedSeconds}`
}

function App() {
  const positionRef = useRef<GeolocationPosition | null>(null)
  const [distance, setDistance] = useState(0)
  const [isWalking, setIsWalking] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [seconds, setSeconds] = useState(POMODORO_TIME)

  const countDown = () => {
    if (seconds === 1) {
      setSeconds(0)
      stopTimer()
      setIsRunning(false)
      setIsWalking(true)
      return
    }
    setSeconds((prev) => prev - 1)
  }

  const startTimer = () => {
    setIsWalking(false)
    setIsRunning(true)
    timerRef.current = setInterval(countDown, 1000)
  }

  const stopTimer = () => {
    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSeconds(POMODORO_TIME)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  useEffect(() => {
    if (!isWalking) {
      return
    }
    const updateDistance = () => {
      if (distance >= MAX_DISTANCE) {
        alert('散歩お疲れ様です！')
        setIsWalking(false)
        setDistance(0)
        setSeconds(POMODORO_TIME)
        return
      }
      navigator.geolocation.getCurrentPosition((newPosition) => {
        if (positionRef.current) {
          const dif = Math.floor(
            calculateDistance(
              positionRef.current.coords.latitude,
              newPosition.coords.latitude,
              positionRef.current.coords.longitude,
              newPosition.coords.longitude
            )
          )
          if (dif >= 10) {
            setDistance((prev) => {
              if (prev + dif >= MAX_DISTANCE) {
                return MAX_DISTANCE
              }
              return prev + dif
            })
          }
        }
        positionRef.current = newPosition
        console.log(positionRef.current)
      })
    }
    const interval = setInterval(updateDistance, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [distance, isWalking])

  return (
    <div className="bg-blue-50 w-full h-[100dvh]">
      <header className="h-16 bg-white flex items-center px-5">
        <h1 className="font-bold text-lg">POMO道路</h1>
      </header>
      <main>
        <section className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={
              'flex flex-col items-center ' +
              (isWalking ? 'text-gray-400 pointer-events-none' : '')
            }
          >
            <div className="text-7xl font-bold font-mono">
              {formatTime(seconds)}
            </div>
            <div className="flex text-4xl mt-3 gap-2">
              <button
                onClick={startTimer}
                className={isRunning ? 'hidden' : 'w-16 h-16'}
              >
                ▶
              </button>
              <button
                onClick={stopTimer}
                className={isRunning ? 'w-16 h-16' : 'hidden'}
              >
                ■
              </button>
              <button onClick={resetTimer} className="w-16 h-16">
                ↺
              </button>
            </div>
          </div>
          <div
            className={
              isWalking
                ? 'absolute left-1/2 -translate-x-1/2 mt-5 w-full h-12 bg-white border-2 border-blue-500'
                : 'hidden'
            }
          >
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${(distance * 100) / MAX_DISTANCE}%` }}
            />
            <p className="flex justify-between mt-1">
              <span>0m</span>
              <span>{MAX_DISTANCE}m</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
