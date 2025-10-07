import React from 'react'
import { Bot, FileText } from 'lucide-react'
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
  const containerClasses =
    'relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur'

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute -top-32 -right-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">Equipment Quote</h2>
              <p className="text-sm text-slate-300">Capture project details, requirements, and AI-enriched context.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenScopeExtractor}
            disabled={!canUseAI}
            className={`hidden rounded-xl border px-3 py-2 text-xs font-medium transition sm:flex ${
              canUseAI
                ? 'border-accent/50 bg-accent/10 text-accent hover:border-accent/80 hover:bg-accent/15'
                : 'border-white/10 bg-white/[0.04] text-slate-500 cursor-not-allowed'
            }`}
          >
            <Bot className="mr-2 h-3.5 w-3.5" />
            Scope AI
          </button>
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
    </div>
  );
};

export default EquipmentForm;
