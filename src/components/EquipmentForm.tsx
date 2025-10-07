import React from 'react'
import { FileText } from 'lucide-react'
import ProjectDetails from './ProjectDetails'
import EquipmentRequired, { EquipmentRequirements } from './EquipmentRequired'
import { HubSpotContact } from '../services/hubspotService'
import { EquipmentData } from '../types'
import { UseFormRegister, FieldErrors } from 'react-hook-form'

interface EquipmentFormProps {
  data: EquipmentData;
  onFieldChange: (field: string, value: string) => void;
  onRequirementsChange: (data: EquipmentRequirements) => void;
  onSelectContact: (contact: HubSpotContact) => void;
  onCopySiteAddress: () => boolean;
  onOpenScopeExtractor: () => void;
  canUseAI: boolean;
  register: UseFormRegister<EquipmentData>;
  errors: FieldErrors<EquipmentData>;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  data,
  onFieldChange,
  onRequirementsChange,
  onSelectContact,
  onCopySiteAddress,
  onOpenScopeExtractor,
  canUseAI,
  register,
  errors
}) => {
  return (
    <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
      <div className="flex items-center mb-6">
        <FileText className="w-6 h-6 text-white mr-2" />
        <h2 className="text-2xl font-bold text-white">Equipment Quote</h2>
      </div>
      <ProjectDetails
        data={data}
        onChange={onFieldChange}
        onSelectContact={onSelectContact}
        onCopySiteAddress={onCopySiteAddress}
        onOpenScopeExtractor={onOpenScopeExtractor}
        canUseAI={canUseAI}
        register={register}
        errors={errors}
      />
      <EquipmentRequired
        data={data.equipmentRequirements}
        onChange={onRequirementsChange}
      />
    </div>
  );
};

export default EquipmentForm;
