import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPathname, localizePath } from '../seo/localizedPaths';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

const exchangePromiseByCode = new Map<string, Promise<string | null>>();

function exchangeAuthCodeOnce(code: string) {
  const existing = exchangePromiseByCode.get(code);
  if (existing) return existing;

  const client = getSupabaseBrowserClient();
  if (!client) {
    return Promise.resolve('Authentication is not configured yet.');
  }

  const promise = client.auth.exchangeCodeForSession(code).then(({ error }) => {
    if (error) {
      exchangePromiseByCode.delete(code);
      return error.message;
    }
    return null;
  });

  exchangePromiseByCode.set(code, promise);
  return promise;
}

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const client = getSupabaseBrowserClient();

  const nextPath = useMemo(() => {
    const raw = searchParams.get('next') ?? '/';
    return raw.startsWith('/') ? raw : '/';
  }, [searchParams]);

  useEffect(() => {
    if (!client) {
      setErrorMessage(t('auth.notConfigured'));
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setErrorMessage(t('auth.callbackMissingCode'));
      return;
    }

    let isMounted = true;

    void exchangeAuthCodeOnce(code).then(error => {
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error);
        return;
      }

      navigate(nextPath, { replace: true });
    });

    return () => {
      isMounted = false;
    };
  }, [client, navigate, nextPath, searchParams, t]);

  const lang = getLanguageFromPathname(nextPath) ?? 'en';
  const homePath = localizePath('/', lang);

  return (
    <div className="app-container auth-callback-container">
      <div className="card auth-callback-card">
        <h1 className="page-heading auth-callback-title">
          {errorMessage ? t('auth.callbackErrorTitle') : t('auth.callbackLoading')}
        </h1>
        <p className="auth-callback-body">
          {errorMessage ?? t('auth.callbackLoadingBody')}
        </p>
        {errorMessage ? (
          <button
            type="button"
            className="submit-button auth-callback-home"
            onClick={() => navigate(homePath, { replace: true })}
          >
            {t('common.home')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
