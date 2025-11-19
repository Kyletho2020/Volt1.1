import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useLogisticsForm from '../src/hooks/useLogisticsForm'

describe('useLogisticsForm', () => {
  it('movePiece reorders pieces while preserving selection', () => {
    const { result } = renderHook(() => useLogisticsForm())

    act(() => {
      result.current.addPiece()
      result.current.addPiece()
    })

    const initialOrder = result.current.logisticsData.pieces.map(piece => piece.id)

    act(() => {
      result.current.togglePieceSelection(initialOrder[0])
    })

    act(() => {
      result.current.movePiece(0, 2)
    })

    expect(result.current.logisticsData.pieces[2].id).toBe(initialOrder[0])
    expect(result.current.selectedPieces).toContain(initialOrder[0])
  })
})
