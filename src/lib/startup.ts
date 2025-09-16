import { globalCronScheduler } from './cron-scheduler'

// Function to initialize services when the app starts
export function initializeServices() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    console.log('Initializing cron scheduler...')

    // Start the cron scheduler
    globalCronScheduler.start()

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down cron scheduler...')
      globalCronScheduler.stop()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('Shutting down cron scheduler...')
      globalCronScheduler.stop()
      process.exit(0)
    })
  } else {
    console.log('Cron scheduler disabled in development mode. Set ENABLE_CRON=true to enable.')
  }
}

// Auto-initialize if this module is loaded
initializeServices()