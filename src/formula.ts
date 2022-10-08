import asyncMap from './helpers/asyncMap'
import Formula from './index'

import functions from './Functions'

const uniqid = require('uniqid')

// Parse a formula and get dependencies
const parseFormulaString = async (formula: Formula, startingModel: string) => {
  const dependencies: {
    model: string
    field: string
    local: boolean
    parents?: { model: string; field: string }[]
  }[] = []
  const globals: string[] = []

  let isInstant = true

  let parsable = formula.formula

  let elements = {}

  await asyncMap(
    [...formula.formula.matchAll(new RegExp(/{{\s*(?<var>.*?)\s*}}/gm))],
    async (item) => {
      const elementId = uniqid()
      parsable = parsable.replace(item[0], `___${elementId}`)
      elements[elementId] = item[1]
      if (item[1].match(/\w*\(.+\)/)) {
        const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(item[1])
        const fName = func.groups.fName
        const fArgs = func.groups.fArgs.split(', ')
        const F = functions[fName]
        const f = new F()

        // Send the function the onCompile() signal so we can figure out what the function's dependencies are.
        await asyncMap(await f.onCompile(fArgs), async (arg) => {
          if (['__TODAY'].includes(arg)) {
            globals.push(arg)
          } else {
            // Parse dependencies and store the result in variables
            const {
              isInstant: _isInstant,
              dependencies: _dependencies,
              globals: _globals,
            } = await processDependency(arg, formula, startingModel)
            if (isInstant && !_isInstant) isInstant = false
            _dependencies.forEach((d) => dependencies.push(d))
            _globals.forEach((d) => globals.push(d))
          }
        })
      } else {
        // Parse dependencies and store the result in variables
        const {
          isInstant: _isInstant,
          dependencies: _dependencies,
          globals: _globals,
        } = await processDependency(item[1], formula, startingModel)
        if (isInstant && !_isInstant) isInstant = false
        _dependencies.forEach((d) => dependencies.push(d))
        _globals.forEach((d) => globals.push(d))
      }
    }
  )

  return { dependencies, globals, parsable, elements, isInstant }
}

const processDependency = async (
  item: string,
  formula: Formula,
  startingModel: string
) => {
  let isInstant = true
  let currentModel = startingModel
  const dependencies: {
    model: string
    field: string
    local: boolean
    parents?: { model: string; field: string }[]
  }[] = []
  const globals: string[] = []

  if (item.match('\\.')) {
    const parents = []
    isInstant = false
    // Remote dependency
    await asyncMap(item.split('.'), (item, itemIndex) => {
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
    dependencies.push({
      model: currentModel,
      field: item,
      local: true,
    })
  }
  return { isInstant, dependencies, globals }
}

export { parseFormulaString }
