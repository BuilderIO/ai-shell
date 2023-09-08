import { dim } from 'kolorist';
import { version } from '../../package.json';
import i18n from './i18n';

export class KnownError extends Error {}

const indent = ' '.repeat(4);

export const handleCliError = (error: any) => {
  if (error instanceof Error && !(error instanceof KnownError)) {
    if (error.stack) {
      console.error(dim(error.stack.split('\n').slice(1).join('\n')));
    }
    console.error(`\n${indent}${dim(`ai-shell v${version}`)}`);
    console.error(
      `\n${indent}${i18n.t(
        'Please open a Bug report with the information above',
      )}:`,
    );
    console.error(`${indent}https://github.com/BuilderIO/ai-shell/issues/new`);
  }
};
