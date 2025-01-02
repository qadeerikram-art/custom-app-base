'use client';

import { useEffect, useMemo } from 'react';

interface BreadcrumbsPayload {
  type: 'header.breadcrumbs';
  items: {
    label: string;
    onClick: string;
  }[];
}

interface PrimaryCtaPayload {
  type: 'header.primaryCta';
  label: string;
  onClick: string;
}

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

const getBreadcrumbId = (idx: number) => `header.breadcrumbs.${idx}`;

const ensureHttps = (url: string) => {
  if (url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return `https://${url}`;
};

export function useBreadcrumbs(
  breadcrumbs: Breadcrumb[],
  config?: {
    portalUrl?: string;
  },
) {
  const callbackRefs = useMemo(() => {
    return breadcrumbs.reduce<Record<string, () => void>>(
      (acc, { onClick }, idx) => {
        if (onClick) acc[getBreadcrumbId(idx)] = onClick;
        return acc;
      },
      {},
    );
  }, [breadcrumbs]);

  const payload: BreadcrumbsPayload = {
    type: 'header.breadcrumbs',
    items: breadcrumbs.map(({ label, onClick }, idx) => ({
      onClick: onClick ? getBreadcrumbId(idx) : '',
      label,
    })),
  };

  useEffect(() => {
    window.parent.postMessage(payload, 'https://dashboard.copilot.com');
    if (config?.portalUrl) {
      window.parent.postMessage(payload, ensureHttps(config.portalUrl));
    }

    // Be sure to add your portal domain here as well, whether it's a copilot.app
    // subdomain or a custom domain. This allows the two frames to talk to each other.
    // window.parent.postMessage(payload, 'https://yourportaldomain.copilot.app');

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === 'header.breadcrumbs.onClick' &&
        typeof event.data.id === 'string' &&
        callbackRefs[event.data.id]
      ) {
        callbackRefs[event.data.id]();
      }
    };

    addEventListener('message', handleMessage);

    return () => {
      removeEventListener('message', handleMessage);
    };
  }, [breadcrumbs, payload]);

  useEffect(() => {
    const handleUnload = () => {
      window.parent.postMessage(
        { type: 'header.breadcrumbs', items: [] },
        'https://dashboard.copilot.com',
      );
    };
    addEventListener('beforeunload', handleUnload);
    return () => {
      removeEventListener('beforeunload', handleUnload);
    };
  }, []);
}

export function usePrimaryCta(
  primaryCta: Breadcrumb | null,
  config?: { portalUrl?: string },
) {
  const payload: PrimaryCtaPayload | Pick<PrimaryCtaPayload, 'type'> =
    !primaryCta
      ? { type: 'header.primaryCta' }
      : {
          type: 'header.primaryCta',
          label: primaryCta.label,
          onClick: 'header.primaryCta.onClick',
        };

  useEffect(() => {
    window.parent.postMessage(payload, 'https://dashboard.copilot.com');
    if (config?.portalUrl) {
      window.parent.postMessage(payload, ensureHttps(config.portalUrl));
    }

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === 'header.primaryCta.onClick' &&
        typeof event.data.id === 'string' &&
        primaryCta?.onClick
      ) {
        primaryCta.onClick();
      }
    };

    addEventListener('message', handleMessage);

    return () => {
      removeEventListener('message', handleMessage);
    };
  }, [primaryCta]);

  useEffect(() => {
    const handleUnload = () => {
      window.parent.postMessage(
        { type: 'header.primaryCta' },
        'https://dashboard.copilot.com',
      );
      if (config?.portalUrl) {
        window.parent.postMessage(
          { type: 'header.primaryCta' },
          ensureHttps(config.portalUrl),
        );
      }
    };
    addEventListener('beforeunload', handleUnload);
    return () => {
      removeEventListener('beforeunload', handleUnload);
    };
  }, []);
}
