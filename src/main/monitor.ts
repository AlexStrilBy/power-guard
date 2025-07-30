import EventEmitter from 'node:events';
import ping from 'ping';

export type MonitorConfig = {
    targetIp: string;        // device that turns OFF when the grid drops (placed BEFORE UPS)
    failureSeconds: number;  // consecutive seconds of failure before triggering
    intervalMs: number;      // ping interval, e.g., 1000
};

export class OutageMonitor extends EventEmitter {
    private timer: NodeJS.Timeout | null = null;
    private fail = 0;
    constructor(private cfg: MonitorConfig) { super(); }

    start() {
        if (this.timer) return;
        this.timer = setInterval(async () => {
            try {
                // timeout is seconds per ping lib
                const res = await ping.promise.probe(this.cfg.targetIp, { timeout: 1 });
                if (res.alive) this.fail = 0;
                else this.bump();
            } catch {
                this.bump();
            }
        }, this.cfg.intervalMs);
    }

    private bump() {
        this.fail++;
        if (this.fail >= this.cfg.failureSeconds) {
            this.emit('outage');
            this.fail = 0; // prevent spamming; you can change policy
        }
    }

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.fail = 0;
    }

    update(cfg: Partial<MonitorConfig>) {
        this.cfg = { ...this.cfg, ...cfg };
    }
}
