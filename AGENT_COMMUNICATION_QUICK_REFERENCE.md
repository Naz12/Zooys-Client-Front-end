# 🤖 Agent Communication Quick Reference

**🚨 MANDATORY FOR ALL AGENTS - READ THIS FIRST**

## 📍 Communication Path
```
C:\xampp\htdocs\zooys_backend_laravel-main\agent-communication\
```

## 🎯 Reading Order (CRITICAL)
1. **FIRST**: `current/quick-status.md` (30 lines max)
2. **Issues**: `current/active-issues.md` (50 lines max)
3. **Responses**: `current/recent-responses.md` (100 lines max)

## ✍️ Writing Rules
- **Issues**: Use `templates/issue-template.md` (max 10 lines)
- **Responses**: Use `templates/response-template.md` (max 20 lines)
- **Archive**: Move resolved items immediately

## 🚨 File Size Limits
| File | Max Lines | Auto-Archive |
|------|-----------|--------------|
| `quick-status.md` | 30 | Yes |
| `active-issues.md` | 50 | Yes |
| `recent-responses.md` | 100 | Yes |

## ✅ Current Status (Oct 14, 2025)
- **All Systems**: ✅ OPERATIONAL
- **Active Issues**: 0
- **Services**: Laravel (8000), Math (8002), Presentation (8001)

## 📋 Templates

### Issue Template:
```markdown
## ISSUE-XXX: [Brief Title]
**Date:** YYYY-MM-DD HH:MM
**Priority:** HIGH
**Status:** PENDING

### Problem:
[1-2 sentence description]

### Action Required:
[What needs to be done]
```

### Response Template:
```markdown
## Response #XXX - [Date] - [Time]
**Issue:** [Issue reference]
**Status:** ✅ RESOLVED

### Root Cause:
[1-2 sentence explanation]

### Solution:
[Brief solution summary]
```

## 🎯 Token Efficiency
- **Old System**: ~4,500 tokens per session
- **New System**: ~540 tokens per session
- **Savings**: 90% reduction

---

**Remember: Always read `quick-status.md` first!**
