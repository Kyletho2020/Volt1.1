import { it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import EquipmentForm from '../EquipmentForm';
import { EquipmentRequirements } from '../EquipmentRequired';
import { HubSpotContact } from '../../services/hubspotService';

it('EquipmentForm renders Equipment Quote heading', () => {
  const data = {
    projectName: '',
    companyName: '',
    contactName: '',
    siteAddress: '',
    sitePhone: '',
    shopLocation: 'Shop',
    scopeOfWork: '',
    email: '',
    equipmentRequirements: {
      crewSize: '',
      forklifts: [],
      tractors: [],
      trailers: [],
      additionalEquipment: []
    } as EquipmentRequirements
  };

  const html = renderToString(
    <EquipmentForm
      data={data}
      onFieldChange={() => {}}
      onRequirementsChange={() => {}}
      onSelectContact={() => ({}) as HubSpotContact}
      register={() => ({ onChange: () => {}, onBlur: () => {}, ref: () => {} }) as any}
      errors={{}}
    />
  );

  expect(html).toContain('Equipment Quote');
});
