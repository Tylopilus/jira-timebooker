import { createHash } from './extension-utils';

describe('extension-utils', () => {
   test('should create a hash', async () => {
      await expect(createHash('test')).resolves.toEqual(
         '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      );
   });
});
