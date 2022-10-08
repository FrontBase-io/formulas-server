import { parseFormulaString } from './formula'
import { ModelType } from './Types/Models'
import { NewObjectType, ObjectType } from './Types/Object'
import asyncMap from './helpers/asyncMap'
import { ObjectId } from 'mongodb'
import functions from './Functions'

class Formula {
  // The original formula in form of {{ first_name }}
  formula
  // The parsed formula in an easier to parse version with keys
  parsable
  // The label
  label
  // A promise that fires once the formula is ready
  onReady
  // A list of elements in the formula
  elements: { [key: string]: string }
  // A list of dependencies that will cause this formula to recalculate
  dependencies: {
    model: string
    field: string
    local: boolean
    parents?: { model: string; field: string }[]
  }[]
  // Global triggers
  globals: string[]
  // A convenience map of all models
  modelMap: { [key: string]: ModelType } = {}
  isInstant
  // db
  db

  // Initialise the formula
  // By initialising we create a class that makes it easy to compile the formula into data.
  constructor(
    _formula: string,
    _label: string,
    startingModel: string,
    _modelMap,
    _db
  ) {
    this.formula = _formula
    this.label = _label
    this.modelMap = _modelMap
    this.db = _db

    // Parse the formula structure
    this.onReady = new Promise<void>(async (resolve) => {
      const { dependencies, parsable, elements, isInstant, globals } =
        await parseFormulaString(this, startingModel)

      console.log(`🧪 Compiled formula ${this.label}`)

      this.dependencies = dependencies
      this.parsable = parsable
      this.globals = globals
      this.elements = elements
      this.isInstant = isInstant
      resolve()
    })
  }

  // Parse the formula

  // Compile with a pre-given object
  compileWithObject(object: ObjectType) {
    return new Promise<string>((resolve, reject) => {
      // Loop through dependencies
      // Start with the original formula
      let result = this.parsable

      // Simultaneously try to resolve all variables in the formula
      Promise.all(
        Object.keys(this.elements).map(
          (elementId) =>
            new Promise<void>(async (resolve) => {
              const element = this.elements[elementId]

              // Process the element
              if (element.match(/\w*\(.+\)/)) {
                // This element contains a function
                const func = new RegExp(/(?<fName>\w*)\((?<fArgs>.*)\)/gm).exec(
                  element
                )
                const fName = func.groups.fName
                const fArgs = func.groups.fArgs.split(', ')
                const F = functions[fName]
                const f = new F()

                // Calculate and replace the formula element
                result = result.replace(
                  `___${elementId}`,
                  await f.execute(this.getVariables(fArgs, object))
                )
              } else if (element.match('\\.')) {
                // This element contains relationships
                let nextObject = object
                await asyncMap(element.split('.'), async (part) => {
                  if (part.match('__r')) {
                    // Regular part
                    // Find the next object
                    nextObject = await this.db.collection('Objects').findOne({
                      _id: new ObjectId(nextObject[part.replace('__r', '')]),
                    })
                  } else {
                    // Final part
                    // The result is the final part of the next object
                    result = result.replace(`___${elementId}`, nextObject[part])
                  }
                })
              } else {
                // Normal element
                result = result.replace(`___${elementId}`, object[element])
              }

              resolve()
            })
        )
      )
        // Once we've processed all depdencies, return the result.
        .then(() => resolve(result))
    })
  }

  // Compile with a modelkey and an object ID and get the data as we go.
  compileWithObjectId(modelId: string, objectId: string) {
    return new Promise<string>((resolve, reject) => {
      const result = `Todo: compileWithObjectId + ${Math.floor(
        Math.random() * 100
      )}`
      resolve(result)
    })
  }

  // Compile with a static object of array
  compileWithData(data: { [key: string]: any }) {
    return new Promise<string>((resolve, reject) => {
      const result = `Todo: compileWithData + ${Math.floor(
        Math.random() * 100
      )}`
      resolve(result)
    })
  }

  getVariables(args: string[], object) {
    return args.map((a) => {
      if (['__TODAY'].includes(a)) {
        return new Date()
      } else {
        return object[a]
      }
    })
  }
}

export default Formula
