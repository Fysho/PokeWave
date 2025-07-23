import React from 'react';
import BattleTester from '../battle/BattleTester';

interface RightSidePanelProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  pokemon1: any;
  pokemon2: any;
  onSimulateBattle: () => void;
  simulation: any;
  isSimulating: boolean;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
  isExpanded,
  onToggleExpanded,
  pokemon1,
  pokemon2,
  onSimulateBattle,
  simulation,
  isSimulating
}) => {
  return (
    <BattleTester
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      pokemon1={pokemon1}
      pokemon2={pokemon2}
      onSimulateBattle={onSimulateBattle}
      simulation={simulation}
      isSimulating={isSimulating}
      rightOffset={0}
    />
  );
};

export default RightSidePanel;