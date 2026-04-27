#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

const targets = [
  'assets/character/baby_boy/spirit_baby_boy.glb',
  'assets/character/baby_girl/spirit_baby_girl.glb',
]

const GLB_MAGIC = 'glTF'
const GLB_VERSION = 2
const JSON_CHUNK_TYPE = 'JSON'
const BIN_CHUNK_TYPE = 'BIN\0'

function mimeToExtension(mimeType) {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    default:
      throw new Error(`Unsupported embedded image MIME type: ${mimeType}`)
  }
}

function padBuffer(buffer, byte, multiple = 4) {
  const remainder = buffer.length % multiple
  if (remainder === 0) return buffer

  return Buffer.concat([buffer, Buffer.alloc(multiple - remainder, byte)])
}

function parseGlb(filePath) {
  const buffer = fs.readFileSync(filePath)

  if (buffer.toString('utf8', 0, 4) !== GLB_MAGIC) {
    throw new Error(`${filePath} is not a GLB file`)
  }

  const version = buffer.readUInt32LE(4)
  if (version !== GLB_VERSION) {
    throw new Error(`${filePath} uses unsupported GLB version ${version}`)
  }

  const chunks = []
  let offset = 12

  while (offset < buffer.length) {
    const byteLength = buffer.readUInt32LE(offset)
    const type = buffer.toString('utf8', offset + 4, offset + 8)
    const start = offset + 8

    chunks.push({
      type,
      byteLength,
      data: buffer.subarray(start, start + byteLength),
    })

    offset = start + byteLength
  }

  const jsonChunk = chunks.find((chunk) => chunk.type === JSON_CHUNK_TYPE)
  const binChunk = chunks.find((chunk) => chunk.type === BIN_CHUNK_TYPE)

  if (!jsonChunk || !binChunk) {
    throw new Error(`${filePath} must contain JSON and BIN chunks`)
  }

  return {
    json: JSON.parse(jsonChunk.data.toString('utf8')),
    bin: binChunk.data,
  }
}

function buildGlb(json, bin) {
  const jsonBuffer = padBuffer(Buffer.from(JSON.stringify(json), 'utf8'), 0x20)
  const binBuffer = padBuffer(Buffer.from(bin), 0x00)
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length
  const output = Buffer.alloc(totalLength)

  output.write(GLB_MAGIC, 0, 4, 'utf8')
  output.writeUInt32LE(GLB_VERSION, 4)
  output.writeUInt32LE(totalLength, 8)

  let offset = 12
  output.writeUInt32LE(jsonBuffer.length, offset)
  output.write(JSON_CHUNK_TYPE, offset + 4, 4, 'utf8')
  jsonBuffer.copy(output, offset + 8)

  offset += 8 + jsonBuffer.length
  output.writeUInt32LE(binBuffer.length, offset)
  output.write(BIN_CHUNK_TYPE, offset + 4, 4, 'utf8')
  binBuffer.copy(output, offset + 8)

  return output
}

function externalizeTextures(relativeGlbPath) {
  const glbPath = path.join(projectRoot, relativeGlbPath)
  const assetDir = path.dirname(glbPath)
  const baseName = path.basename(glbPath, '.glb')
  const { json, bin } = parseGlb(glbPath)

  let changed = false

  for (const [index, image] of (json.images ?? []).entries()) {
    if (image.uri) {
      console.log(`${relativeGlbPath}: image ${index} already external (${image.uri})`)
      continue
    }

    if (image.bufferView === undefined) {
      throw new Error(`${relativeGlbPath}: image ${index} has no uri or bufferView`)
    }

    const bufferView = json.bufferViews?.[image.bufferView]
    if (!bufferView) {
      throw new Error(`${relativeGlbPath}: image ${index} references missing bufferView ${image.bufferView}`)
    }

    if (bufferView.buffer !== 0 && bufferView.buffer !== undefined) {
      throw new Error(`${relativeGlbPath}: image ${index} is not stored in GLB buffer 0`)
    }

    const extension = mimeToExtension(image.mimeType)
    const fileName = `${baseName}_texture_${index}.${extension}`
    const outputPath = path.join(assetDir, fileName)
    const byteOffset = bufferView.byteOffset ?? 0
    const byteLength = bufferView.byteLength

    fs.writeFileSync(outputPath, bin.subarray(byteOffset, byteOffset + byteLength))

    image.uri = fileName
    delete image.bufferView
    delete image.mimeType

    changed = true
    console.log(`${relativeGlbPath}: extracted image ${index} -> ${path.relative(projectRoot, outputPath)}`)
  }

  for (const material of json.materials ?? []) {
    const pbr = material.pbrMetallicRoughness ?? {}

    delete pbr.baseColorTexture
    delete pbr.metallicRoughnessTexture
    delete material.normalTexture
    delete material.occlusionTexture
    delete material.emissiveTexture

    pbr.baseColorFactor = pbr.baseColorFactor ?? [0.92, 0.78, 0.64, 1]
    pbr.metallicFactor = 0
    pbr.roughnessFactor = pbr.roughnessFactor ?? 0.65
    material.pbrMetallicRoughness = pbr
    changed = true
  }

  if ((json.images ?? []).length > 0 || (json.textures ?? []).length > 0) {
    json.images = []
    json.textures = []
    changed = true
  }

  if (!changed) return

  fs.writeFileSync(glbPath, buildGlb(json, bin))
  console.log(`${relativeGlbPath}: updated GLB material to avoid runtime texture loading`)
}

for (const target of targets) {
  externalizeTextures(target)
}
