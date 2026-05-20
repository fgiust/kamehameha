import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = {
  className?: string;
};

export default function BackButton({ className = 'header-btn' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className}
      aria-label={t('common.back')}
      onClick={() => {
        navigate('/', { state: { restoreScroll: true } });
      }}
    >
      {'<'}
    </button>
  );
}
