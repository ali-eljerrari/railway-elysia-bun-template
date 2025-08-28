import Elysia from 'elysia';

export const apiKey = new Elysia({ name: 'apiKey' }).macro(
  ({ onBeforeHandle }) => ({
    apiKey(key: string) {
      onBeforeHandle(({ headers, status }) => {
        if (headers.authorization !== key)
          return status(401, {
            code: 'INVALID_API_KEY',
            message:
              'Please provide a valid API KEY in the authorization header',
          });
      });
    },
  })
);
