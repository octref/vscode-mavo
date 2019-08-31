import * as fs from 'fs'
import * as path from 'path'

import { HTMLDataV1, IAttributeData } from 'vscode-html-languageservice'

import * as got from 'got'

interface MavoAttr {
  name: string
  purpose: string

  link?: string
  path?: string

  on?: string
  live?: string
}

async function getMavoData(): Promise<HTMLDataV1> {
  const globalAttributes: IAttributeData[] = []

  const res = await got('https://raw.githubusercontent.com/mavoweb/mavo.io/master/docs/index.json')
  if (res.statusCode !== 200) {
    return
  }

  const mavoJson = JSON.parse(res.body)

  const attrs: MavoAttr[] = [...mavoJson.coreAttribute, ...mavoJson.attribute]

  attrs.forEach(attr => {
    const newAttr: IAttributeData = {
      name: attr.name,
      description: {
        kind: 'markdown',
        value: generateDescription(attr)
      }
    }
    if (attr.link && attr.path) {
      newAttr.references = [
        {
          name: `Mavo ${attr.link}`,
          url: `https://mavo.io${attr.path}`
        }
      ]
    }
    globalAttributes.push(newAttr)
  })

  return {
    version: 1,
    globalAttributes
  }
}

function generateDescription(mavoAttr: MavoAttr) {
  let s = `${mavoAttr.purpose}`

  s = s.replace(/\]\(\//g, '](https://mavo.io/')

  if (mavoAttr.on) {
    s += `\n\nOn: ${mavoAttr.on}`
  }
  if (mavoAttr.live) {
    s += `\n\nLive: ${mavoAttr.live}`
  }
  return s
}

async function main() {
  const jsonData = await getMavoData()
  ;(<any>jsonData).version = 1.1

  fs.writeFileSync(path.resolve(__dirname, '../data/mavo.json'), JSON.stringify(jsonData, null, 2), 'utf-8')
  console.log('written data/mavo.json')
}

main()
