import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SpreadStep } from '../services/api';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  history: SpreadStep[];
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSeekStep: (stepIdx: number) => void;
  onChangeSpeed: (speed: number) => void;
  antidoteReach?: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentStepIndex,
  totalSteps,
  history,
  playbackSpeed,
  onPlay,
  onPause,
  onReset,
  onNextStep,
  onPrevStep,
  onSeekStep,
  onChangeSpeed,
  antidoteReach = 0,
}) => {
  const currentSnapshot = history[currentStepIndex] || {
    step: 0,
    active_count: 1,
    contained_count: 0,
    unaware_count: 0,
    antidote_count: 0,
    newly_infected: [],
    newly_corrected: [],
  };

  return (
    <div className="glass-panel px-4 py-3 rounded-2xl border border-[#A855F7]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Play/Pause/Step Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onReset}
          className="p-2 rounded-xl bg-[#1B1223] hover:bg-[#261A33] text-[#B7A9C9] hover:text-[#F8F3FF] transition-all"
          title="Reset to Step 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPrevStep}
          disabled={currentStepIndex <= 0}
          className="p-2 rounded-xl bg-[#1B1223] hover:bg-[#261A33] text-[#B7A9C9] hover:text-[#F8F3FF] transition-all disabled:opacity-40"
          title="Previous Step"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`px-3.5 py-2 rounded-xl font-medium flex items-center space-x-1.5 transition-all shadow-lg ${
            isPlaying
              ? 'bg-[#FF365E] hover:bg-[#FF365E]/90 text-white shadow-[0_0_15px_rgba(255,54,94,0.4)]'
              : 'bg-gradient-to-r from-[#A855F7] to-[#FF3CAC] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-2 rounded-xl bg-[#1B1223] hover:bg-[#261A33] text-[#B7A9C9] hover:text-[#F8F3FF] transition-all disabled:opacity-40"
          title="Next Step"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 bg-[#08060B] p-1 rounded-xl border border-[#261A33] ml-2">
          {[0.5, 1.0, 2.0, 4.0].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-colors ${
                playbackSpeed === s
                  ? 'bg-[#A855F7] text-white font-bold'
                  : 'text-[#B7A9C9] hover:text-[#F8F3FF]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Step Timeline Slider */}
      <div className="flex-1 w-full max-w-md flex items-center space-x-3 px-2">
        <span className="font-mono text-[#A855F7] font-bold text-xs min-w-[55px]">
          T+{currentSnapshot.step}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onSeekStep(Number(e.target.value))}
          className="w-full h-1.5 bg-[#1B1223] rounded-lg appearance-none cursor-pointer accent-[#FF3CAC]"
        />
        <span className="font-mono text-[#B7A9C9] text-[11px] min-w-[45px]">
          / {Math.max(0, totalSteps - 1)}
        </span>
      </div>

      {/* Trace Statistics Pill */}
      <div className="flex items-center space-x-3 text-[11px]">
        <div className="flex items-center space-x-1 text-[#FF365E]">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="font-mono font-bold">{currentSnapshot.active_count} infected</span>
        </div>

        <div className="flex items-center space-x-1 text-[#39F5A5]">
          <ShieldCheck className="w-3 h-3" />
          <span className="font-mono font-bold">{currentSnapshot.contained_count} guarded</span>
        </div>

        <div className="flex items-center space-x-1 text-[#A855F7]">
          <Zap className="w-3 h-3" />
          <span className="font-mono font-bold">{currentSnapshot.antidote_count || antidoteReach} antidote</span>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
