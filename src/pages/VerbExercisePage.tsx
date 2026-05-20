import { useLocation } from 'react-router-dom';
import ConjugationExercise from '../components/ConjugationExercise';
import { verbEngines, verbFormLabels } from '../engines/verbConjugation';
import verbs from '../data/dictConjugationVerbs';
import { useTranslation } from 'react-i18next';

export default function VerbExercisePage() {
  const { t } = useTranslation();
  const location = useLocation();
  // Extract the form key from the URL path (e.g., /teform -> teform)
  const formKey = location.pathname.replace('/', '');
  const engine = verbEngines[formKey];

  if (!engine) {
    return (
      <div className="app-container">
        <h1 className="page-heading">{t('errors.exerciseNotFound', { id: formKey })}</h1>
      </div>
    );
  }

  const title = verbFormLabels[formKey] || formKey;

  return (
    <ConjugationExercise
      key={formKey}
      title={t('common.practiceTitle', { title })}
      wordData={verbs}
      engine={engine}
      typeLabels={{
        u: t('verb.typeLabels.u'),
        ru: t('verb.typeLabels.ru'),
        irr: t('verb.typeLabels.irr'),
      }}
      backPath="/"
      persistKey={location.pathname}
    />
  );
}
