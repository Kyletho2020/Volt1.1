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

  it('changeDimensionUnit converts dimensions between inches and feet', () => {
    const { result } = renderHook(() => useLogisticsForm())

    act(() => {
      result.current.handlePieceChange(0, 'length', '24')
      result.current.handlePieceChange(0, 'width', '12')
      result.current.handlePieceChange(0, 'height', '60')
    })

    act(() => {
      result.current.changeDimensionUnit('ft')
    })

    expect(result.current.logisticsData.dimensionUnit).toBe('ft')
    expect(result.current.logisticsData.pieces[0].length).toBe('2')
    expect(result.current.logisticsData.pieces[0].width).toBe('1')
    expect(result.current.logisticsData.pieces[0].height).toBe('5')

    act(() => {
      result.current.changeDimensionUnit('in')
    })

    expect(result.current.logisticsData.dimensionUnit).toBe('in')
    expect(result.current.logisticsData.pieces[0].length).toBe('24')
  })
})
