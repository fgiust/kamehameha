import { useLocation } from 'react-router-dom';
import ConjugationExercise from '../components/ConjugationExercise';
import { verbEngines, verbFormLabels } from '../engines/verbConjugation';
import verbs from '../data/dictConjugationVerbs';
import { useTranslation } from 'react-i18next';
import { stripLangPrefix } from '../seo/localizedPaths';

type Props = {
  forceReverseQA?: boolean;
};

export default function VerbExercisePage({ forceReverseQA }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const internalPath = stripLangPrefix(location.pathname);
  const formKey = internalPath.slice(1);
  const engineKey = formKey === 'politeform-short' ? 'politeform' : formKey;
  const engine = verbEngines[engineKey];

  if (!engine) {
    return (
      <div className="app-container">
        <h1 className="page-heading">{t('errors.exerciseNotFound', { id: formKey })}</h1>
      </div>
    );
  }

  const title = formKey === 'politeform-short'
    ? t('forms.short')
    : (() => {
      const titleKey = verbFormLabels[engineKey];
      return titleKey ? t(titleKey) : engineKey;
    })();

  return (
    <ConjugationExercise
      key={formKey}
      title={title}
      wordData={verbs}
      engine={engine}
      typeLabels={{
        u: t('verb.typeLabels.u'),
        ru: t('verb.typeLabels.ru'),
        irr: t('verb.typeLabels.irr'),
      }}
      persistKey={internalPath}
      forceReverseQA={forceReverseQA}
    />
  );
}
