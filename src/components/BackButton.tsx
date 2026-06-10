import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from '../seo/useLocalizedPath';

type Props = {
  className?: string;
};

export default function BackButton({ className = 'header-btn' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localizePath = useLocalizedPath();

  return (
    <button
      type="button"
      className={className}
      aria-label={t('common.back')}
      onClick={() => {
        navigate(localizePath('/'), { state: { restoreScroll: true } });
      }}
    >
      {'<'}
    </button>
  );
}
