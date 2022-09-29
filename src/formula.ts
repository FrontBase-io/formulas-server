// Parse a formula and get dependencies
const parseFormulaString = (inputFormula: string) => {
  const dependencies: { key: string }[] = []

  ;[...inputFormula.matchAll(new RegExp(/{{\s*(?<var>.*?)\s*}}/gm))].forEach(
    (match) => {
      dependencies.push({ key: match[1] })
    }
  )
  return { dependencies }
}

export { parseFormulaString }
