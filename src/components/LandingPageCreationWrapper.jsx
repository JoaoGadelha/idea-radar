import { LandingPageCreationProvider, useLandingPageCreation } from '../contexts/LandingPageCreationContext';
import CreationModeSelector from './CreationModeSelector';
import ConversationalInterview from './ConversationalInterview';
import LandingPageBuilder from './LandingPageBuilder';

function LandingPageCreationFlow({ onClose, onSave }) {
  const { currentView } = useLandingPageCreation();

  return (
    <>
      {currentView === 'choice' && <CreationModeSelector />}
      {currentView === 'chat' && <ConversationalInterview />}
      {currentView === 'builder' && <LandingPageBuilder onClose={onClose} onSave={onSave} />}
    </>
  );
}

export default function LandingPageCreationWrapper({ onClose, onSave }) {
  return (
    <LandingPageCreationProvider>
      <LandingPageCreationFlow onClose={onClose} onSave={onSave} />
    </LandingPageCreationProvider>
  );
}
