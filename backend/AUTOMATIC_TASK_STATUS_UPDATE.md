# Automatic Task Status Update

This document describes the automatic task status update functionality that changes tasks from `PENDING` to `IN_PROGRESS` when their due date is reached.

## How It Works

### 1. Automatic Detection

- The system runs a scheduled job every 6 hours to check for tasks that need status updates
- Tasks with status `PENDING` and due date on or before today are automatically updated to `IN_PROGRESS`

### 2. Notification System

- When a task status is updated, the user receives a notification
- The notification includes the task title and explains that it's now in progress because it's due today

### 3. Error Handling

- Individual task update failures don't stop the entire process
- Detailed logging shows which tasks were updated successfully and which failed
- The system returns statistics about the update process

## Implementation Details

### Files Modified

- `backend/src/services/notificationTriggers.js` - Added `updateTasksToInProgress()` function
- `backend/src/services/cronService.js` - Added scheduled job to run every 6 hours
- `backend/src/routes/test-notifications.js` - Added test endpoints

### Database Query

```sql
SELECT * FROM tasks
WHERE status = 'PENDING'
AND dueDate <= 'today 00:00:00'
```

### Cron Schedule

- **Frequency**: Every 6 hours (21600000 ms)
- **Initial Run**: 5 seconds after server startup
- **Manual Trigger**: Available via test endpoint

## Testing

### Test Endpoints

1. **Manual Status Update Test**

   ```
   POST /api/test-notifications/test-task-status-update
   ```

   - Manually triggers the status update process
   - Returns statistics about updated tasks

2. **Create Test Task**
   ```
   POST /api/test-notifications/test-create-due-today-task
   Body: { "userId": "user_id_here" }
   ```
   - Creates a task with due date set to today
   - Useful for testing the automatic update functionality

### Example Usage

1. Create a task with due date today:

   ```bash
   curl -X POST http://localhost:5000/api/test-notifications/test-create-due-today-task \
     -H "Content-Type: application/json" \
     -d '{"userId": "your_user_id"}'
   ```

2. Manually trigger status update:
   ```bash
   curl -X POST http://localhost:5000/api/test-notifications/test-task-status-update
   ```

## Configuration

### Timing

- The system checks for tasks that are due "today or earlier"
- Uses `now.setHours(0, 0, 0, 0)` to normalize the current date to start of day
- Tasks with due dates at any time today will be updated

### Notifications

- Users receive a `TASK_REMINDER` notification when their task status changes
- Notification includes task title and status change information
- Notifications respect user's notification preferences

## Monitoring

### Logs

The system provides detailed logging:

- Number of tasks found for update
- Individual task update success/failure
- Final statistics (updated count, error count, total found)

### Example Log Output

```
Found 3 tasks to update to IN_PROGRESS
✅ Updated task "Complete project" to IN_PROGRESS
✅ Updated task "Call client" to IN_PROGRESS
❌ Error updating task "Review code": Database connection error
Successfully updated 2 tasks to IN_PROGRESS (1 errors)
```

## Benefits

1. **Automatic Workflow**: Tasks automatically move to the appropriate status
2. **User Awareness**: Users are notified when their tasks become active
3. **Reliable**: Error handling ensures the system continues working even if individual updates fail
4. **Testable**: Multiple test endpoints allow for easy verification
5. **Configurable**: Easy to adjust timing and behavior as needed

## Future Enhancements

- Add configuration for different update schedules
- Support for different time zones
- Bulk update operations for better performance
- Integration with task priority levels
- Custom notification templates
