# CI Monitoring

Comprehensive guide to monitoring your GitHub repository's CI/CD health.

## Overview

This project provides three complementary methods for monitoring CI status and repository health:

1. **CI Check in Hygiene Command** - Manual checks
2. **Desktop Notifications** - Automatic alerts
3. **Pre-Push Hook** - Git workflow integration

## Method 1: CI Check in Hygiene Command

The `/hygiene` command includes automatic CI status checking.

### Usage

```bash
/hygiene
```

### What It Checks

- Recent workflow run status
- Test failures
- Build status
- Last successful run

### Output

```
📊 GitHub Actions Status:
✅ CI is passing - all workflows successful
   Last successful: Quality Checks
```

Or if issues are found:

```
❌ CI has failures:
   • workflow-name (failed)
```

## Method 2: Desktop Notifications

Background monitoring with desktop notifications for immediate awareness of CI failures.

### Configuration

Edit `.monitor-config.json`:

```json
{
  "interval": 300000,
  "notifications": {
    "enabled": true,
    "sound": true,
    "onFailure": true,
    "onSuccess": false
  }
}
```

### Usage

```bash
/monitor start    # Start background monitoring
/monitor status   # Check current status
/monitor stop     # Stop monitoring
```

### Features

- **Automatic checks** every 5 minutes (configurable)
- **Desktop notifications** for failures
- **Sound alerts** (optional)
- **Status persistence** in `.monitor-status.json`
- **Non-intrusive** background operation

### Notification Types

- 🔴 **Test Failures** - Critical, requires immediate attention
- 🟡 **Build Failures** - Important, investigate soon
- 🟢 **Recovery** - CI back to passing (optional)

## Method 3: Pre-Push Hook

Prevent pushing to remote when CI is failing on the current branch.

### Installation

The pre-push hook is automatically installed at `.git/hooks/pre-push`.

### How It Works

1. Before each `git push`, checks CI status
2. If CI is failing, blocks the push
3. Provides clear error message
4. Can be bypassed with `--no-verify` flag

### Example Output

```bash
$ git push
⚠️  CI Status Check
────────────────────
❌ Cannot push: CI is currently failing

Recent failures:
  • Quality Checks (failed 5 minutes ago)
  • Tests (failed 10 minutes ago)

Fix CI issues before pushing, or use:
  git push --no-verify

To check CI status: /hygiene
```

### Bypass (Use Sparingly)

```bash
git push --no-verify
```

**Warning**: Only bypass when you're certain the failures are unrelated to your changes.

## Choosing the Right Method

| Method | Best For | Proactive | Manual |
|--------|----------|-----------|--------|
| Hygiene Command | On-demand checks | ❌ | ✅ |
| Desktop Notifications | Continuous awareness | ✅ | ❌ |
| Pre-Push Hook | Preventing bad pushes | ✅ | ❌ |

### Recommended Combination

Use all three methods together:

1. **Desktop Notifications** - Stay aware of CI health
2. **Pre-Push Hook** - Catch issues before pushing
3. **Hygiene Command** - Deep-dive when investigating issues

## Implementation Details

### CI Status Script

All methods use `scripts/check-ci.js`:

```javascript
// Check recent workflow runs
const runs = await checkWorkflowStatus();

// Determine if CI is passing
const passing = runs.every(run =>
  run.conclusion === 'success' ||
  run.status === 'in_progress'
);
```

### Notification System

Desktop notifications use `scripts/monitor-repo.js`:

```javascript
const { notifyFailure, notifySuccess } = require('./notifications');

// When failure detected
await notifyFailure({
  title: 'CI Failed',
  message: 'Quality Checks workflow failed',
  sound: config.notifications.sound
});
```

### Git Hook Integration

Pre-push hook at `.git/hooks/pre-push`:

```bash
#!/bin/bash
# Check CI status before push
node scripts/check-ci.js --strict

if [ $? -ne 0 ]; then
  echo "❌ Push blocked: CI failing"
  exit 1
fi
```

## Troubleshooting

### Notifications Not Appearing

1. Check config: `cat .monitor-config.json`
2. Verify monitoring is running: `/monitor status`
3. Ensure notifications are enabled in system settings

### Pre-Push Hook Not Running

1. Verify hook is executable: `chmod +x .git/hooks/pre-push`
2. Check hook exists: `ls -la .git/hooks/pre-push`
3. Test manually: `.git/hooks/pre-push`

### False Positives

If CI check reports failures incorrectly:

1. Check GitHub Actions directly
2. Verify `gh` CLI is authenticated: `gh auth status`
3. Update workflow status: `/monitor status`

## Advanced Configuration

### Custom Check Intervals

Edit `.monitor-config.json`:

```json
{
  "interval": 180000  // 3 minutes
}
```

### Workflow Filtering

Only monitor test workflows:

```json
{
  "workflows": ["test", "quality"],
  "ignoreWorkflows": ["deploy", "docs"]
}
```

### Notification Preferences

```json
{
  "notifications": {
    "enabled": true,
    "sound": false,           // Silent notifications
    "onSuccess": true,        // Notify on recovery
    "testsOnly": true         // Only test failures
  }
}
```

## Integration with Development Workflow

### Typical Workflow

1. **Start your day**: `/monitor start`
2. **Make changes**: Code normally
3. **Commit**: `git commit`
4. **Push**: `git push` (hook checks CI)
5. **Check health**: `/hygiene` periodically
6. **End of day**: `/monitor stop` (optional)

### CI-First Development

1. Write tests first (TDD)
2. Ensure local tests pass
3. Commit and push
4. Monitor notifications
5. Fix issues immediately if CI fails

## Related Commands

- `/hygiene` - Full project health check
- `/monitor` - Background monitoring control
- `/commit` - Quality-checked commits
- `gh run list` - View full CI history
- `gh run view` - Detailed run information

## Benefits

### Immediate Awareness

- Know about failures within minutes
- Don't wait until next PR review
- Catch issues early

### Prevent Cascading Failures

- Block pushing when CI is failing
- Avoid compounding problems
- Keep main branch healthy

### Reduced Context Switching

- Desktop notifications prevent constant checking
- Focus on coding
- React when necessary

## See Also

- [GitHub Monitor Command](.claude/commands/monitor.md)
- [Hygiene Command](.claude/commands/hygiene.md)
- [Project Hygiene](../README.md#hygiene)
