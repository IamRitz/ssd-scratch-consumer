# ssd-scratch-consumer — throwaway verification repo

Proves that a repository containing **no framework files** can run the shared
security pipeline, and that a repo declaring `artifact_type: none` reports the
image controls as N/A rather than failing or silently skipping them.

Delete this repo once the run is green.

## What is deliberately absent

No `security/scripts/`, no `policy.yaml`, no `_*.yml` reusable workflows, no
Makefile, no Dockerfile. The complete contents:

    package.json
    package-lock.json
    src/app.js
    security/baseline/semgrep-baseline.json   <- the one security file a consumer owns
    .github/workflows/security.yml            <- a thin caller

## Run it

Requires `IamRitz/ssd-security-framework` to be pushed and tagged `v1` first.

```sh
cd ssd-scratch-consumer
git init -b main && git add -A && git commit -m "Scratch consumer with no framework files"
gh repo create IamRitz/ssd-scratch-consumer --public --source=. --push

gh workflow run "Security checks" --repo IamRitz/ssd-scratch-consumer
gh run watch --repo IamRitz/ssd-scratch-consumer
```

## What a passing run proves

1. Cross-repo `uses:` resolves and the framework's jobs execute.
2. The toolkit reaches a repo that has none of it, and the
   "Confirm the workspace holds no framework files" step passes in all three
   scanner jobs — the workspace really was only the consumer's own checkout.
3. `security-gate` is green, so a clean consumer is not blocked by the framework.
4. The conformance report shows the image and deploy controls as
   **not-applicable with a reason naming `artifact_type=none`**, and
   `failed: 0`. Download it:

```sh
gh run download --repo IamRitz/ssd-scratch-consumer -n conformance-report
cat conformance.json
```

## Clean up

```sh
gh repo delete IamRitz/ssd-scratch-consumer --yes
```
