import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LogisticsData } from '../types';
import { createLogisticsPiece, normalizePieces } from '../lib/logisticsPieces';
import {
  convertPiecesDimensions,
  normalizeDimensionUnit,
  type DimensionUnit
} from '../lib/dimensions';

export const useLogisticsForm = () => {
  const initialLogisticsData = useMemo<LogisticsData>(
    () => ({
      pieces: [createLogisticsPiece()],
      dimensionUnit: 'in',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupZip: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryZip: '',
      shipmentType: '',
      truckType: '',
      includeStorage: false,
      storageLocation: '',
      storageSqFt: ''
    }),
    []
  );

  const [logisticsDataState, setLogisticsDataState] = useState(initialLogisticsData);
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);

  const setLogisticsData = useCallback(
    (updater: LogisticsData | ((prev: LogisticsData) => LogisticsData)) => {
      setLogisticsDataState(prevState => {
        const nextState =
          typeof updater === 'function'
            ? (updater as (prev: LogisticsData) => LogisticsData)(prevState)
            : updater;

        return {
          ...nextState,
          dimensionUnit: normalizeDimensionUnit(nextState.dimensionUnit),
          pieces: normalizePieces(nextState.pieces)
        };
      });
    },
    []
  );

  const logisticsData = logisticsDataState;

  useEffect(() => {
    setSelectedPieces(prev =>
      prev.filter(id => logisticsData.pieces?.some(piece => piece.id === id))
    );
  }, [logisticsData.pieces]);

  const handleLogisticsChange = <K extends keyof LogisticsData>(
    field: K,
    value: LogisticsData[K]
  ) => {
    setLogisticsData(prev => ({ ...prev, [field]: value }));
  };

  const handlePieceChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setLogisticsData(prev => ({
      ...prev,
      pieces: prev.pieces?.map((piece, i) =>
        i === index ? { ...piece, [field]: value } : piece
      )
    }));
  };

  const addPiece = () => {
    setLogisticsData(prev => ({
      ...prev,
      pieces: [...(prev.pieces ?? []), createLogisticsPiece()]
    }));
  };

  const duplicatePiece = (pieceId: string) => {
    setLogisticsData(prev => {
      const pieces = prev.pieces ? [...prev.pieces] : [];
      const index = pieces.findIndex(piece => piece.id === pieceId);

      if (index === -1) {
        return prev;
      }

      const { id: _ignored, ...pieceData } = pieces[index];
      const duplicatedPiece = createLogisticsPiece(pieceData);
      pieces.splice(index + 1, 0, duplicatedPiece);

      return {
        ...prev,
        pieces
      };
    });
  };

  const removePiece = (pieceId: string) => {
    setLogisticsData(prev => {
      if (!prev.pieces || prev.pieces.length <= 1) {
        return prev;
      }

      const remainingPieces = prev.pieces.filter(piece => piece.id !== pieceId);

      return {
        ...prev,
        pieces: remainingPieces.length > 0
          ? remainingPieces
          : [createLogisticsPiece()]
      };
    });
    setSelectedPieces(prev => prev.filter(id => id !== pieceId));
  };

  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieces(prev =>
      prev.includes(pieceId)
        ? prev.filter(id => id !== pieceId)
        : [...prev, pieceId]
    );
  };

  const deleteSelectedPieces = () => {
    if (selectedPieces.length === 0) return;
    setLogisticsData(prev => {
      const remainingPieces = prev.pieces?.filter(
        piece => !selectedPieces.includes(piece.id)
      );

      return {
        ...prev,
        pieces: remainingPieces && remainingPieces.length > 0
          ? remainingPieces
          : [createLogisticsPiece()]
      };
    });
    setSelectedPieces([]);
  };

  const movePiece = (oldIndex: number, newIndex: number) => {
    setLogisticsData(prev => {
      const pieces = prev.pieces ? [...prev.pieces] : [];

      if (
        oldIndex === newIndex ||
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= pieces.length ||
        newIndex >= pieces.length
      ) {
        return prev;
      }

      const [movedPiece] = pieces.splice(oldIndex, 1);
      pieces.splice(newIndex, 0, movedPiece);

      return {
        ...prev,
        pieces
      };
    });
  };

  const changeDimensionUnit = (unit: DimensionUnit) => {
    setLogisticsData(prev => {
      const currentUnit = normalizeDimensionUnit(prev.dimensionUnit);
      if (currentUnit === unit) {
        return prev;
      }

      return {
        ...prev,
        dimensionUnit: unit,
        pieces: convertPiecesDimensions(prev.pieces, currentUnit, unit)
      };
    });
  };

  return {
    logisticsData,
    setLogisticsData,
    selectedPieces,
    setSelectedPieces,
    initialLogisticsData,
    handleLogisticsChange,
    handlePieceChange,
    addPiece,
    duplicatePiece,
    removePiece,
    togglePieceSelection,
    deleteSelectedPieces,
    movePiece,
    changeDimensionUnit
  };
};

export default useLogisticsForm;
