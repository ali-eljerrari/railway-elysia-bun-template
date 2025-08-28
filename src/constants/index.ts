const VARS = [
  { name: 'API_KEY', value: Bun.env.API_KEY },
  { name: 'PORT', value: Bun.env.PORT },
];

for (const { name, value } of VARS) {
  if (!value) {
    console.error(`${name} is not set!`);
    process.exit(1);
  }
}
export { VARS };
