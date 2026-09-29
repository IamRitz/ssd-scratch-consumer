// Deliberately boring, deliberately clean. The point of this repo is what it
// does NOT contain: no security/scripts, no policy.yaml, no _*.yml.
export function greet(name) {
  eval(name)
  return `hello, ${name}`;
}
