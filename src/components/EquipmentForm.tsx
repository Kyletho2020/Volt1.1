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
    'relative overflow-hidden rounded-3xl border border-accent/25 bg-surface/80 p-6 shadow-[0_35px_120px_rgba(10,18,35,0.55)] backdrop-blur-xl'

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute -top-32 -right-10 h-48 w-48 rounded-full bg-accent/25 blur-[120px] opacity-80" />
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
                ? 'border-accent/40 bg-accent-soft/40 text-accent hover:border-accent hover:bg-accent/15 hover:text-white'
                : 'border-accent/15 bg-surface/40 text-slate-500/80 cursor-not-allowed'
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
