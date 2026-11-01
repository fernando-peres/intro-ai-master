import { animationPlugin } from "@/artifacts/plugins/animation"
import { diagramPlugin } from "@/artifacts/plugins/diagram"
import { docPlugin } from "@/artifacts/plugins/doc"
import { slidePlugin } from "@/artifacts/plugins/slide"
import { registerPlugin } from "@/artifacts/registry"

registerPlugin(animationPlugin)
registerPlugin(diagramPlugin)
registerPlugin(docPlugin)
registerPlugin(slidePlugin)

export { getPlugin, listPlugins, validateContent } from "@/artifacts/registry"
