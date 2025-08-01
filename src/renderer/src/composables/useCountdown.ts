import { Ref, ref } from 'vue'

interface UseCountdownProps {
  onTimerFinish: () => void
}

interface UseCountdownReturn {
  startCountdown: (sec: number) => void
  timer: Ref<number>
}

export const useCountdown = ({ onTimerFinish }: UseCountdownProps): UseCountdownReturn => {
  let timerInterval: number | null = null
  const timer = ref<number>(0)

  const startCountdown = (sec: number): void => {
    if (sec <= 0) {
      onTimerFinish()
      return
    }

    timer.value = sec
    timerInterval && clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      timer.value--
      if (timer.value <= 0) {
        onTimerFinish()
        timerInterval && clearInterval(timerInterval)
      }
    }, 1000) as unknown as number
  }

  return {
    startCountdown,
    timer
  }
}
