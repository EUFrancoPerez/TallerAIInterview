#!/bin/bash
# Speak notifications aloud (macOS). Swap `say` for your platform's TTS
# or a desktop-notification command on Linux/Windows.
MESSAGE="$CLAUDE_NOTIFICATION_MESSAGE"
say "$MESSAGE" &
