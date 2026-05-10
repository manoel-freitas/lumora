export function renderPromptTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => {
    const value = variables[key]
    if (Array.isArray(value)) return value.join(', ')
    if (value === undefined || value === null) return ''
    return String(value)
  })
}
