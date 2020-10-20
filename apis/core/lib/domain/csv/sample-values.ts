export function sampleValues(header: string[], rows: any[][], maxUniqueValues = 3): any[][] {
  const uniquePerCol: any[][] = (new Array(header.length)).fill('').map(() => [])

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < header.length; j++) {
      const value = rows[i][j]
      if (uniquePerCol[j].length >= maxUniqueValues || uniquePerCol[j].includes(value)) {
        continue
      }
      uniquePerCol[j].push(value)
    }
  }

  return uniquePerCol
}
