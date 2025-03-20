const helloWorld = require('../helloWorld');

test('returns "Hello, World!"', () => {
	expect(helloWorld()).toBe('Hello, World!');
});