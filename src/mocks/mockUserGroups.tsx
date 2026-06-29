// Types
import type { UserGroupResponse } from "../types/response";

export const mockUserGroup: UserGroupResponse = {
  "endpoint": "/api/v0/<sector>/<action>",
  "statusCode": 200,
  "status": "Successful",
  "success": true,
  "message": "OK",
  "pagination": {
    "page": 1,
    "maxPage": 22,
    "limit": 10,
    "count": 10,
    "countAll": 211
  },
  "data": [
    {
      "group_id": "5f074f9c-81f3-4f27-8caa-f4d7243a38d6",
      "group_name": "admin",
      "permissions": {},
      "login_lifetime": 30,
      "approved_lifetime": 365,
      "notes": "System Admin"
    },
    {
      "group_id": "2cbff81e-1d1b-4f5a-b170-7be242c41d44",
      "group_name": "user",
      "permissions": {},
      "login_lifetime": 30,
      "approved_lifetime": 365,
      "notes": "System Users"
    }
  ]
}