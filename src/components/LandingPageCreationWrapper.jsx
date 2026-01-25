import { LandingPageCreationProvider, useLandingPageCreation } from '../contexts/LandingPageCreationContext';
import CreationModeSelector from './CreationModeSelector';
import ConversationalInterview from './ConversationalInterview';
import LandingPageBuilder from './LandingPageBuilder';

function LandingPageCreationFlow({ onClose, onSave }) {
  const { showModeSelector, showChat } = useLandingPageCreation();

  return (
    <>
      {/* Builder sempre renderizado */}
      <LandingPageBuilder onClose={onClose} onSave={onSave} />
      
      {/* Modais overlay */}
      {showModeSelector && <CreationModeSelector />}
      {showChat && <ConversationalInterview />}
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
