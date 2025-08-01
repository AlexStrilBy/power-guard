import { execFile } from 'node:child_process'

export type PowerAction = 'sleep' | 'hibernate' | 'shutdown'

function run(cmd: string, args?: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, { windowsHide: true }, (err) => (err ? reject(err) : resolve()))
  })
}

export async function performAction(action: PowerAction): Promise<void> {
  switch (action) {
    case 'hibernate':
      console.log('Hibernating system...')
      await run('shutdown', ['/h'])
      break
    case 'sleep':
      console.log('Putting system to sleep...')
      await run('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,0,0'])
      break
    case 'shutdown':
      console.log('Shutting down system...')
      await run('shutdown', ['/s', '/t', '30'])
      break
  }
}
