import { useLocation } from 'react-router-dom';
import ConjugationExercise from '../components/ConjugationExercise';
import { adjEngines, adjFormLabels } from '../engines/adjConjugation';
import adjectives from '../data/adjectives';

const typeLabels = {
  i: 'い-Adjective',
  na: 'な-Adjective',
};

export default function AdjExercisePage() {
  const location = useLocation();
  // Extract the form key from the URL path (e.g., /adj-negativeform -> adj-negativeform)
  const formKey = location.pathname.replace('/', '');
  const engine = adjEngines[formKey];

  if (!engine) {
    return (
      <div className="app-container">
        <h1 className="page-heading">Exercise not found: {formKey}</h1>
      </div>
    );
  }

  const title = adjFormLabels[formKey] || formKey;

  return (
    <ConjugationExercise
      key={formKey}
      title={`${title} Adjective Practice`}
      wordData={adjectives}
      engine={engine}
      typeLabels={typeLabels}
      backPath="/"
      persistKey={location.pathname}
    />
  );
}
