import 'dotenv/config'
import { platformSafetyPresets } from '../modules/prompt-templates/default-templates'
import { seedSystemPromptTemplates } from '../modules/prompt-templates/prompt-template.repository'

async function main() {
  const promptTemplates = await seedSystemPromptTemplates()

  console.log(JSON.stringify({
    seeded: {
      promptTemplates: promptTemplates.length,
      platformSafetyPresets: platformSafetyPresets.length,
    },
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
