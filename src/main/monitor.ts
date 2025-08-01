import EventEmitter from 'node:events'
import ping from 'ping'

export type MonitorConfig = {
  targetIp: string
  // how often to run a sampling tick
  intervalMs: number
  // continuous bad duration to trigger outage
  failureSeconds: number
  // continuous healthy duration to declare recovery (default: failureSeconds/2)
  recoverySeconds?: number
  // how many quick pings per tick (default: 4)
  probesPerTick?: number
}

export class OutageMonitor extends EventEmitter {
  private timer: NodeJS.Timeout | null = null
  private badSince: number | null = null // ms since epoch
  private healthySinceAfterOutage: number | null = null
  private inOutage = false
  private cfg: Required<MonitorConfig>

  constructor(config: MonitorConfig) {
    super()
    const cfg = { ...config }

    cfg.recoverySeconds = cfg.recoverySeconds || Math.max(1, Math.floor(cfg.failureSeconds / 2))
    cfg.probesPerTick = cfg.probesPerTick || 4

    this.cfg = cfg as Required<MonitorConfig>
  }

  start(): void {
    if (this.timer) return
    const tick = async (): Promise<void> => {
      const healthy = await this.sampleTickIsHealthy()
      const now = Date.now()

      if (healthy) {
        // reset bad window
        this.badSince = null

        if (this.inOutage) {
          // count continuous healthy period to exit outage
          if (this.healthySinceAfterOutage == null) this.healthySinceAfterOutage = now
          const healthyDuration = (now - this.healthySinceAfterOutage) / 1000
          if (healthyDuration >= this.cfg.recoverySeconds) {
            this.inOutage = false
            this.healthySinceAfterOutage = null
            this.emit('recovered')
          }
        } else {
          this.healthySinceAfterOutage = null
        }
      } else {
        // extend/initialize bad window
        if (this.badSince == null) this.badSince = now
        const badDuration = (now - this.badSince) / 1000

        // while in outage, reset the healthy-period accumulator
        this.healthySinceAfterOutage = null

        if (!this.inOutage && badDuration >= this.cfg.failureSeconds) {
          this.inOutage = true
        }

        if (this.inOutage) {
          this.emit('outage')
        }
      }
    }

    tick().finally(() => {
      this.timer = setInterval(tick, this.cfg.intervalMs)
    })
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.badSince = null
    this.healthySinceAfterOutage = null
    this.inOutage = false
  }

  update(cfg: Partial<MonitorConfig>): void {
    this.cfg = { ...this.cfg, ...cfg }
  }

  private async sampleTickIsHealthy(): Promise<boolean> {
    const probes = this.cfg.probesPerTick
    let successes = 0

    for (let i = 0; i < probes; i++) {
      try {
        const res = await ping.promise.probe(this.cfg.targetIp)
        if (res.alive) successes++

        await new Promise((resolve) => setTimeout(resolve, 100)) // small delay between probes
      } catch {
        return false
      }
    }

    return successes >= probes
  }
}
