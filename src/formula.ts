import asyncMap from './helpers/asyncMap'
import Formula from './index'

const uniqid = require('uniqid')

// Parse a formula and get dependencies
const parseFormulaString = async (formula: Formula, startingModel: string) => {
  const dependencies: {
    model: string
    field: string
    local: boolean
    parents?: { model: string; field: string }[]
  }[] = []

  let currentModel = startingModel

  let parsable = formula.formula

  let elements = {}

  let isInstant = true

  await asyncMap(
    [...formula.formula.matchAll(new RegExp(/{{\s*(?<var>.*?)\s*}}/gm))],
    (item) => {
      const elementId = uniqid()
      parsable = parsable.replace(item[0], `___${elementId}`)
      elements[elementId] = item[1]
      if (item[1].match('\\.')) {
        const parents = []
        isInstant = false
        // Remote dependency
        asyncMap(item[1].split('.'), (item, itemIndex) => {
          if (item.match('__r')) {
            // Base part
            const fieldKey = item.replace('__r', '')
            item.replace('__r', '')
            dependencies.push({
              model: currentModel,
              field: fieldKey,
              local: itemIndex === 0,
              parents: [...parents],
            })

            parents.push({ model: currentModel, field: fieldKey })
            currentModel =
              formula.modelMap[currentModel].fields[fieldKey].settings?.to
          } else {
            // Final part
            dependencies.push({
              model: currentModel,
              field: item,
              local: false,
              parents: [...parents],
            })
          }
        })
      } else {
        // Simple dependency
        dependencies.push({ model: currentModel, field: item[1], local: true })
      }
    }
  )

  return { dependencies, parsable, elements, isInstant }
}

export { parseFormulaString }
