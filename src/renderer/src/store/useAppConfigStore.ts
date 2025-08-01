import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AppConfig } from '../../../main/types'

export const useAppConfigStore = defineStore('appConfig', () => {
  const appConfig = ref<AppConfig>(window.appConfig)

  return {
    appConfig
  }
})
