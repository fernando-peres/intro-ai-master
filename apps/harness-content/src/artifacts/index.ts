import { docPlugin } from "@/artifacts/plugins/doc"
import { slidePlugin } from "@/artifacts/plugins/slide"
import { createStubPlugin } from "@/artifacts/plugins/stub"
import { registerPlugin } from "@/artifacts/registry"

// Types without their own editor yet use the JSON stub.
registerPlugin(createStubPlugin("animation"))
registerPlugin(docPlugin)
registerPlugin(slidePlugin)

export { getPlugin, listPlugins, validateContent } from "@/artifacts/registry"
