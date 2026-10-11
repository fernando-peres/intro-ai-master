import { useLanguage } from "./language"
import { translator } from "./translate"

export function useTranslation() {
  const { language } = useLanguage()
  return { t: translator(language) }
}
