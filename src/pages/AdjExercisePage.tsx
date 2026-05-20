import { useLocation } from 'react-router-dom';
import ConjugationExercise from '../components/ConjugationExercise';
import { adjEngines, adjFormLabels } from '../engines/adjConjugation';
import adjectives from '../data/dictConjugationAdjectives';
import { useTranslation } from 'react-i18next';

export default function AdjExercisePage() {
  const { t } = useTranslation();
  const location = useLocation();
  // Extract the form key from the URL path (e.g., /adj-negativeform -> adj-negativeform)
  const formKey = location.pathname.replace('/', '');
  const engine = adjEngines[formKey];

  if (!engine) {
    return (
      <div className="app-container">
        <h1 className="page-heading">{t('errors.exerciseNotFound', { id: formKey })}</h1>
      </div>
    );
  }

  const titleKey = adjFormLabels[formKey];
  const title = titleKey ? t(titleKey) : formKey;

  return (
    <ConjugationExercise
      key={formKey}
      title={title}
      wordData={adjectives}
      engine={engine}
      typeLabels={{
        i: t('adjective.typeLabels.i'),
        na: t('adjective.typeLabels.na'),
      }}
      persistKey={location.pathname}
    />
  );
}
