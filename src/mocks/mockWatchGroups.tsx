// Types
import type { WatchlistGroupResponse } from "../types/response";

export const mockWatchlistGroup: WatchlistGroupResponse = {
  "endpoint": "http://nsb-core.local:7300/api/v0/<sector>/<action>",
  "statusCode": 200,
  "status": "Successful",
  "success": true,
  "message": "OK",
  "data": [{
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "group_name": "Example",
    "description": "Example description",
    "members": ["example"],
    "special_plates": ["example"],
    "checkpoints": ["example"],
    "watchlists": ["example"],
    "permissions": ["example"],
    "visible": true,
    "active": true,
    "deleted": true,
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "deleted_at": "2025-01-15T10:30:00Z",
    "deleted_by": "550e8400-e29b-41d4-a716-446655440000"
  }]
}