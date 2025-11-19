import test from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import LogisticsForm, { formatDescriptionInputValue } from '../LogisticsForm';

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
      duplicatePiece={() => {}}
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

test('formatDescriptionInputValue preserves trailing spaces for active input', () => {
  const valueWithTrailingSpace = formatDescriptionInputValue('steel ', { approximateLabelEnabled: false });
  assert.strictEqual(valueWithTrailingSpace, 'Steel ');

  const trimmedValue = formatDescriptionInputValue('steel beam', { approximateLabelEnabled: false });
  assert.strictEqual(trimmedValue, 'Steel Beam');
});
