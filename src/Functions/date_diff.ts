import { differenceInYears } from 'date-fns'

// This function takes two dates and calculates the difference
class f {
  // Compile
  onCompile(fArgs: string[]) {
    return new Promise<string[]>((resolve) => {
      // Mark all arguments as required
      resolve(fArgs)
    })
  }

  // Execute
  execute(args: string[]) {
    return new Promise<number>((resolve) => {
      const date1 = new Date(args[0])
      const date2 = new Date(args[1])
      resolve(differenceInYears(date2, date1))
    })
  }
}

export default f
