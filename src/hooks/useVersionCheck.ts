import { VersionCheckResult, VersionCheckService } from '@/services/versionCheckService';
import { useEffect, useState } from 'react';

export interface UseVersionCheckResult {
  isLoading: boolean;
  versionCheckResult: VersionCheckResult | null;
  error: string | null;
}

export const useVersionCheck = (): UseVersionCheckResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [versionCheckResult, setVersionCheckResult] = useState<VersionCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize remote config
        await VersionCheckService.initialize();

        // Check version
        const result = await VersionCheckService.checkVersion();
        setVersionCheckResult(result);

        // Show alert if version is not supported
        if (!result.isVersionSupported) {
          VersionCheckService.showVersionUpdateAlert(result.minVersion);
        }
      } catch (err) {
        console.error('Version check error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    checkVersion();
  }, []);

  return {
    isLoading,
    versionCheckResult,
    error,
  };
};
