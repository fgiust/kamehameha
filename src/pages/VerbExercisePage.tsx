import { useLocation } from 'react-router-dom';
import ConjugationExercise from '../components/ConjugationExercise';
import { verbEngines, verbFormLabels } from '../engines/verbConjugation';
import verbs from '../data/verbs';

const typeLabels = {
  u: 'う-Verb (Godan)',
  ru: 'る-Verb (Ichidan)',
  irr: 'Irregular Verb',
};

export default function VerbExercisePage() {
  const location = useLocation();
  // Extract the form key from the URL path (e.g., /teform -> teform)
  const formKey = location.pathname.replace('/', '');
  const engine = verbEngines[formKey];

  if (!engine) {
    return (
      <div className="app-container">
        <h1 className="page-heading">Exercise not found: {formKey}</h1>
      </div>
    );
  }

  const title = verbFormLabels[formKey] || formKey;

  return (
    <ConjugationExercise
      key={formKey}
      title={`${title} Practice`}
      wordData={verbs}
      engine={engine}
      typeLabels={typeLabels}
      backPath="/"
      persistKey={location.pathname}
    />
  );
}
