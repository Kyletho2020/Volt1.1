import type { LogisticsPiece } from '../types'

let pieceIdCounter = 0

export const generatePieceId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  pieceIdCounter += 1
  return `piece-${Date.now()}-${pieceIdCounter}`
}

export const createLogisticsPiece = (
  piece?: Partial<LogisticsPiece>
): LogisticsPiece => ({
  id: piece?.id ?? generatePieceId(),
  description: piece?.description ?? '',
  quantity: piece?.quantity ?? 1,
  length: piece?.length ?? '',
  width: piece?.width ?? '',
  height: piece?.height ?? '',
  weight: piece?.weight ?? ''
})

export const normalizePieces = (
  pieces?: Partial<LogisticsPiece>[]
): LogisticsPiece[] => {
  if (!pieces || pieces.length === 0) {
    return [createLogisticsPiece()]
  }

  return pieces.map(piece => createLogisticsPiece(piece))
}
