// Types
import type { PositionResponse } from "../types/response";

export const mockPosition: PositionResponse = {
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
      "id": 1,
      "category": "general",
      "position_en": "string",
      "position_th": "string",
      "active": true
    }
  ]
}