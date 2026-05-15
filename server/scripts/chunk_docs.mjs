import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT_PATH = resolve(__dirname, '../data/demo-docs.pages.json')
const OUTPUT_PATH = resolve(__dirname, '../data/demo-docs.chunks.json')

function chunkText(text, maxLength = 300, overlap = 50) {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    let end = start + maxLength
    
    // Try to find a good breaking point (period or space) if we are not at the end
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('. ', end)
      if (lastPeriod > start + maxLength / 2) {
        end = lastPeriod + 1
      } else {
        const lastSpace = text.lastIndexOf(' ', end)
        if (lastSpace > start + maxLength / 2) {
          end = lastSpace
        }
      }
    }
    
    chunks.push(text.slice(start, end).trim())
    start = end - overlap
    
    // Safety break if we aren't moving forward
    if (start >= text.length || end >= text.length) break
    if (start < 0) start = 0
    if (start === end) start += 1 
  }
  
  return chunks
}

async function main() {
  const pages = JSON.parse(await readFile(INPUT_PATH, 'utf8'))
  const allChunks = []

  for (const page of pages) {
    const chunks = chunkText(page.content)
    chunks.forEach((content, index) => {
      allChunks.push({
        id: `${page.url}#${index}`,
        url: page.url,
        title: page.title,
        content: content
      })
    })
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(allChunks, null, 2))
  console.log(`Saved ${allChunks.length} chunks to ${OUTPUT_PATH}`)
}

main().catch(console.error)
