import test from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import LogisticsForm from '../LogisticsForm';

test('LogisticsForm renders Logistics Quote heading', () => {
  const data = {
    pieces: [
      {
        id: 'piece-1',
        description: '',
        quantity: 1,
        length: '',
        width: '',
        height: '',
        weight: ''
      }
    ],
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
  };

  const html = renderToString(
    <LogisticsForm
      data={data}
      selectedPieces={[]}
      onFieldChange={() => {}}
      onPieceChange={() => {}}
      addPiece={() => {}}
      removePiece={() => {}}
      togglePieceSelection={() => {}}
      deleteSelectedPieces={() => {}}
      movePiece={() => {}}
      register={() => ({ onChange: () => {}, onBlur: () => {}, ref: () => {} }) as any}
      errors={{}}
    />
  );

  assert.ok(html.includes('Logistics Quote'));
});
