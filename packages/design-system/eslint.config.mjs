import react from '@orbit/config-eslint/next';

const config = [
  ...react,
  {
    // The shared UI package has no application routes and must stay framework-neutral.
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
];

export default config;
