import { useState } from 'react';
import { HubSpotContact } from '../services/hubspotService';
import { formatAddressFromParts } from '../lib/address';
import { EquipmentRequirements } from '../components/EquipmentRequired';

export const useEquipmentForm = () => {
  const initialEquipmentRequirements: EquipmentRequirements = {
    crewSize: '',
    forklifts: [],
    tractors: [],
    trailers: [],
    additionalEquipment: []
  };

  const initialEquipmentData = {
    jobNumber: '',
    startTime: '',
    projectName: '',
    companyName: '',
    jobNumber: '',
    contactName: '',
    siteAddress: '',
    sitePhone: '',
    shopLocation: 'Shop',
    scopeOfWork: '',
    email: '',
    equipmentRequirements: initialEquipmentRequirements
  };

  const [equipmentData, setEquipmentData] = useState(initialEquipmentData);

  const handleEquipmentChange = (field: string, value: string) => {
    setEquipmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentRequirementsChange = (data: EquipmentRequirements) => {
    setEquipmentData(prev => ({ ...prev, equipmentRequirements: data }));
  };

  const handleSelectHubSpotContact = (contact: HubSpotContact) => {
    const contactPrimaryStreet = contact.contactAddress1 || '';
    const contactSecondaryStreet = contact.contactAddress || '';
    const companyPrimaryStreet = contact.companyAddress1 || '';
    const companySecondaryStreet = contact.companyAddress || '';

    const preferredContactAddress =
      formatAddressFromParts({
        street: contactPrimaryStreet,
        city: contact.contactCity,
        state: contact.contactState,
        zip: contact.contactZip
      }) ||
      formatAddressFromParts({
        street: contactSecondaryStreet,
        city: contact.contactCity,
        state: contact.contactState,
        zip: contact.contactZip
      }) ||
      contactPrimaryStreet.trim() ||
      contactSecondaryStreet.trim();

    const preferredCompanyAddress =
      formatAddressFromParts({
        street: companyPrimaryStreet,
        city: contact.companyCity,
        state: contact.companyState,
        zip: contact.companyZip
      }) ||
      formatAddressFromParts({
        street: companySecondaryStreet,
        city: contact.companyCity,
        state: contact.companyState,
        zip: contact.companyZip
      }) ||
      companyPrimaryStreet.trim() ||
      companySecondaryStreet.trim();

    setEquipmentData(prev => ({
      ...prev,
      contactName: `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email,
      sitePhone: contact.phone || prev.sitePhone,
      companyName: contact.companyName || prev.companyName,
      siteAddress: preferredContactAddress || preferredCompanyAddress || prev.siteAddress
    }));
  };

  return {
    equipmentData,
    setEquipmentData,
    initialEquipmentData,
    handleEquipmentChange,
    handleEquipmentRequirementsChange,
    handleSelectHubSpotContact
  };
};

export default useEquipmentForm;
