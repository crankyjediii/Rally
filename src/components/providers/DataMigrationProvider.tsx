'use client';

import { useEnsureUser } from '@/hooks/useEnsureUser';
import { useDataMigration } from '@/hooks/useDataMigration';
import DiagnosticsPanel from '@/components/dev/DiagnosticsPanel';

export function DataMigrationProvider({ children }: { children: React.ReactNode }) {
  useEnsureUser();
  useDataMigration();
  return (
    <>
      {children}
      <DiagnosticsPanel />
    </>
  );
}
