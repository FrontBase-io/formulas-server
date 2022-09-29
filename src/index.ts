import { parseFormulaString } from './formula'
import { ObjectType } from './Types/Object'

class Formula {
  formula
  label
  onReady
  dependencies: { key: string }[]

  // Initialise the formula
  // By initialising we create a class that makes it easy to compile the formula into data.
  constructor(_formula: string, _label: string) {
    this.formula = _formula
    this.label = _label

    // Parse the formula structure
    this.onReady = new Promise<void>((resolve) => {
      console.log(`🧪 Compiling formula ${this.label}`)

      const { dependencies } = parseFormulaString(this.formula)
      this.dependencies = dependencies
      resolve()
    })
  }

  // Parse the formula

  // Compile with a pre-given object
  compileWithObject(object: ObjectType) {
    return new Promise<string>((resolve, reject) => {
      // Loop through dependencies
      // Start with the original formula
      let result = this.formula

      // Simultaneously try to resolve all variables in the formula
      Promise.all(
        this.dependencies.map(
          (dependency) =>
            new Promise<void>((resolve) => {
              result = result.replace(
                `{{ ${dependency.key} }}`,
                object[dependency.key]
              )
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
}

export default Formula
