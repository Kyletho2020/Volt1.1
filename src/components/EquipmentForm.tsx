import React from 'react'
import ProjectDetails from './ProjectDetails'
import EquipmentRequired, { EquipmentRequirements } from './EquipmentRequired'
import { HubSpotContact } from '../services/hubspotService'
import { EquipmentData } from '../types'
import { UseFormRegister, FieldErrors } from 'react-hook-form'

interface EquipmentFormProps {
  data: EquipmentData
  onFieldChange: (field: string, value: string) => void
  onRequirementsChange: (data: EquipmentRequirements) => void
  onSelectContact: (contact: HubSpotContact) => void
  onCopySiteAddress: () => boolean
  onOpenScopeExtractor: () => void
  canUseAI: boolean
  register: UseFormRegister<EquipmentData>
  errors: FieldErrors<EquipmentData>
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
    <div>
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
  )
}

export default EquipmentForm
