import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LogisticsData } from '../types';
import { createLogisticsPiece, normalizePieces } from '../lib/logisticsPieces';

export const useLogisticsForm = () => {
  const initialLogisticsData = useMemo<LogisticsData>(
    () => ({
      pieces: [createLogisticsPiece()],
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
      storageType: '',
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

  const handleLogisticsChange = (field: string, value: string) => {
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

  return {
    logisticsData,
    setLogisticsData,
    selectedPieces,
    setSelectedPieces,
    initialLogisticsData,
    handleLogisticsChange,
    handlePieceChange,
    addPiece,
    removePiece,
    togglePieceSelection,
    deleteSelectedPieces,
    movePiece
  };
};

export default useLogisticsForm;
