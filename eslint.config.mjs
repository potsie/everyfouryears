import next from 'eslint-config-next';

// ESLint 9 flat config. eslint-config-next's default export is already a
// Linter.Config[] (base + core-web-vitals + TypeScript), so we spread it.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // Design-handoff prototypes / hi-fi mockups — reference only, not app source.
      'handoff/**',
      'handoff-*/**',
      'design_handoff_*/**',
    ],
  },
  ...next,
];

export default config;
