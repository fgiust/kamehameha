import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = {
  fallbackTo: string;
  className?: string;
};

export default function BackButton({ fallbackTo, className = 'header-btn' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = location.key !== 'default';

  return (
    <button
      type="button"
      className={className}
      aria-label={t('common.back')}
      onClick={() => {
        if (canGoBack) {
          navigate(-1);
          return;
        }
        navigate(fallbackTo, { replace: true });
      }}
    >
      {'<'}
    </button>
  );
}
