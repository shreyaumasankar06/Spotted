import React from 'react';
import {
  Shield,
  AlertTriangle,
  Zap,
  Radio,
  X,
  History,
  Info,
} from 'lucide-react';
import { InterventionType } from '../services/api';
import { getUserFullName } from '../utils/names';

export interface InterventionAuditEntry {
  nodeId: number;
  type: InterventionType;
  step: number;
  status: 'proposed' | 'pending' | 'applied';
}

interface InterventionPanelProps {
  isActive: boolean;
  budget: number;
  selectedNodes: number[];
  interventionDetails: Record<number, InterventionType>;
  auditLog: InterventionAuditEntry[];
  currentStep: number;
  onToggleActive: () => void;
  onChangeMethod: (nodeId: number, type: InterventionType) => void;
  onConfirmInterventions: () => void;
  onCancelSelections: () => void;
  onRemoveTarget: (nodeId: number) => void;
}

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  isActive,
  budget,
  selectedNodes,
  interventionDetails,
  auditLog,
  currentStep,
  onToggleActive,
  onChangeMethod,
  onConfirmInterventions,
  onCancelSelections,
  onRemoveTarget,
}) => {
  if (!isActive) {
    return (
      <button
        onClick={onToggleActive}
        className="px-4 py-2 rounded-2xl glass-panel text-xs font-semibold text-[#39F5A5] border border-[#39F5A5]/30 hover:border-[#39F5A5]/60 hover:bg-[#39F5A5]/10 shadow-[0_0_15px_rgba(57,245,165,0.15)] transition-all flex items-center space-x-2"
      >
        <Shield className="w-4 h-4 text-[#39F5A5]" />
        <span>Activate Intervention Mode</span>
      </button>
    );
  }

  const availableRemaining = Math.max(0, budget - selectedNodes.length);

  const METHOD_EXPLANATIONS: Record<InterventionType, { label: string; desc: string; icon: any; color: string }> = {
    isolate: {
      label: 'Isolate (Firewall)',
      desc: 'Completely stops all transmission from the selected user. Forwarding probability = 0. Node acts as a firewall.',
      icon: Shield,
      color: 'text-[#39F5A5] border-[#39F5A5]/30 bg-[#39F5A5]/10',
    },
    warn: {
      label: 'Warn (Probability Penalty)',
      desc: 'Issues a warning to the user, reducing their forwarding probability by 70% (multiplied by 0.3).',
      icon: AlertTriangle,
      color: 'text-[#FF3CAC] border-[#FF3CAC]/30 bg-[#FF3CAC]/10',
    },
    fact_check: {
      label: 'Fact-Check (Antidote Source)',
      desc: 'Halts rumour forwarding AND turns the user into an Antidote source spreading corrective information to neighbours.',
      icon: Zap,
      color: 'text-[#A855F7] border-[#A855F7]/30 bg-[#A855F7]/10',
    },
    community_alert: {
      label: 'Community Alert',
      desc: 'Alerts the user’s local community, reducing forwarding probability among all direct neighbours by 50%.',
      icon: Radio,
      color: 'text-[#F8F3FF] border-[#F8F3FF]/30 bg-[#F8F3FF]/10',
    },
  };

  return (
    <div className="glass-panel-elevated p-4 rounded-2xl border border-[#39F5A5]/40 shadow-2xl space-y-4 max-w-lg w-full text-xs animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Active Indicator Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-[#261A33]">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39F5A5] animate-pulse shadow-[0_0_8px_#39F5A5]" />
          <div>
            <h3 className="font-bold text-[#39F5A5] uppercase tracking-wider text-xs flex items-center space-x-1.5">
              <span>INTERVENTION MODE ACTIVE (Step T+{currentStep})</span>
            </h3>
            <p className="text-[10px] text-[#B7A9C9]">
              Pause simulation step to select targets & assign method.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-[#F8F3FF] bg-[#1B1223] px-2.5 py-1 rounded-xl border border-[#261A33]">
            {selectedNodes.length} / {budget} Used
          </span>
          <button
            onClick={onToggleActive}
            className="p-1 rounded-lg hover:bg-[#261A33] text-[#B7A9C9] transition-colors"
            title="Exit Intervention Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Intervention Targets List */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[#F8F3FF] uppercase tracking-wider">
            Target Nodes ({selectedNodes.length})
          </span>
          <span className="text-[10px] text-[#39F5A5] font-mono">
            {availableRemaining} remaining budget
          </span>
        </div>

        {selectedNodes.length === 0 ? (
          <div className="p-3 rounded-xl bg-[#08060B]/60 border border-[#261A33] text-center text-[#756B80] text-[11px]">
            Click nodes on the network canvas to add them to intervention targets.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {selectedNodes.map((nid) => {
              const currentMethod = interventionDetails[nid] || 'isolate';
              const MethodIcon = METHOD_EXPLANATIONS[currentMethod].icon;
              return (
                <div
                  key={nid}
                  className="p-2 rounded-xl bg-[#1B1223] border border-[#261A33] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <MethodIcon className="w-3.5 h-3.5 text-[#39F5A5]" />
                    <span className="font-mono font-bold text-[#A855F7]">User #{nid}</span>
                    <span className="text-[#F8F3FF] text-[11px] hidden sm:inline">
                      {getUserFullName(nid)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={currentMethod}
                      onChange={(e) => onChangeMethod(nid, e.target.value as InterventionType)}
                      className="bg-[#08060B] border border-[#261A33] text-[#F8F3FF] text-[11px] rounded-lg px-2 py-1 focus:border-[#A855F7] focus:outline-none"
                    >
                      <option value="isolate">Isolate (Firewall)</option>
                      <option value="warn">Warn (Probability Penalty)</option>
                      <option value="fact_check">Fact-Check (Antidote)</option>
                      <option value="community_alert">Community Alert</option>
                    </select>

                    <button
                      onClick={() => onRemoveTarget(nid)}
                      className="p-1 text-[#FF365E] hover:bg-[#261A33] rounded-lg transition-colors"
                      title="Remove target"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Method Parameter Explanation Box */}
      <div className="p-3 rounded-xl bg-[#08060B]/80 border border-[#261A33] space-y-1">
        <div className="flex items-center space-x-1.5 text-[#A855F7] font-semibold text-[11px]">
          <Info className="w-3.5 h-3.5" />
          <span>Intervention Policy Rules</span>
        </div>
        <p className="text-[10px] text-[#B7A9C9] leading-relaxed">
          Interventions take effect preventative or at step boundary. Interventions do not erase prior rumour exposure. Fact-checking automatically spreads Antidote corrective information to neighbours.
        </p>
      </div>

      {/* Audit Log Brief */}
      {auditLog.length > 0 && (
        <div>
          <div className="flex items-center space-x-1.5 mb-1 text-[11px] font-semibold text-[#B7A9C9]">
            <History className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Intervention Audit Trail ({auditLog.length})</span>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1 p-2 rounded-xl bg-[#08060B]/50 border border-[#261A33] font-mono text-[10px]">
            {auditLog.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between text-[#B7A9C9]">
                <span>T+{log.step}: User #{log.nodeId} ({getUserFullName(log.nodeId)})</span>
                <span className="text-[#39F5A5] capitalize">[{log.type}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation & Cancel Actions */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={onCancelSelections}
          disabled={selectedNodes.length === 0}
          className="flex-1 py-2 px-3 rounded-xl font-medium bg-[#1B1223] hover:bg-[#261A33] text-[#B7A9C9] border border-[#261A33] transition-colors disabled:opacity-40"
        >
          Cancel Selections
        </button>

        <button
          onClick={onConfirmInterventions}
          disabled={selectedNodes.length === 0}
          className="flex-1 py-2 px-3 rounded-xl font-semibold bg-gradient-to-r from-[#39F5A5] to-[#22C55E] text-[#08060B] shadow-[0_0_15px_rgba(57,245,165,0.3)] hover:opacity-90 transition-all disabled:opacity-40"
        >
          Confirm & Apply
        </button>
      </div>
    </div>
  );
};

export default InterventionPanel;
